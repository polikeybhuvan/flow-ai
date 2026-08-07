import { detectProvider } from "../providers";

async function waitForEditor() {
    for (let i = 0; i < 40; i++) {
        const editor = document.querySelector(
            "textarea, [contenteditable='true']"
        );

        if (editor) return;

        await new Promise((r) => setTimeout(r, 500));
    }
}

export default async function () {
    const provider = detectProvider();

    if (!provider) return;

    if (provider.id !== "claude") return;

    await waitForEditor();

    await provider.importConversation("");
}