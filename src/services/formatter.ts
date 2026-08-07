import type { ConversationExport } from "../types/conversation";

export function formatConversation(
    conversation: ConversationExport
) {
    let output = "";

    output += "# FLOWAI CONTEXT\n\n";

    output += `Platform: ${conversation.platform}\n`;
    output += `Title: ${conversation.title}\n`;
    output += `Exported: ${conversation.exportedAt}\n\n`;

    output += "===== CONVERSATION =====\n\n";

    for (const message of conversation.messages) {
        output += `${message.role.toUpperCase()}\n`;
        output += `${message.text}\n\n`;
    }

    return output;
}