import type { Provider, ConversationMessage } from "./types";

export const ChatGPTProvider: Provider = {
    id: "chatgpt",

    name: "ChatGPT",

    detect() {
        return location.hostname.includes("chatgpt");
    },

    async exportConversation(): Promise<ConversationMessage[]> {
        return Array.from(
            document.querySelectorAll("[data-message-author-role]")
        ).map((el) => ({
            role:
                (el.getAttribute("data-message-author-role") as
                    | "user"
                    | "assistant"
                    | "system") ?? "user",
            text: el.textContent?.trim() ?? "",
        }));
    },

    async importConversation(data: string): Promise<boolean> {
        const editor = document.querySelector(
            "textarea, [contenteditable='true']"
        ) as HTMLTextAreaElement | HTMLElement | null;

        if (!editor) return false;

        if (editor instanceof HTMLTextAreaElement) {
            editor.value = data;
            editor.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
            editor.textContent = data;
            editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
        }

        return true;
    },
};