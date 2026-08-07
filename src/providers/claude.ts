import type { Provider } from "./types";

export const ClaudeProvider: Provider = {
    id: "claude",

    name: "Claude",

    detect() {
        return location.hostname.includes("claude");
    },

    async exportConversation() {
        return [];
    },

    async importConversation(data: string) {
        const editor =
            document.querySelector('[contenteditable="true"]') ||
            document.querySelector("textarea");

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