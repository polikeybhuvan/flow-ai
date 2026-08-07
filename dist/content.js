(() => {
  if (globalThis.__FLOWAI_CONTENT_LOADED__) return;
  globalThis.__FLOWAI_CONTENT_LOADED__ = true;

  const STORAGE_KEY = "flowai-conversation";
  const PENDING_KEY = "flowai-pending-transfer";
  const host = location.hostname.toLowerCase();

  function providerId() {
    if (host === "chatgpt.com" || host.endsWith(".chatgpt.com")) return "chatgpt";
    if (host === "claude.ai" || host.endsWith(".claude.ai")) return "claude";
    if (host === "gemini.google.com") return "gemini";
    return null;
  }

  const provider = providerId();
  console.log("🚀 FlowAI content loaded", location.href, provider);
  if (!provider) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => String(s || "").replace(/\u200b/g, "").replace(/\n{3,}/g, "\n\n").trim();

  function uniqueMessages(messages) {
    const out = [];
    const seen = new Set();
    for (const m of messages) {
      const text = clean(m.text);
      if (!text) continue;
      const key = m.role + "::" + text;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ role: m.role, text });
    }
    return out;
  }

  function collectChatGPT() {
    const messages = [];
    document.querySelectorAll("[data-message-author-role]").forEach((el) => {
      const role = el.getAttribute("data-message-author-role");
      if (role !== "user" && role !== "assistant" && role !== "system") return;
      messages.push({ role, text: el.innerText || el.textContent || "" });
    });
    if (!messages.length) {
      document.querySelectorAll("[data-turn]").forEach((el) => {
        const role = el.getAttribute("data-turn");
        if (role !== "user" && role !== "assistant") return;
        messages.push({ role, text: el.innerText || el.textContent || "" });
      });
    }
    return uniqueMessages(messages);
  }

  function findScrollContainer() {
    const nodes = Array.from(document.querySelectorAll("body *"));
    let best = document.scrollingElement;
    let bestArea = 0;
    for (const el of nodes) {
      const s = getComputedStyle(el);
      if ((s.overflowY === "auto" || s.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 500) {
        const area = el.clientWidth * el.clientHeight;
        if (area > bestArea) { best = el; bestArea = area; }
      }
    }
    return best;
  }

  async function exportChatGPT() {
    let messages = collectChatGPT();
    if (!messages.length) { await sleep(1500); messages = collectChatGPT(); }
    if (!messages.length) return [];

    const scroller = findScrollContainer();
    if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 500) return messages;

    const original = scroller.scrollTop;
    const map = new Map();
    const collect = () => {
      for (const m of collectChatGPT()) map.set(m.role + "::" + m.text, m);
    };

    scroller.scrollTop = 0;
    await sleep(500);
    collect();
    const step = Math.max(400, Math.floor(scroller.clientHeight * 0.7));
    let last = -1;
    for (let i = 0; i < 250; i++) {
      if (scroller.scrollTop === last) break;
      last = scroller.scrollTop;
      collect();
      const next = Math.min(scroller.scrollHeight, scroller.scrollTop + step);
      scroller.scrollTop = next;
      await sleep(100);
      if (scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 5) { collect(); break; }
    }
    scroller.scrollTop = original;
    return Array.from(map.values());
  }

  function collectClaude() {
    const messages = [];
    const selectors = [
      '[data-testid="user-message"]',
      '[data-testid*="user-message"]',
      '[data-testid="assistant-message"]',
      '[data-testid*="assistant-message"]'
    ];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el) => {
        const testid = el.getAttribute("data-testid") || "";
        const role = testid.includes("user") ? "user" : "assistant";
        messages.push({ role, text: el.innerText || el.textContent || "" });
      });
    }
    return uniqueMessages(messages);
  }

  function collectGemini() {
    const messages = [];
    document.querySelectorAll("user-query").forEach((el) => messages.push({ role: "user", text: el.innerText || el.textContent || "" }));
    document.querySelectorAll("message-content, .model-response-text").forEach((el) => messages.push({ role: "assistant", text: el.innerText || el.textContent || "" }));
    return uniqueMessages(messages);
  }

  async function exportConversation() {
    let messages;
    if (provider === "chatgpt") messages = await exportChatGPT();
    else if (provider === "claude") messages = collectClaude();
    else messages = collectGemini();

    console.log("FlowAI: exported", messages.length, "messages");
    if (!messages.length) throw new Error("No messages found");
    return { platform: provider, title: document.title, url: location.href, messages };
  }

  function findEditor() {
    const selectors = provider === "claude"
      ? ['div[data-testid="chat-input"][contenteditable="true"]','div.ProseMirror[contenteditable="true"]','[contenteditable="true"]','textarea']
      : provider === "gemini"
      ? ['rich-textarea','textarea','[contenteditable="true"]','[role="textbox"]']
      : ['textarea','[contenteditable="true"]','[role="textbox"]'];

    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return el;
      }
    }
    return null;
  }

  async function waitForEditor(timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const editor = findEditor();
      if (editor) return editor;
      await sleep(250);
    }
    return null;
  }

  function clearSelection(editor) {
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertChunk(editor, text) {
    clearSelection(editor);
    try {
      if (document.execCommand("insertText", false, text)) return true;
    } catch (_) {}

    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      editor.dispatchEvent(new ClipboardEvent("paste", {
        bubbles: true, cancelable: true, clipboardData: dt
      }));
      return true;
    } catch (_) {}

    return false;
  }

  async function insertLargeText(editor, text) {
    editor.focus();

    if (editor instanceof HTMLTextAreaElement) {
      const proto = HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (!descriptor?.set) return false;
      descriptor.set.call(editor, "");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      for (let i = 0; i < text.length; i += 5000) {
        const chunk = text.slice(i, i + 5000);
        descriptor.set.call(editor, editor.value + chunk);
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: chunk }));
        await sleep(15);
      }
      return editor.value.length >= text.length * 0.95;
    }

    const sel = window.getSelection();
    if (!sel) return false;
    const range = document.createRange();
    range.selectNodeContents(editor);
    sel.removeAllRanges();
    sel.addRange(range);
    try { document.execCommand("delete"); } catch (_) { editor.textContent = ""; }

    for (let i = 0; i < text.length; i += 3500) {
      const chunk = text.slice(i, i + 3500);
      const end = document.createRange();
      end.selectNodeContents(editor);
      end.collapse(false);
      sel.removeAllRanges();
      sel.addRange(end);
      insertChunk(editor, chunk);
      await sleep(25);
    }

    await sleep(300);
    const current = editor.innerText || editor.textContent || "";
    return current.trim().length >= text.trim().length * 0.9;
  }

  function formatConversation(data) {
    return data.messages.map((m) => `${m.role.toUpperCase()}:\n${m.text}`).join("\n\n");
  }

  async function loadConversation() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY];
  }

  async function importSaved() {
    const saved = await loadConversation();
    if (!saved?.data?.messages?.length) throw new Error("No saved conversation");
    const prompt = formatConversation(saved.data);
    const editor = await waitForEditor();
    if (!editor) throw new Error("AI editor not found");

    console.log("FlowAI: importing", prompt.length, "characters into", provider);
    const ok = await insertLargeText(editor, prompt);
    if (!ok) throw new Error("Could not insert conversation into editor");
    console.log("✅ FlowAI: transfer inserted");
    return true;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PING") {
      sendResponse({ success: true, platform: provider, title: document.title, url: location.href });
      return true;
    }
    if (message?.type === "EXPORT_CHAT") {
      exportConversation()
        .then((conversation) => sendResponse({ success: true, conversation }))
        .catch((e) => sendResponse({ success: false, error: e?.message || String(e) }));
      return true;
    }
    if (message?.type === "IMPORT_CHAT") {
      importSaved()
        .then(() => sendResponse({ success: true }))
        .catch((e) => sendResponse({ success: false, error: e?.message || String(e) }));
      return true;
    }
    return false;
  });

  async function autoTransfer() {
    const result = await chrome.storage.local.get(PENDING_KEY);
    const pending = result[PENDING_KEY];
    if (!pending || pending.destination !== provider) return;

    const created = Date.parse(pending.createdAt || "");
    if (created && Date.now() - created > 10 * 60 * 1000) {
      await chrome.storage.local.remove(PENDING_KEY);
      return;
    }

    console.log("FlowAI: pending transfer detected");
    await sleep(1500);
    try {
      await importSaved();
      await chrome.storage.local.remove(PENDING_KEY);
      console.log("✅ FlowAI: automatic transfer complete");
    } catch (e) {
      console.error("FlowAI: automatic transfer failed", e);
    }
  }

  void autoTransfer();
})();
