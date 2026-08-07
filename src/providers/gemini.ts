import type { Provider } from "./types";

export const GeminiProvider: Provider = {
    id: "gemini",

    name: "Gemini",

    detect() {
        return location.hostname.includes("gemini");
    },

    async exportConversation() {
        return [];
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