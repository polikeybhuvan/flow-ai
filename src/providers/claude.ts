import type { Provider } from "./types";
import { getTransferPrompt } from "../services/transferService";

export const ClaudeProvider: Provider = {
    id: "claude",

    name: "Claude",

    detect() {
        return location.hostname.includes("claude");
    },

    async exportConversation() {
        return [];
    },

    async importConversation() {
        const prompt = await getTransferPrompt();

        if (!prompt) return false;

        const editor = document.querySelector(
            "textarea, [contenteditable='true']"
        ) as HTMLTextAreaElement | HTMLElement | null;

        if (!editor) return false;

        if (editor instanceof HTMLTextAreaElement) {
            editor.value = prompt;
            editor.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
            editor.textContent = prompt;
            editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
        }

        return true;
    },
};