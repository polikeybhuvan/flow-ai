import { ChatGPTProvider } from "./chatgpt";
import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";

export function detectProvider() {
    const hostname =
        window.location.hostname.toLowerCase();

    /*
     * ChatGPT
     */
    if (
        hostname === "chatgpt.com" ||
        hostname === "www.chatgpt.com" ||
        hostname.endsWith(".chatgpt.com")
    ) {
        console.log(
            "FlowAI: detected ChatGPT"
        );

        return ChatGPTProvider;
    }

    /*
     * Claude
     */
    if (
        hostname === "claude.ai" ||
        hostname === "www.claude.ai" ||
        hostname.endsWith(".claude.ai")
    ) {
        console.log(
            "FlowAI: detected Claude"
        );

        return ClaudeProvider;
    }

    /*
     * Gemini
     */
    if (
        hostname === "gemini.google.com" ||
        hostname === "www.gemini.google.com"
    ) {
        console.log(
            "FlowAI: detected Gemini"
        );

        return GeminiProvider;
    }

    /*
     * Popup / extension page / any other page.
     *
     * This is NOT an error.
     */
    return null;
}