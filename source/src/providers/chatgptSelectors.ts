export type ChatGPTSpeaker = "user" | "assistant";

/**
 * Current ChatGPT layouts may use search-unit keys such as
 * "...:0:user" / "...:0:assistant" on content-search units and turn keys
 * instead of the older role markers.
 */
export function roleFromContentSearchUnitKey(
    key: string | null
): ChatGPTSpeaker | null {
    const match = key?.match(/(?:^|:)(user|assistant)$/i);
    if (!match) return null;
    return match[1].toLowerCase() as ChatGPTSpeaker;
}
