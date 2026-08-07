export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    text: string;
}

export interface Provider {
    id: string;
    name: string;

    detect(): boolean;

    exportConversation(): Promise<ConversationMessage[]>;

    importConversation(data: string): Promise<boolean>;
}