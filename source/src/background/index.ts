console.log("🚀 FlowAI background service worker loaded");

chrome.runtime.onInstalled.addListener(() => {
    console.log("✅ FlowAI extension installed");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("🚀 FlowAI background service worker started");
});
