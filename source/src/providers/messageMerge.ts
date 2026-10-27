import type { ConversationMessage } from "./types";

/**
 * Returns the part of a new DOM snapshot that does not overlap the end of the
 * collected transcript. Matching is sequence-based, not global text-based, so
 * separate turns that repeat the same words are retained.
 */
export function getNonOverlappingMessages(
    collected: ConversationMessage[],
    current: ConversationMessage[]
): ConversationMessage[] {
    let overlap = Math.min(collected.length, current.length);

    while (overlap > 0) {
        let matches = true;

        for (let index = 0; index < overlap; index++) {
            const existing = collected[collected.length - overlap + index];
            const incoming = current[index];

            if (
                existing.role !== incoming.role ||
                existing.text !== incoming.text
            ) {
                matches = false;
                break;
            }
        }

        if (matches) break;
        overlap--;
    }

    return current.slice(overlap);
}
