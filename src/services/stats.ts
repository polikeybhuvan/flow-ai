import type { ConversationExport } from "../types/conversation";

export function getConversationStats(
    conversation: ConversationExport
) {
    const characters = conversation.messages.reduce(
        (sum, message) => sum + message.text.length,
        0
    );

    const words = conversation.messages.reduce(
        (sum, message) => sum + message.text.split(/\s+/).length,
        0
    );

    return {
        messages: conversation.messages.length,
        words,
        characters,
    };
}