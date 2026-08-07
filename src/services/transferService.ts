import { loadConversation } from "./storage";
import { formatConversation } from "./formatter";

export async function getTransferPrompt() {
    const stored = await loadConversation();

    if (!stored) {
        return null;
    }

    const conversation = stored.data;

    return formatConversation(conversation);
}