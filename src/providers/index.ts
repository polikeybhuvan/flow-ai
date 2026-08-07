import { ChatGPTProvider } from "./chatgpt";
import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";

export const Providers = [
    ChatGPTProvider,
    ClaudeProvider,
    GeminiProvider,
];

export function detectProvider() {
    return Providers.find((provider) => provider.detect());
}