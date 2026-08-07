import { ChatGPTProvider } from "../providers/chatgpt";
import { ClaudeProvider } from "../providers/claude";
import { GeminiProvider } from "../providers/gemini";

console.log("🚀 FlowAI content script loaded!");

function provider() {
    if (ChatGPTProvider.detect()) return ChatGPTProvider;
    if (ClaudeProvider.detect()) return ClaudeProvider;
    if (GeminiProvider.detect()) return GeminiProvider;

    return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const current = provider();

    if (!current) {
        sendResponse({
            success: false,
        });

        return true;
    }

    if (message.type === "PING") {
        sendResponse({
            success: true,
            platform: current.id,
            url: location.href,
            title: document.title,
        });

        return true;
    }

    if (message.type === "EXPORT_CHAT") {
        current.exportConversation().then((messages) => {
            sendResponse({
                success: true,
                conversation: {
                    platform: current.id,
                    title: document.title,
                    url: location.href,
                    messages,
                },
            });
        });

        return true;
    }

    if (message.type === "IMPORT_CHAT") {
        chrome.storage.local
            .get("flowai-conversation")
            .then(async (stored) => {
                const saved = stored[
                    "flowai-conversation"
                ] as
                    | {
                        version: number;
                        data: {
                            platform: string;
                            title: string;
                            url: string;
                            exportedAt: string;
                            messages: {
                                role: string;
                                text: string;
                            }[];
                        };
                    }
                    | undefined;

                if (!saved) {
                    sendResponse({
                        success: false,
                        error: "No saved conversation",
                    });

                    return;
                }

                const prompt = saved.data.messages
                    .map(
                        (m) =>
                            `${m.role.toUpperCase()}:\n${m.text}`
                    )
                    .join("\n\n");

                const imported = await current.importConversation(prompt);

                sendResponse({
                    success: imported,
                });
            })
            .catch((err) => {
                console.error(err);

                sendResponse({
                    success: false,
                    error: String(err),
                });
            });

        return true;
    }

    return true;
});