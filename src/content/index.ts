import "../content/claude";

console.log("🚀 FlowAI content script loaded!");

function detectPlatform() {
    const host = window.location.hostname;

    if (host.includes("chatgpt")) return "chatgpt";
    if (host.includes("claude")) return "claude";
    if (host.includes("gemini")) return "gemini";

    return "unknown";
}

function exportConversation() {
    const messages: {
        role: "user" | "assistant";
        text: string;
    }[] = [];

    if (detectPlatform() === "chatgpt") {
        document
            .querySelectorAll("[data-message-author-role]")
            .forEach((el) => {
                const role = el.getAttribute(
                    "data-message-author-role"
                ) as "user" | "assistant";

                const text = el.textContent?.trim();

                if (text) {
                    messages.push({
                        role,
                        text,
                    });
                }
            });
    }

    return {
        success: true,
        conversation: {
            platform: detectPlatform(),
            title: document.title,
            url: location.href,
            messages,
        },
    };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING") {
        sendResponse({
            success: true,
            url: location.href,
            title: document.title,
        });

        return true;
    }

    if (message.type === "EXPORT_CHAT") {
        sendResponse(exportConversation());

        return true;
    }

    return true;
});