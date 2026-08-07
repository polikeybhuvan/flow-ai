import { loadConversation } from "../services/storage";
import { formatConversation } from "./formatter";

export async function getTransferPrompt() {
    const stored = await loadConversation();

    if (!stored) {
        return null;
    }

    return formatConversation(stored.data);
}