import { detectProvider } from "../providers";
import { getTransferPrompt } from "./transferService";

export async function runTransfer() {
  const provider = detectProvider();
  const prompt = await getTransferPrompt();

  if (!provider || !prompt) return false;

  return provider.importConversation(prompt);
}
