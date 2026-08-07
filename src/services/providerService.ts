import { detectProvider } from "../providers";

export function getCurrentProvider() {
    const provider = detectProvider();

    if (!provider) {
        return {
            id: "unknown",
            name: "Unknown",
        };
    }

    return provider;
}