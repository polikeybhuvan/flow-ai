import type { ConversationExport } from "../types/conversation";
import { buildPrompt } from "./promptBuilder";

export function formatConversation(
    conversation: ConversationExport
) {
    return buildPrompt(conversation.messages);
}