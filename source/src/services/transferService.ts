import { openProvider, type ProviderId } from "./navigation";
import {
    loadConversation,
    setPendingTransfer,
} from "./storage";
import { formatConversation } from "./formatter";

export async function getTransferPrompt(): Promise<string | null> {
    const stored = await loadConversation();

    if (!stored) {
        return null;
    }

    return formatConversation(stored.data);
}

export async function transferConversation(
    destination: ProviderId
) {
    const stored = await loadConversation();

    if (
        !stored ||
        stored.data.messages.length === 0
    ) {
        throw new Error(
            "Export a conversation first."
        );
    }

    /*
     * Store the pending transfer BEFORE opening
     * the destination tab.
     *
     * The destination content script will detect
     * this when the page loads.
     */
    await setPendingTransfer({
        destination,
        createdAt: new Date().toISOString(),
    });

    console.log(
        `FlowAI: pending transfer → ${destination}`
    );

    const tab = await openProvider(destination);

    console.log(
        "FlowAI: destination opened",
        tab.id
    );

    return tab;
}