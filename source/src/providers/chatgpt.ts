import type {
    ConversationMessage,
    Provider,
} from "./types";

import { insertLargeText } from "./largeText";
import { getNonOverlappingMessages } from "./messageMerge";

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
type ChatGPTCandidate = {
    element: HTMLElement;
    role: ConversationMessage["role"];
    text: string;
};

type ChatGPTSpeaker = "user" | "assistant";

/**
 * Current ChatGPT layouts may use search-unit keys such as
 * "...:0:user" / "...:0:assistant" instead of the older role markers.
 * Exported separately so this compatibility rule can be unit-tested.
 */
export function roleFromContentSearchUnitKey(
    key: string | null
): ChatGPTSpeaker | null {
    const match = key?.match(/(?:^|:)(user|assistant)$/i);
    if (!match) return null;
    return match[1].toLowerCase() as ChatGPTSpeaker;
}

function roleFromAttributes(element: HTMLElement): ChatGPTSpeaker | null {
    const candidates = [
        element.getAttribute("data-message-author-role"),
        element.getAttribute("data-role"),
        element.getAttribute("data-message-author"),
        element.getAttribute("data-turn"),
    ];

    for (const candidate of candidates) {
        if (candidate === "user" || candidate === "assistant") {
            return candidate;
        }
    }

    return null;
}

function readElementText(element: HTMLElement): string {
    return cleanText(element.innerText || element.textContent || "");
}

function preferredContentText(
    root: HTMLElement,
    role: ChatGPTSpeaker,
    allowRootFallback = true
): string {
    const selectors =
        role === "user"
            ? [
                  '[data-user-message-bubble="true"]',
                  '[data-message-author-role="user"]',
                  '[data-role="user"]',
                  '[data-message-author="user"]',
                  ".whitespace-pre-wrap",
              ]
            : [
                  '[data-markdown-text-style="assistant-message"]',
                  '[data-message-author-role="assistant"]',
                  '[data-role="assistant"]',
                  '[data-message-author="assistant"]',
                  ".markdown",
                  ".prose",
              ];

    for (const selector of selectors) {
        const matches = [
            ...(root.matches(selector) ? [root] : []),
            ...Array.from(root.querySelectorAll<HTMLElement>(selector)),
        ];
        if (!matches.length) continue;

        // Prefer outer content containers so nested markup is not duplicated.
        const outermost = matches.filter(
            (candidate) =>
                !matches.some(
                    (other) =>
                        other !== candidate && other.contains(candidate)
                )
        );
        const text = outermost
            .map(readElementText)
            .filter(Boolean)
            .join("\n\n");

        if (text) return text;
    }

    return allowRootFallback ? readElementText(root) : "";
}

function removeNestedDuplicateCandidates(
    candidates: ChatGPTCandidate[]
): ChatGPTCandidate[] {
    const filtered = candidates.filter(
        (candidate) =>
            !candidates.some(
                (other) =>
                    other !== candidate &&
                    other.role === candidate.role &&
                    other.text === candidate.text &&
                    other.element !== candidate.element &&
                    other.element.contains(candidate.element)
            )
    );

    return filtered;
}

function collectFromRoleAttributes(): ChatGPTCandidate[] {
    const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
            "[data-message-author-role], [data-role], [data-message-author]"
        )
    );

    const candidates: ChatGPTCandidate[] = [];

    for (const element of elements) {
        const role = roleFromAttributes(element);
        if (!role) continue;

        const text = preferredContentText(element, role);
        if (text) candidates.push({ element, role, text });
    }

    return removeNestedDuplicateCandidates(candidates);
}

function collectFromDataTurns(): ChatGPTCandidate[] {
    const elements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-turn]")
    );
    const candidates: ChatGPTCandidate[] = [];

    for (const element of elements) {
        const role = roleFromAttributes(element);
        if (!role) continue;

        const text = preferredContentText(element, role);
        if (text) candidates.push({ element, role, text });
    }

    return removeNestedDuplicateCandidates(candidates);
}

function collectFromContentSearchUnits(): ChatGPTCandidate[] {
    const units = Array.from(
        document.querySelectorAll<HTMLElement>("[data-content-search-unit-key]")
    );
    const candidates: ChatGPTCandidate[] = [];

    for (const unit of units) {
        const role =
            roleFromContentSearchUnitKey(
                unit.getAttribute("data-content-search-unit-key")
            ) || roleFromAttributes(unit);

        if (!role) continue;

        const text = preferredContentText(unit, role);
        if (text) candidates.push({ element: unit, role, text });
    }

    return removeNestedDuplicateCandidates(candidates);
}

function collectFromTurnKeys(): ChatGPTCandidate[] {
    const turns = Array.from(
        document.querySelectorAll<HTMLElement>("[data-turn-key]")
    );
    const candidates: ChatGPTCandidate[] = [];

    for (const turn of turns) {
        // Newer ChatGPT layouts expose the role on the message content
        // rather than on the turn wrapper. A single wrapper can contain
        // both role-specific nodes, so inspect each role independently.
        for (const role of ["user", "assistant"] as const) {
            const text = preferredContentText(turn, role, false);
            if (text) candidates.push({ element: turn, role, text });
        }
    }

    return removeNestedDuplicateCandidates(candidates);
}

function collectFromRoleClasses(): ChatGPTCandidate[] {
    const selectors = [
        { selector: ".user-turn", role: "user" as const },
        { selector: ".agent-turn", role: "assistant" as const },
    ];
    const candidates: ChatGPTCandidate[] = [];

    for (const item of selectors) {
        for (const element of document.querySelectorAll<HTMLElement>(item.selector)) {
            const text = preferredContentText(element, item.role);
            if (text) candidates.push({ element, role: item.role, text });
        }
    }

    return removeNestedDuplicateCandidates(candidates);
}

/**
 * Support both the classic ChatGPT DOM and newer account-specific layouts.
 * The newer Chat / Work shell may omit data-message-author-role and data-turn,
 * and instead expose data-content-search-unit-key / data-turn-key markers.
 */
function collectChatGPTMessages(): ConversationMessage[] {
    const strategies = [
        collectFromRoleAttributes,
        collectFromDataTurns,
        collectFromContentSearchUnits,
        collectFromTurnKeys,
        collectFromRoleClasses,
    ];

    for (const collect of strategies) {
        const candidates = collect().filter((candidate) => candidate.text);
        if (candidates.length) {
            return candidates.map(({ role, text }) => ({ role, text }));
        }
    }

    return [];
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

    if (best) return best;

    const rootScroller = document.scrollingElement as HTMLElement | null;
    if (rootScroller && rootScroller.scrollHeight > rootScroller.clientHeight + 300) {
        return rootScroller;
    }

    const documentElement = document.documentElement;
    return documentElement.scrollHeight > documentElement.clientHeight + 300
        ? documentElement
        : null;
}

async function collectChatGPTMessagesFully(): Promise<ConversationMessage[]> {
    const first = collectChatGPTMessages();
    if (!first.length) return [];

    const container = findScrollableElement();
    if (!container) return first;

    const originalTop = container.scrollTop;
    const collected: ConversationMessage[] = [];

    const addCurrent = () => {
        const current = collectChatGPTMessages();
        if (!current.length) return;

        // Merge overlapping snapshots without dropping separate repeated turns.
        collected.push(...getNonOverlappingMessages(collected, current));
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

    // Captures were collected from the top to the bottom of the chat.
    return collected.length ? collected : first;
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