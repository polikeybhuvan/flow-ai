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