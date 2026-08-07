import { detectProvider } from "../providers";

async function waitForEditor() {
    for (let i = 0; i < 40; i++) {
        const editor = document.querySelector(
            "textarea, [contenteditable='true']"
        );

        if (editor) {
            return editor;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return null;
}

async function autoTransfer() {
    const provider = detectProvider();

    if (!provider) return;

    if (provider.id !== "claude") return;

    await waitForEditor();

    await provider.importConversation("");
}

window.addEventListener("load", () => {
    setTimeout(autoTransfer, 1500);
});