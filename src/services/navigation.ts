export async function openClaude() {
    await chrome.tabs.create({
        url: "https://claude.ai/new",
    });
}

export async function openGemini() {
    await chrome.tabs.create({
        url: "https://gemini.google.com/app",
    });
}

export async function openChatGPT() {
    await chrome.tabs.create({
        url: "https://chatgpt.com/",
    });
}

export async function openPlatform(
    platform: "chatgpt" | "claude" | "gemini"
) {
    switch (platform) {
        case "chatgpt":
            return openChatGPT();

        case "claude":
            return openClaude();

        case "gemini":
            return openGemini();
    }
}