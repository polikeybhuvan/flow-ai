import type { ConversationExport } from "../types/conversation";

export function downloadConversation(data: ConversationExport) {
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        {
            type: "application/json",
        }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `${data.platform}-conversation.json`;

    a.click();

    URL.revokeObjectURL(url);
}