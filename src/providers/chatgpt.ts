import type { Provider } from "./types";

export const ChatGPTProvider: Provider = {
    id: "chatgpt",

    name: "ChatGPT",

    detect() {
        return location.hostname.includes("chatgpt");
    },

    async exportConversation() {
        const messages = [
            ...document.querySelectorAll("[data-message-author-role]"),
        ].map((el) => ({
            role: el.getAttribute("data-message-author-role"),
            text: el.textContent?.trim() ?? "",
        }));

        return messages;
    },

    async importConversation(data: string) {
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