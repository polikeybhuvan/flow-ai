chrome.runtime.onInstalled.addListener(() => {
    console.log("🚀 FlowAI background started");
});

chrome.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
    if (info.status !== "complete") return;

    if (!tab.url) return;

    if (!tab.url.includes("claude.ai")) return;

    try {
        await chrome.tabs.sendMessage(tab.id!, {
            type: "AUTO_TRANSFER",
        });
    } catch (e) {
        console.log("Claude not ready yet", e);
    }
});