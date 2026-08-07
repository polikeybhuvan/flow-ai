import type { Provider } from "./types";

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export const ClaudeProvider: Provider = {
    id: "claude",

    name: "Claude",

    detect() {
        return location.hostname.includes("claude.ai");
    },

    async exportConversation() {
        return Array.from(
            document.querySelectorAll(
                '[data-testid="user-message"], [data-testid="assistant-message"]'
            )
        ).map((el) => ({
            role: (
                el.getAttribute("data-testid")?.includes("user")
                    ? "user"
                    : "assistant"
            ) as "user" | "assistant" | "system",
            text: el.textContent?.trim() ?? "",
        }));
    },

    async importConversation(data: string) {
        for (let i = 0; i < 20; i++) {
            const editor = document.querySelector(
                'div[contenteditable="true"], textarea'
            ) as HTMLElement | HTMLTextAreaElement | null;

            if (!editor) {
                await sleep(500);
                continue;
            }

            editor.focus();

            try {
                await navigator.clipboard.writeText(data);
            } catch (err) {
                console.error("Clipboard write failed:", err);
            }

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
                        cancelable: true,
                        inputType: "insertText",
                        data,
                    })
                );
            }

            return true;
        }

        return false;
    },
};