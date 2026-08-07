export interface Provider {
    id: string;
    name: string;

    detect(): boolean;

    exportConversation(): Promise<any>;

    importConversation(data: string): Promise<boolean>;
}