import { useEffect, useState } from "react";
import { downloadConversation } from "./services/exportService";
import { saveConversation } from "./services/storage";
import { transferConversation } from "./services/transferService";
import type { ProviderId } from "./services/navigation";
import type { ConversationExport } from "./types/conversation";

const providerLabels: Record<ProviderId, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
};

function isProviderId(value: unknown): value is ProviderId {
    return (
        value === "chatgpt" ||
        value === "claude" ||
        value === "gemini"
    );
}

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });

    if (!tab?.id) {
        throw new Error("No active tab");
    }

    return tab;
}

async function pingActiveTab() {
    const tab = await getActiveTab();

    try {
        const response = await chrome.tabs.sendMessage(tab.id!, {
            type: "PING",
        });

        if (response?.success && isProviderId(response.platform)) {
            return response;
        }
    } catch {
        // The content script may not have been injected into an already-open tab.
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ["content.js"],
        });

        await new Promise((resolve) => setTimeout(resolve, 150));

        const response = await chrome.tabs.sendMessage(tab.id!, {
            type: "PING",
        });

        if (response?.success && isProviderId(response.platform)) {
            return response;
        }
    } catch (error) {
        throw new Error(
            "FlowAI could not connect to this AI page. Refresh the page and try again. " +
                (error instanceof Error ? error.message : String(error))
        );
    }

    throw new Error("This is not a supported AI page.");
}

export default function App() {
    const [provider, setProvider] = useState<{
        id: ProviderId | "unknown";
        name: string;
    }>({
        id: "unknown",
        name: "Detecting...",
    });

    const [conversation, setConversation] =
        useState<ConversationExport | null>(null);

    const [destination, setDestination] =
        useState<ProviderId>("claude");

    const [status, setStatus] = useState("Ready");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        void pingActiveTab()
            .then((response) => {
                const id = response.platform as ProviderId;
                setProvider({
                    id,
                    name: providerLabels[id],
                });

                setDestination((current) =>
                    current === id
                        ? id === "chatgpt"
                            ? "claude"
                            : "chatgpt"
                        : current
                );
            })
            .catch((error: unknown) => {
                setProvider({
                    id: "unknown",
                    name: "No AI detected",
                });
                setStatus(
                    error instanceof Error
                        ? error.message
                        : String(error)
                );
            });
    }, []);

    async function exportConversation() {
        setBusy(true);
        setStatus("Exporting...");

        try {
            const response = await pingActiveTab();

            const tab = await getActiveTab();

            const result = await chrome.tabs.sendMessage(tab.id!, {
                type: "EXPORT_CHAT",
            });

            if (!result?.success || !result.conversation) {
                throw new Error(
                    result?.error ??
                        "No conversation messages found"
                );
            }

            const data: ConversationExport = {
                platform: result.conversation.platform,
                title:
                    result.conversation.title ||
                    "Untitled conversation",
                url: result.conversation.url,
                exportedAt: new Date().toISOString(),
                messages: result.conversation.messages,
            };

            await saveConversation(data);
            setConversation(data);

            if (isProviderId(response.platform)) {
                setProvider({
                    id: response.platform,
                    name: providerLabels[response.platform],
                });
            }

            setDestination((current) =>
                current === data.platform
                    ? data.platform === "chatgpt"
                        ? "claude"
                        : "chatgpt"
                    : current
            );

            setStatus(
                `Exported ${data.messages.length} messages (${data.messages.reduce(
                    (n, m) => n + m.text.length,
                    0
                ).toLocaleString()} characters)`
            );
        } catch (error: unknown) {
            console.error(error);
            setStatus(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        } finally {
            setBusy(false);
        }
    }

    async function handleTransfer() {
        if (!conversation) {
            setStatus("Export a conversation first");
            return;
        }

        if (destination === conversation.platform) {
            setStatus("Choose a different destination");
            return;
        }

        setBusy(true);
        setStatus(`Opening ${providerLabels[destination]}...`);

        try {
            await transferConversation(destination);
            setStatus(
                `Transfer queued. ${providerLabels[destination]} will receive the conversation.`
            );

            setTimeout(() => window.close(), 500);
        } catch (error: unknown) {
            console.error(error);
            setStatus(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
            setBusy(false);
        }
    }

    function handleDownload() {
        if (!conversation) return;
        downloadConversation(conversation);
        setStatus("Conversation downloaded");
    }

    const currentId = provider.id;

    return (
        <main
            style={{
                width: 380,
                padding: 20,
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
            }}
        >
            <h2 style={{ marginTop: 0 }}>🚀 FlowAI</h2>

            <div
                style={{
                    background: "#f5f5f5",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 14,
                }}
            >
                <strong>Current AI</strong>
                <div style={{ marginTop: 5 }}>
                    {provider.name}
                </div>
            </div>

            <div style={{ marginBottom: 14 }}>
                <label htmlFor="destination">
                    <strong>Transfer to</strong>
                </label>
                <select
                    id="destination"
                    value={destination}
                    onChange={(event) =>
                        setDestination(
                            event.target.value as ProviderId
                        )
                    }
                    style={{
                        width: "100%",
                        padding: 11,
                        marginTop: 7,
                        borderRadius: 7,
                    }}
                >
                    <option
                        value="chatgpt"
                        disabled={currentId === "chatgpt"}
                    >
                        ChatGPT
                    </option>
                    <option
                        value="claude"
                        disabled={currentId === "claude"}
                    >
                        Claude
                    </option>
                    <option
                        value="gemini"
                        disabled={currentId === "gemini"}
                    >
                        Gemini
                    </option>
                </select>
            </div>

            <p style={{ fontSize: 13, minHeight: 36 }}>
                <strong>Status:</strong> {status}
            </p>

            <button
                disabled={busy || currentId === "unknown"}
                onClick={() => void exportConversation()}
                style={{
                    width: "100%",
                    padding: 12,
                    marginBottom: 9,
                }}
            >
                📤 Export Conversation
            </button>

            <button
                disabled={busy || !conversation}
                onClick={() => void handleTransfer()}
                style={{
                    width: "100%",
                    padding: 12,
                    marginBottom: 9,
                }}
            >
                🚀 Transfer Conversation
            </button>

            <button
                disabled={!conversation || busy}
                onClick={handleDownload}
                style={{
                    width: "100%",
                    padding: 12,
                }}
            >
                💾 Download JSON
            </button>

            {conversation && (
                <section
                    style={{
                        marginTop: 16,
                        maxHeight: 180,
                        overflow: "auto",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 12,
                    }}
                >
                    <strong>{conversation.title}</strong>
                    <div style={{ marginTop: 8 }}>
                        Platform: {conversation.platform}
                    </div>
                    <div>
                        Messages: {conversation.messages.length}
                    </div>
                </section>
            )}
        </main>
    );
}
