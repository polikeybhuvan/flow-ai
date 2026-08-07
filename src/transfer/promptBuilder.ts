import type { ConversationMessage } from "../types/conversation";

export function buildPrompt(messages: ConversationMessage[]) {
    return messages
        .map(
            (message) =>
                `### ${message.role.toUpperCase()}\n${message.text}`
        )
        .join("\n\n");
}