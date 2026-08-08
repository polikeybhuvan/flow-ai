# 🚀 FlowAI

### Switch AI models without losing context.

> **FlowAI** is a browser extension that lets developers seamlessly move an ongoing AI conversation between **ChatGPT, Claude, and Gemini** without manually copying, rebuilding, or losing project context.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)

---

## 🎯 The Problem

Developers increasingly use multiple AI assistants because different models are better at different tasks.

For example:

- ChatGPT for exploration and implementation
- Claude for long-context reasoning
- Gemini for research and alternative approaches

But switching between them usually means:

1. Copying the conversation manually
2. Losing previous context
3. Reformatting prompts
4. Rebuilding the conversation
5. Fighting context limits on long chats

**FlowAI removes that friction.**

---

# 💡 The Solution

FlowAI acts as a context bridge between AI assistants.

```text
┌───────────┐
│  ChatGPT  │
└─────┬─────┘
      │
      │ Export
      ▼
┌───────────┐
│  FlowAI   │
│ Context   │
│   Bridge  │
└─────┬─────┘
      │
      │ Import
      ▼
┌───────────┐
│  Claude   │
└───────────┘

        ↕
     Gemini
