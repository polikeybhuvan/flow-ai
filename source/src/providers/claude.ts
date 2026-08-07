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

function collectMessages(): ConversationMessage[] {
    const found: Array<{
        element: Element;
        role: ConversationMessage["role"];
    }> = [];

    const userSelectors = [
        '[data-testid="user-message"]',
        '[data-testid*="user-message"]',
    ];

    const assistantSelectors = [
        '[data-testid="assistant-message"]',
        '[data-testid*="assistant-message"]',
    ];

    for (const selector of userSelectors) {
        document
            .querySelectorAll(selector)
            .forEach((element) => {
                found.push({
                    element,
                    role: "user",
                });
            });
    }

    for (const selector of assistantSelectors) {
        document
            .querySelectorAll(selector)
            .forEach((element) => {
                found.push({
                    element,
                    role: "assistant",
                });
            });
    }

    /*
     * Remove duplicate elements.
     */
    const unique = new Map<
        Element,
        ConversationMessage["role"]
    >();

    for (const item of found) {
        if (!unique.has(item.element)) {
            unique.set(
                item.element,
                item.role
            );
        }
    }

    /*
     * Restore DOM order.
     */
    const ordered =
        Array.from(unique.entries());

    ordered.sort(([a], [b]) => {
        const position =
            a.compareDocumentPosition(b);

        if (
            position &
            Node.DOCUMENT_POSITION_FOLLOWING
        ) {
            return -1;
        }

        if (
            position &
            Node.DOCUMENT_POSITION_PRECEDING
        ) {
            return 1;
        }

        return 0;
    });

    return ordered.flatMap(
        ([element, role]) => {
            const text =
                textOf(element);

            if (!text) {
                return [];
            }

            return [
                {
                    role,
                    text,
                },
            ];
        }
    );
}

function findClaudeEditor(): HTMLElement | null {
    const selectors = [
        'div[data-testid="chat-input"][contenteditable="true"]',
        'div.ProseMirror[contenteditable="true"]',
        '[data-testid="chat-input"]',
        '[contenteditable="true"][role="textbox"]',
        '[contenteditable="true"]',
        '[role="textbox"]',
        "textarea",
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

async function waitForClaudeEditor(
    timeoutMs = 30000
): Promise<HTMLElement | null> {
    const start = Date.now();

    while (
        Date.now() - start < timeoutMs
    ) {
        const editor =
            findClaudeEditor();

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

export const ClaudeProvider: Provider = {
    id: "claude",

    name: "Claude",

    detect(): boolean {
        const hostname = getHostname();

        const detected =
            hostname === "claude.ai" ||
            hostname === "www.claude.ai" ||
            hostname.endsWith(".claude.ai");

        console.log(
            "FlowAI: Claude detection",
            hostname,
            detected
        );

        return detected;
    },

    async exportConversation(): Promise<
        ConversationMessage[]
    > {
        console.log(
            "FlowAI: exporting Claude conversation..."
        );

        const messages =
            collectMessages();

        console.log(
            "FlowAI: Claude messages:",
            messages.length
        );

        console.log(
            "FlowAI: Claude characters:",
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
                "FlowAI: empty Claude transfer"
            );

            return false;
        }

        console.log(
            "FlowAI: Claude transfer size:",
            data.length,
            "characters"
        );

        console.log(
            "FlowAI: waiting for Claude editor..."
        );

        const editor =
            await waitForClaudeEditor();

        if (!editor) {
            console.error(
                "FlowAI: Claude editor not found"
            );

            return false;
        }

        console.log(
            "FlowAI: Claude editor found"
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
                "FlowAI: Claude large-text insertion failed"
            );

            return false;
        }

        await sleep(500);

        const current =
            getEditorText(editor);

        console.log(
            "FlowAI: Claude editor characters:",
            current.length
        );

        if (
            current.length >=
            data.trim().length * 0.95
        ) {
            console.log(
                "✅ FlowAI: Claude conversation injected"
            );

            return true;
        }

        /*
         * Retry.
         */
        console.log(
            "FlowAI: Claude insertion appears incomplete. Retrying..."
        );

        await sleep(1000);

        const retryEditor =
            findClaudeEditor();

        if (!retryEditor) {
            console.error(
                "FlowAI: Claude editor disappeared"
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
                "✅ FlowAI: Claude retry succeeded"
            );

            return true;
        }

        console.error(
            "❌ FlowAI: Claude transfer incomplete"
        );

        return false;
    },
};