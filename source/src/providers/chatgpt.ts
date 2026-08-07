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
    return window.location.hostname.toLowerCase();
}

function cleanText(text: string): string {
    return text
        .replace(/\u200B/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/*
 * ChatGPT can virtualize parts of long conversations.
 * We therefore support multiple selectors.
 */
function collectChatGPTMessages(): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    const roleElements = Array.from(
        document.querySelectorAll<HTMLElement>(
            "[data-message-author-role]"
        )
    );

    for (const element of roleElements) {
        const rawRole = element.getAttribute(
            "data-message-author-role"
        );

        let role: ConversationMessage["role"];

        if (rawRole === "user") role = "user";
        else if (rawRole === "assistant") role = "assistant";
        else if (rawRole === "system") role = "system";
        else continue;

        const text = cleanText(
            element.innerText || element.textContent || ""
        );

        if (text) messages.push({ role, text });
    }

    if (!messages.length) {
        const turns = Array.from(
            document.querySelectorAll<HTMLElement>("[data-turn]")
        );

        for (const turn of turns) {
            const rawRole = turn.getAttribute("data-turn");
            if (rawRole !== "user" && rawRole !== "assistant") continue;

            const text = cleanText(
                turn.innerText || turn.textContent || ""
            );

            if (text) {
                messages.push({
                    role: rawRole,
                    text,
                });
            }
        }
    }

    const unique: ConversationMessage[] = [];
    const seen = new Set<string>();

    for (const message of messages) {
        const key = `${message.role}::${message.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(message);
    }

    return unique;
}

function findScrollableElement(): HTMLElement | null {
    const candidates = Array.from(
        document.querySelectorAll<HTMLElement>("body *")
    );

    let best: HTMLElement | null = null;
    let bestHeight = 0;

    for (const element of candidates) {
        const style = getComputedStyle(element);
        const scrollable =
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            element.scrollHeight > element.clientHeight + 300;

        if (scrollable && element.clientHeight > bestHeight) {
            best = element;
            bestHeight = element.clientHeight;
        }
    }

    return best;
}

async function collectChatGPTMessagesFully(): Promise<ConversationMessage[]> {
    const first = collectChatGPTMessages();
    if (!first.length) return [];

    const container = findScrollableElement();
    if (!container) return first;

    const originalTop = container.scrollTop;
    const collected = new Map<string, ConversationMessage>();

    const addCurrent = () => {
        for (const message of collectChatGPTMessages()) {
            const key = `${message.role}::${message.text}`;
            if (!collected.has(key)) collected.set(key, message);
        }
    };

    container.scrollTop = 0;
    await sleep(400);
    addCurrent();

    const step = Math.max(500, Math.floor(container.clientHeight * 0.75));
    let previousTop = -1;

    for (let i = 0; i < 200; i++) {
        if (container.scrollTop === previousTop) break;
        previousTop = container.scrollTop;

        addCurrent();

        const next = Math.min(
            container.scrollHeight,
            container.scrollTop + step
        );

        container.scrollTop = next;
        await sleep(120);

        if (container.scrollTop >= container.scrollHeight - container.clientHeight - 4) {
            addCurrent();
            break;
        }
    }

    container.scrollTop = originalTop;

    // The scroll pass is only a fallback for virtualized long chats. Keep the
    // normal DOM order whenever possible.
    const finalVisible = collectChatGPTMessages();
    const ordered: ConversationMessage[] = [];
    const used = new Set<string>();

    for (const message of finalVisible) {
        const key = `${message.role}::${message.text}`;
        if (!used.has(key)) {
            used.add(key);
            ordered.push(message);
        }
    }

    for (const message of collected.values()) {
        const key = `${message.role}::${message.text}`;
        if (!used.has(key)) {
            used.add(key);
            ordered.push(message);
        }
    }

    return ordered.length ? ordered : first;
}

/*
 * ChatGPT may still be rendering the conversation
 * when the export button is clicked.
 */
async function waitForMessages(
    timeoutMs = 10000
): Promise<ConversationMessage[]> {
    const start = Date.now();

    while (
        Date.now() - start <
        timeoutMs
    ) {
        const messages =
            collectChatGPTMessages();

        if (messages.length > 0) {
            return messages;
        }

        await sleep(500);
    }

    return [];
}

function findEditor(): HTMLElement | null {
    const selectors = [
        "textarea",
        '[contenteditable="true"]',
        '[role="textbox"]',
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

            if (
                rect.width > 0 &&
                rect.height > 0
            ) {
                return element;
            }
        }
    }

    return null;
}

async function waitForEditor(
    timeoutMs = 15000
): Promise<HTMLElement | null> {
    const start = Date.now();

    while (
        Date.now() - start <
        timeoutMs
    ) {
        const editor = findEditor();

        if (editor) {
            return editor;
        }

        await sleep(300);
    }

    return null;
}

/*
 * Normal-size text.
 */
function insertText(
    editor: HTMLElement,
    text: string
): boolean {
    editor.focus();

    const selection =
        window.getSelection();

    if (selection) {
        const range =
            document.createRange();

        range.selectNodeContents(editor);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    /*
     * Native browser editing.
     */
    try {
        const inserted =
            document.execCommand(
                "insertText",
                false,
                text
            );

        if (inserted) {
            return true;
        }
    } catch (error) {
        console.warn(
            "FlowAI: execCommand failed",
            error
        );
    }

    /*
     * Clipboard/paste fallback.
     */
    try {
        const transfer =
            new DataTransfer();

        transfer.setData(
            "text/plain",
            text
        );

        const event =
            new ClipboardEvent(
                "paste",
                {
                    bubbles: true,
                    cancelable: true,
                    clipboardData:
                        transfer,
                }
            );

        editor.dispatchEvent(event);

        return true;
    } catch (error) {
        console.warn(
            "FlowAI: paste fallback failed",
            error
        );
    }

    return false;
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

export const ChatGPTProvider: Provider = {
    id: "chatgpt",

    name: "ChatGPT",

    detect(): boolean {
        const hostname =
            getHostname();

        return (
            hostname === "chatgpt.com" ||
            hostname === "www.chatgpt.com" ||
            hostname.endsWith(
                ".chatgpt.com"
            )
        );
    },

    async exportConversation(): Promise<
        ConversationMessage[]
    > {
        console.log(
            "FlowAI: exporting ChatGPT..."
        );

        const initialMessages =
            await waitForMessages();

        const messages =
            initialMessages.length > 1
                ? await collectChatGPTMessagesFully()
                : initialMessages;

        if (messages.length === 0) {
            console.error(
                "FlowAI: no ChatGPT messages found"
            );

            /*
             * Useful debugging information.
             */
            console.log(
                "FlowAI: URL:",
                location.href
            );

            console.log(
                "FlowAI: role elements:",
                document.querySelectorAll(
                    "[data-message-author-role]"
                ).length
            );

            console.log(
                "FlowAI: turn elements:",
                document.querySelectorAll(
                    "[data-turn]"
                ).length
            );

            return [];
        }

        console.log(
            `FlowAI: exported ${messages.length} ChatGPT messages`
        );

        return messages;
    },

    async importConversation(
        data: string
    ): Promise<boolean> {
        if (!data.trim()) {
            console.error(
                "FlowAI: empty ChatGPT transfer"
            );

            return false;
        }

        const editor =
            await waitForEditor();

        if (!editor) {
            console.error(
                "FlowAI: ChatGPT editor not found"
            );

            return false;
        }

        /*
         * Long conversations need a different
         * insertion path.
         */
        if (data.length > 12000) {
            console.log(
                `FlowAI: large transfer detected (${data.length} chars)`
            );

            try {
                const result =
                    await insertLargeText(
                        editor,
                        data
                    );

                if (result) {
                    console.log(
                        "✅ FlowAI: large ChatGPT transfer inserted"
                    );

                    return true;
                }
            } catch (error) {
                console.error(
                    "FlowAI: large text insertion failed",
                    error
                );
            }
        }

        /*
         * Normal transfer.
         */
        const inserted =
            insertText(
                editor,
                data
            );

        if (!inserted) {
            return false;
        }

        await sleep(500);

        if (
            getEditorText(editor).length > 0
        ) {
            console.log(
                "✅ FlowAI: ChatGPT transfer inserted"
            );

            return true;
        }

        /*
         * Retry.
         */
        await sleep(1000);

        const retryEditor =
            findEditor();

        if (!retryEditor) {
            return false;
        }

        const retry =
            insertText(
                retryEditor,
                data
            );

        await sleep(500);

        if (
            retry &&
            getEditorText(
                retryEditor
            ).length > 0
        ) {
            console.log(
                "✅ FlowAI: ChatGPT retry succeeded"
            );

            return true;
        }

        return false;
    },
};