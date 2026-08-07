chrome.runtime.onInstalled.addListener(() => {
    console.log("FlowAI background started");
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (info.status !== "complete") return;

    if (!tab.url) return;

    if (
        !tab.url.includes("claude.ai") &&
        !tab.url.includes("gemini.google.com")
    ) {
        return;
    }

    const stored = await chrome.storage.local.get("flowai-conversation");

    if (!stored["flowai-conversation"]) {
        return;
    }

    setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
            type: "IMPORT_CHAT",
        });
    }, 2500);
});