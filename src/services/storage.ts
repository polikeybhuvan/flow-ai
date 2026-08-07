import type { ConversationExport } from "../types/conversation";

const STORAGE_KEY = "flowai-conversation";
const STORAGE_VERSION = 1;

export interface StoredConversation {
    version: number;
    data: ConversationExport;
}

export async function saveConversation(
    conversation: ConversationExport
): Promise<void> {
    await chrome.storage.local.set({
        [STORAGE_KEY]: {
            version: STORAGE_VERSION,
            data: conversation,
        } satisfies StoredConversation,
    });
}

export async function loadConversation(): Promise<StoredConversation | null> {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    return (result[STORAGE_KEY] as StoredConversation) ?? null;
}

export async function clearConversation(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
}