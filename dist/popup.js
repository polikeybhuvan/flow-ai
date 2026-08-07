(() => {
  const labels = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini" };
  let current = "unknown";
  let conversation = null;

  const $ = (id) => document.getElementById(id);
  const status = (text) => $("status").textContent = text;

  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    return tab;
  }

  async function connect() {
    const tab = await activeTab();
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
      if (response?.success) return response;
    } catch (_) {}

    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      await new Promise((r) => setTimeout(r, 150));
      const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
      if (response?.success) return response;
    } catch (e) {
      throw new Error("Cannot connect to this AI page. Refresh the page once and try again.");
    }
    throw new Error("This is not a supported AI page.");
  }

  async function init() {
    try {
      const response = await connect();
      current = response.platform;
      $("provider").textContent = labels[current] || current;
      const select = $("destination");
      for (const option of select.options) option.disabled = option.value === current;
      if (select.value === current) select.value = current === "chatgpt" ? "claude" : "chatgpt";
      status("Connected");
    } catch (e) {
      current = "unknown";
      $("provider").textContent = "No AI detected";
      status(e.message || String(e));
    }
  }

  $("export").addEventListener("click", async () => {
    try {
      $("export").disabled = true;
      status("Exporting...");
      const response = await connect();
      const tab = await activeTab();
      const result = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT_CHAT" });
      if (!result?.success) throw new Error(result?.error || "Export failed");
      conversation = { ...result.conversation, exportedAt: new Date().toISOString() };
      await chrome.storage.local.set({ "flowai-conversation": { version: 1, data: conversation } });
      current = response.platform;
      $("provider").textContent = labels[current];
      $("transfer").disabled = false;
      $("download").disabled = false;
      $("details").hidden = false;
      $("details").innerHTML = `<b>${escapeHtml(conversation.title || "Untitled")}</b><br><br>Platform: ${escapeHtml(conversation.platform)}<br>Messages: ${conversation.messages.length}<br>Characters: ${conversation.messages.reduce((n,m)=>n+m.text.length,0).toLocaleString()}`;
      status(`Exported ${conversation.messages.length} messages`);
    } catch (e) {
      status(e.message || String(e));
    } finally { $("export").disabled = false; }
  });

  $("transfer").addEventListener("click", async () => {
    if (!conversation) return;
    const destination = $("destination").value;
    if (destination === conversation.platform) { status("Choose a different destination"); return; }
    try {
      $("transfer").disabled = true;
      status(`Opening ${labels[destination]}...`);
      await chrome.storage.local.set({ "flowai-pending-transfer": { destination, createdAt: new Date().toISOString() } });
      const urls = { chatgpt: "https://chatgpt.com/", claude: "https://claude.ai/new", gemini: "https://gemini.google.com/app" };
      await chrome.tabs.create({ url: urls[destination] });
      status(`Transfer queued for ${labels[destination]}`);
      setTimeout(() => window.close(), 500);
    } catch (e) {
      status(e.message || String(e));
      $("transfer").disabled = false;
    }
  });

  $("download").addEventListener("click", () => {
    if (!conversation) return;
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowai-${conversation.platform}-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("JSON downloaded");
  });

  function escapeHtml(s) { return String(s).replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
  void init();
})();
