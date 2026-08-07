import type { Provider, ConversationMessage } from "./types";

export const GeminiProvider: Provider = {
    id: "gemini",

    name: "Gemini",

    detect() {
        return location.hostname.includes("gemini.google.com");
    },

    async exportConversation(): Promise<ConversationMessage[]> {
        const messages: ConversationMessage[] = [];

        const nodes = document.querySelectorAll("message-content, .model-response-text, user-query");

        nodes.forEach((node) => {
            const text = node.textContent?.trim();

            if (!text) return;

            const role =
                node.tagName.toLowerCase() === "user-query"
                    ? "user"
                    : "assistant";

            messages.push({
                role,
                text,
            });
        });

        return messages;
    },

    async importConversation(data: string): Promise<boolean> {
        const editor = document.querySelector(
            'textarea, [contenteditable="true"]'
        ) as HTMLTextAreaElement | HTMLElement | null;

        if (!editor) return false;

        if (editor instanceof HTMLTextAreaElement) {
            editor.value = data;

            editor.dispatchEvent(
                new Event("input", {
                    bubbles: true,
                })
            );
        } else {
            editor.textContent = data;

            editor.dispatchEvent(
                new InputEvent("input", {
                    bubbles: true,
                })
            );
        }

        return true;
    },
};