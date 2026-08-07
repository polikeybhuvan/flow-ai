export type ProviderId = "chatgpt" | "claude" | "gemini";

const PROVIDER_URLS: Record<ProviderId, string> = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/new",
  gemini: "https://gemini.google.com/app",
};

export async function openProvider(provider: ProviderId) {
  return chrome.tabs.create({ url: PROVIDER_URLS[provider] });
}

export function getProviderUrl(provider: ProviderId) {
  return PROVIDER_URLS[provider];
}

export async function openChatGPT() {
  return openProvider("chatgpt");
}

export async function openClaude() {
  return openProvider("claude");
}

export async function openGemini() {
  return openProvider("gemini");
}
