export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    text: string;
}

export interface ConversationExport {
    platform: "chatgpt" | "claude" | "gemini" | "unknown";
    title: string;
    url: string;
    exportedAt: string;
    messages: ConversationMessage[];
}