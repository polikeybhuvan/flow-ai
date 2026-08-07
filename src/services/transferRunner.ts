import { detectProvider } from "../providers";

export async function runTransfer() {
    const provider = detectProvider();

    if (!provider) {
        return false;
    }

    return provider.importConversation("");
}