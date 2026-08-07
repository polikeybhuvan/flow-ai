import type { ConversationExport } from "../types/conversation";

const STORAGE_KEY = "flowai-conversation";
const STORAGE_VERSION = 1;

export async function saveConversation(
    conversation: ConversationExport
) {
    await chrome.storage.local.set({
        [STORAGE_KEY]: {
            version: STORAGE_VERSION,
            data: conversation,
        },
    });
}

export async function loadConversation() {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    return result[STORAGE_KEY];
}

export async function clearConversation() {
    await chrome.storage.local.remove(STORAGE_KEY);
}