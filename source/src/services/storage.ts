import type { ConversationExport } from "../types/conversation";
import type { ProviderId } from "./navigation";

const STORAGE_KEY = "flowai-conversation";
const PENDING_KEY = "flowai-pending-transfer";
const STORAGE_VERSION = 1;

export interface StoredConversation {
  version: number;
  data: ConversationExport;
}

export interface PendingTransfer {
  destination: ProviderId;
  createdAt: string;
  tabId?: number;
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

export async function setPendingTransfer(
  transfer: PendingTransfer
): Promise<void> {
  await chrome.storage.local.set({ [PENDING_KEY]: transfer });
}

export async function getPendingTransfer(): Promise<PendingTransfer | null> {
  const result = await chrome.storage.local.get(PENDING_KEY);
  return (result[PENDING_KEY] as PendingTransfer) ?? null;
}

export async function clearPendingTransfer(): Promise<void> {
  await chrome.storage.local.remove(PENDING_KEY);
}
