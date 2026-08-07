import { useState } from "react";
import { downloadConversation } from "./services/exportService";
import { saveConversation } from "./services/storage";
import { openClaude, openGemini } from "./services/navigation";
import { getCurrentProvider } from "./services/providerService";
import type { ConversationExport } from "./types/conversation";

export default function App() {
  const provider = getCurrentProvider();

  const [conversation, setConversation] =
    useState<ConversationExport | null>(null);

  const [status, setStatus] = useState("Ready");

  async function exportConversation() {
    try {
      setStatus("Exporting...");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        setStatus("No active tab");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "EXPORT_CHAT",
      });

      if (!response?.success) {
        setStatus("Export failed");
        return;
      }

      const data: ConversationExport = {
        platform: response.conversation.platform,
        title: response.conversation.title,
        url: response.conversation.url,
        exportedAt: new Date().toISOString(),
        messages: response.conversation.messages,
      };

      await saveConversation(data);

      setConversation(data);

      setStatus(
        `Exported ${data.messages.length} messages from ${data.platform}`
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setStatus(err.message);
      } else {
        setStatus(String(err));
      }
    }
  }

  function handleDownload() {
    if (!conversation) return;

    downloadConversation(conversation);

    setStatus("Conversation downloaded");
  }

  async function handleOpenClaude() {
    await openClaude();
  }

  async function handleOpenGemini() {
    await openGemini();
  }

  return (
    <div
      style={{
        width: 380,
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>🚀 FlowAI</h2>

      <p>
        <strong>Current AI:</strong> {provider.name}
      </p>

      <p>
        <strong>Status:</strong> {status}
      </p>

      <button
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
        onClick={exportConversation}
      >
        📤 Export Conversation
      </button>

      <button
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
        disabled={!conversation}
        onClick={handleDownload}
      >
        💾 Download JSON
      </button>

      <button
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 10,
        }}
        disabled={!conversation}
        onClick={handleOpenClaude}
      >
        🤖 Continue in Claude
      </button>

      <button
        style={{
          width: "100%",
          padding: 12,
        }}
        disabled={!conversation}
        onClick={handleOpenGemini}
      >
        ✨ Continue in Gemini
      </button>

      {conversation && (
        <div
          style={{
            marginTop: 20,
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
          }}
        >
          <strong>{conversation.title}</strong>

          <br />
          <br />

          Platform: {conversation.platform}

          <br />

          Messages: {conversation.messages.length}

          <br />

          Exported:

          <br />

          {conversation.exportedAt}
        </div>
      )}
    </div>
  );
}