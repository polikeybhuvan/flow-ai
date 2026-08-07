import type {
    ConversationMessage,
    Provider,
} from "./types";

import { insertLargeText } from "./largeText";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getHostname(): string {
    if (
        typeof globalThis !== "undefined" &&
        globalThis.location
    ) {
        return globalThis.location.hostname.toLowerCase();
    }

    return "";
}

function textOf(element: Element): string {
    return (element.textContent ?? "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function findGeminiEditor(): HTMLElement | null {
    const selectors = [
        "textarea",
        '[contenteditable="true"]',
        '[role="textbox"]',
        "rich-textarea",
    ];

    for (const selector of selectors) {
        const elements =
            Array.from(
                document.querySelectorAll<HTMLElement>(
                    selector
                )
            );

        for (const element of elements) {
            const rect =
                element.getBoundingClientRect();

            const style =
                getComputedStyle(element);

            if (
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden"
            ) {
                return element;
            }
        }
    }

    return null;
}

async function waitForGeminiEditor(
    timeoutMs = 30000
): Promise<HTMLElement | null> {
    const start = Date.now();

    while (
        Date.now() - start < timeoutMs
    ) {
        const editor =
            findGeminiEditor();

        if (editor) {
            return editor;
        }

        await sleep(300);
    }

    return null;
}

function getEditorText(
    editor: HTMLElement
): string {
    if (
        editor instanceof
        HTMLTextAreaElement
    ) {
        return editor.value.trim();
    }

    return (
        editor.innerText ||
        editor.textContent ||
        ""
    ).trim();
}

function collectGeminiMessages(): ConversationMessage[] {
    const nodes =
        Array.from(
            document.querySelectorAll(
                "user-query, message-content, .model-response-text"
            )
        );

    const messages: ConversationMessage[] =
        [];

    const seen = new Set<string>();

    for (const node of nodes) {
        const text =
            textOf(node);

        if (!text) {
            continue;
        }

        const tag =
            node.tagName.toLowerCase();

        const role: ConversationMessage["role"] =
            tag === "user-query"
                ? "user"
                : "assistant";

        /*
         * Avoid duplicate assistant nodes.
         */
        const key =
            `${role}:${text}`;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);

        messages.push({
            role,
            text,
        });
    }

    return messages;
}

export const GeminiProvider: Provider = {
    id: "gemini",

    name: "Gemini",

    detect(): boolean {
        const hostname = getHostname();

        const detected =
            hostname ===
                "gemini.google.com" ||
            hostname ===
                "www.gemini.google.com";

        console.log(
            "FlowAI: Gemini detection",
            hostname,
            detected
        );

        return detected;
    },

    async exportConversation(): Promise<
        ConversationMessage[]
    > {
        console.log(
            "FlowAI: exporting Gemini conversation..."
        );

        const messages =
            collectGeminiMessages();

        console.log(
            "FlowAI: Gemini messages:",
            messages.length
        );

        console.log(
            "FlowAI: Gemini characters:",
            messages.reduce(
                (total, message) =>
                    total + message.text.length,
                0
            )
        );

        return messages;
    },

    async importConversation(
        data: string
    ): Promise<boolean> {
        if (!data.trim()) {
            console.error(
                "FlowAI: empty Gemini transfer"
            );

            return false;
        }

        console.log(
            "FlowAI: Gemini transfer size:",
            data.length,
            "characters"
        );

        console.log(
            "FlowAI: waiting for Gemini editor..."
        );

        const editor =
            await waitForGeminiEditor();

        if (!editor) {
            console.error(
                "FlowAI: Gemini editor not found"
            );

            return false;
        }

        console.log(
            "FlowAI: Gemini editor found"
        );

        await new Promise<void>(
            (resolve) => {
                requestAnimationFrame(() => {
                    resolve();
                });
            }
        );

        const inserted =
            await insertLargeText(
                editor,
                data,
                8000
            );

        if (!inserted) {
            console.error(
                "FlowAI: Gemini large-text insertion failed"
            );

            return false;
        }

        await sleep(500);

        const current =
            getEditorText(editor);

        console.log(
            "FlowAI: Gemini editor characters:",
            current.length
        );

        if (
            current.length >=
            data.trim().length * 0.95
        ) {
            console.log(
                "✅ FlowAI: Gemini conversation injected"
            );

            return true;
        }

        /*
         * Retry.
         */
        console.log(
            "FlowAI: Gemini insertion appears incomplete. Retrying..."
        );

        await sleep(1000);

        const retryEditor =
            findGeminiEditor();

        if (!retryEditor) {
            console.error(
                "FlowAI: Gemini editor disappeared"
            );

            return false;
        }

        const retry =
            await insertLargeText(
                retryEditor,
                data,
                8000
            );

        if (!retry) {
            return false;
        }

        await sleep(500);

        const retryText =
            getEditorText(
                retryEditor
            );

        if (
            retryText.length >=
            data.trim().length * 0.95
        ) {
            console.log(
                "✅ FlowAI: Gemini retry succeeded"
            );

            return true;
        }

        console.error(
            "❌ FlowAI: Gemini transfer incomplete"
        );

        return false;
    },
};