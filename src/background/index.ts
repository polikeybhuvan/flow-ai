import { getTransferPrompt } from "../transfer";

console.log("🚀 Background script loaded");

chrome.runtime.onInstalled.addListener(() => {
    console.log("🚀 FlowAI background started");
});

async function injectConversation(tabId: number) {
    const prompt = await getTransferPrompt();

    if (!prompt) {
        console.log("FlowAI: no stored conversation");
        return;
    }

    console.log("FlowAI: injecting conversation...");

    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            world: "MAIN",
            args: [prompt],

            func: async (prompt: string) => {
                function sleep(ms: number) {
                    return new Promise((resolve) =>
                        setTimeout(resolve, ms)
                    );
                }

                for (let i = 0; i < 20; i++) {
                    const editor = document.querySelector(
                        "textarea, [contenteditable='true']"
                    ) as HTMLTextAreaElement | HTMLElement | null;

                    if (!editor) {
                        console.log("FlowAI: waiting for editor...");
                        await sleep(500);
                        continue;
                    }

                    editor.focus();

                    if (editor instanceof HTMLTextAreaElement) {
                        editor.value = prompt;

                        editor.dispatchEvent(
                            new Event("input", {
                                bubbles: true,
                            })
                        );
                    } else {
                        editor.textContent = prompt;

                        editor.dispatchEvent(
                            new InputEvent("input", {
                                bubbles: true,
                                inputType: "insertText",
                                data: prompt,
                            })
                        );
                    }

                    console.log("✅ FlowAI injected");

                    return;
                }

                console.log("❌ FlowAI editor not found");
            },
        });
    } catch (err) {
        console.error("FlowAI:", err);
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("TAB UPDATED", changeInfo.status, tab.url);

    if (changeInfo.status !== "complete") return;

    if (!tab.url) return;

    if (
        tab.url.includes("claude.ai") ||
        tab.url.includes("gemini.google.com")
    ) {
        console.log("FlowAI: target detected");

        setTimeout(() => {
            injectConversation(tabId);
        }, 2500);
    }
});