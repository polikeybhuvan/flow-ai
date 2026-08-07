import { ChatGPTProvider } from "../providers/chatgpt";
import { ClaudeProvider } from "../providers/claude";
import { GeminiProvider } from "../providers/gemini";
const GLOBAL_KEY = "__FLOWAI_CONTENT_INITIALIZED__";

const STORAGE_KEY = "flowai-conversation";
const PENDING_KEY = "flowai-pending-transfer";

async function loadSavedConversation() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] as
        | {
              version: number;
              data: {
                  platform: string;
                  title: string;
                  url: string;
                  exportedAt: string;
                  messages: {
                      role: "user" | "assistant" | "system";
                      text: string;
                  }[];
              };
          }
        | undefined;
}

async function getPending() {
    const result = await chrome.storage.local.get(PENDING_KEY);
    return result[PENDING_KEY] as
        | { destination: string; createdAt: string; tabId?: number }
        | undefined;
}

async function clearPending() {
    await chrome.storage.local.remove(PENDING_KEY);
}


if (!(globalThis as Record<string, unknown>)[GLOBAL_KEY]) {
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = true;

    console.log(
        "🚀 FlowAI content script loaded:",
        location.href
    );

    function getProvider() {
        if (ChatGPTProvider.detect()) return ChatGPTProvider;
        if (ClaudeProvider.detect()) return ClaudeProvider;
        if (GeminiProvider.detect()) return GeminiProvider;
        return null;
    }

    const currentProvider = getProvider();

    if (!currentProvider) {
        console.log(
            "FlowAI: unsupported page:",
            location.hostname
        );
    } else {
        console.log(
            "FlowAI: provider detected:",
            currentProvider.name
        );

        chrome.runtime.onMessage.addListener(
            (message, _sender, sendResponse) => {
                if (message?.type === "PING") {
                    sendResponse({
                        success: true,
                        platform: currentProvider.id,
                        title: document.title,
                        url: location.href,
                    });
                    return true;
                }

                if (message?.type === "EXPORT_CHAT") {
                    void currentProvider
                        .exportConversation()
                        .then((messages) => {
                            if (!messages.length) {
                                sendResponse({
                                    success: false,
                                    error: "No messages found",
                                });
                                return;
                            }

                            sendResponse({
                                success: true,
                                conversation: {
                                    platform: currentProvider.id,
                                    title: document.title,
                                    url: location.href,
                                    messages,
                                },
                            });
                        })
                        .catch((error: unknown) => {
                            sendResponse({
                                success: false,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                            });
                        });
                    return true;
                }

                if (message?.type === "IMPORT_CHAT") {
                    void importSavedConversation()
                        .then(sendResponse)
                        .catch((error: unknown) => {
                            sendResponse({
                                success: false,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                            });
                        });
                    return true;
                }

                return false;
            }
        );

        async function importSavedConversation() {
            const saved = await loadSavedConversation();

            if (!saved?.data?.messages?.length) {
                return {
                    success: false,
                    error: "No saved conversation",
                };
            }

            const prompt = saved.data.messages
                .map(
                    (message) =>
                        `${message.role.toUpperCase()}:\n${message.text}`
                )
                .join("\n\n");

            if (!prompt.trim()) {
                return {
                    success: false,
                    error: "Conversation is empty",
                };
            }

            console.log(
                "FlowAI: importing",
                prompt.length,
                "characters into",
                currentProvider.name
            );

            const success =
                await currentProvider.importConversation(prompt);

            return { success };
        }

        async function autoImportPendingTransfer() {
            try {
                const pending = await getPending();

                if (!pending) return;
                if (pending.destination !== currentProvider.id) return;

                console.log(
                    "FlowAI: pending transfer detected for",
                    currentProvider.name
                );

                // Give the destination application time to initialize its editor.
                await new Promise((resolve) => setTimeout(resolve, 1200));

                const result = await importSavedConversation();

                if (result.success) {
                    await clearPending();
                    console.log("✅ FlowAI: automatic transfer complete");
                } else {
                    console.error(
                        "FlowAI: automatic transfer failed",
                        result.error
                    );
                }
            } catch (error) {
                console.error(
                    "FlowAI: automatic transfer error",
                    error
                );
            }
        }

        void autoImportPendingTransfer();
    }
}
