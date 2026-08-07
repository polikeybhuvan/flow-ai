console.log("🚀 FlowAI background worker loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ FlowAI installed");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 FlowAI started");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "OPEN_PROVIDER") {
    const urls = {
      chatgpt: "https://chatgpt.com/",
      claude: "https://claude.ai/new",
      gemini: "https://gemini.google.com/app"
    };
    const url = urls[message.provider];
    if (!url) {
      sendResponse({ success: false, error: "Unknown provider" });
      return false;
    }
    chrome.tabs.create({ url }).then((tab) => sendResponse({ success: true, tabId: tab.id }));
    return true;
  }
  return false;
});
