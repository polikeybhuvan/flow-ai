console.log("🚀 FlowAI background service worker loaded");

chrome.runtime.onInstalled.addListener(() => {
    console.log("✅ FlowAI extension installed");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("🚀 FlowAI background service worker started");
});

/*
 * Open Claude
 */
chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
        if (message?.type === "OPEN_CLAUDE") {
            chrome.tabs.create({
                url: "https://claude.ai/new",
            });

            sendResponse({
                success: true,
            });

            return true;
        }

        /*
         * Open Gemini
         */
        if (message?.type === "OPEN_GEMINI") {
            chrome.tabs.create({
                url: "https://gemini.google.com/app",
            });

            sendResponse({
                success: true,
            });

            return true;
        }

        return false;
    }
);

/*
 * Log tab navigation only.
 *
 * IMPORTANT:
 * Do NOT import React,
 * providers,
 * content scripts,
 * or anything that uses window/document here.
 */
chrome.tabs.onUpdated.addListener(
    (_tabId, changeInfo, tab) => {
        if (changeInfo.status !== "complete") {
            return;
        }

        if (!tab.url) {
            return;
        }

        if (
            tab.url.includes("chatgpt.com") ||
            tab.url.includes("claude.ai") ||
            tab.url.includes("gemini.google.com")
        ) {
            console.log(
                "FlowAI: AI page loaded:",
                tab.url
            );
        }
    }
);