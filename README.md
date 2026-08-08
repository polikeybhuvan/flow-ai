# 🚀 FlowAI

### Switch AI models without losing context.

> **FlowAI** is a browser extension that lets developers seamlessly continue conversations across **ChatGPT, Claude, and Gemini** without manually copying, rebuilding, or losing project context.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)

---

## 🎯 The Problem

Developers increasingly use multiple AI assistants because different models are better at different tasks. Switching between them usually means copying conversations manually, losing context, reformatting prompts, rebuilding conversations, and fighting context limits.

**FlowAI removes that friction.**

---

## 💡 The Solution

FlowAI acts as a context bridge between AI assistants.

```text
┌───────────┐
│  ChatGPT  │
└─────┬─────┘
      │ Export
      ▼
┌─────────────────┐
│     FlowAI      │
│  Context Bridge │
└─────┬───────────┘
      │ Import
      ▼
┌───────────┐
│  Claude   │
└───────────┘

       ↕
     Gemini
```

The user remains in control while FlowAI handles the context transfer.

---

# ✨ Features

### 🔄 Cross-model conversation transfer

Move conversations between **ChatGPT, Claude, and Gemini** without manually reconstructing the conversation.

### 📚 Large conversation handling

FlowAI is designed to handle large conversations by detecting dynamically rendered conversations, normalizing messages, using browser-local storage as a handoff layer, and using chunked transfer utilities where required.

### 🧩 Provider architecture

Each AI platform is isolated behind a provider abstraction:

```text
Provider
   │
   ├── ChatGPTProvider
   ├── ClaudeProvider
   └── GeminiProvider
```

This keeps platform-specific logic isolated and makes future providers easier to add.

### 💾 Context handoff

```text
Export
   ↓
Normalized Conversation
   ↓
Local Browser Storage
   ↓
Destination Provider
   ↓
Import
```

### 🛡️ Human-in-the-loop

FlowAI does not autonomously send messages or make decisions for the user. The user explicitly chooses when to export and transfer a conversation.

---

# 🏗️ Architecture

```text
                     ┌─────────────────────┐
                     │     FlowAI Popup    │
                     │   React + TypeScript│
                     └──────────┬──────────┘
                                │
                         Chrome Runtime
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
      ┌───────────────┐                   ┌───────────────┐
      │ Background SW │                   │ Chrome Storage│
      │ Manifest V3   │◄─────────────────►│ Context Store │
      └───────┬───────┘                   └───────────────┘
              │
              ▼
       ┌──────────────┐
       │ Content Script│
       └──────┬───────┘
              │
       ┌──────┼───────────┐
       ▼      ▼           ▼
   ChatGPT  Claude      Gemini
   Provider Provider    Provider
```

### Core components

| Component | Responsibility |
|---|---|
| Popup | User interaction and transfer controls |
| Content Script | Communicates with the active AI website |
| Provider | Platform-specific export/import logic |
| Background Worker | Extension lifecycle and browser messaging |
| Storage | Conversation handoff |
| Transfer utilities | Large-text/chunked conversation handling |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed design.

---

# 🔌 Supported Platforms

| Platform | Export | Import | Large Chats |
|---|:---:|:---:|:---:|
| ChatGPT | ✅ | ✅ | ✅ |
| Claude | ✅ | ✅ | ✅ |
| Gemini | ✅ | ✅ | ✅ |

> Behavior can depend on changes to the UI and DOM structure of each AI platform.

---

# 🚀 Quick Start

## Load the ready-to-use build

The repository contains a production extension build in `dist/`.

1. Clone the repository:

```bash
git clone https://github.com/polikeybhuvan/flow-ai.git
cd flow-ai
```

2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository's `dist/` folder.
6. Open ChatGPT, Claude, or Gemini.
7. Click the **FlowAI** extension icon.

---

# 🛠️ Development

The source project is located in `source/`.

```bash
cd source
npm install
npm run build
npm run lint
```

The production extension is generated from the source build configuration.

---

# 🔁 How FlowAI Works

### 1. Detect

FlowAI identifies the current supported AI platform.

```text
ChatGPT → ChatGPTProvider
Claude  → ClaudeProvider
Gemini  → GeminiProvider
```

### 2. Export

The provider extracts the current conversation into a normalized message structure:

```ts
{
  role: "user" | "assistant" | "system",
  text: string
}
```

### 3. Store

The normalized conversation is serialized and placed in browser-local storage for the handoff.

### 4. Transfer

FlowAI opens or communicates with the destination AI platform.

### 5. Import

The destination provider reconstructs the conversation in the destination platform's composer.

---

# 📦 Repository Structure

```text
flow-ai/
│
├── dist/                         # Ready-to-load Chrome extension
│
├── docs/
│   ├── ARCHITECTURE.md           # System architecture
│   ├── AGENTS_AND_SKILLS.md      # Custom agent + skill documentation
│   └── ROADMAP.md                # Future development
│
├── source/
│   ├── src/
│   │   ├── agents/
│   │   ├── background/
│   │   ├── components/
│   │   ├── content/
│   │   ├── providers/
│   │   │   ├── chatgpt.ts
│   │   │   ├── claude.ts
│   │   │   └── gemini.ts
│   │   ├── services/
│   │   ├── storage/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── AGENTS.md
├── LICENSE
└── README.md
```

---

# 🤖 Agent-Driven Development

FlowAI is developed using a human-in-the-loop AI-assisted workflow. The repository documents architecture decisions, development rules, custom agent behavior, reusable skills, testing strategy, CI/CD, and progressive development history.

See [`AGENTS.md`](AGENTS.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and [`docs/AGENTS_AND_SKILLS.md`](docs/AGENTS_AND_SKILLS.md).

AI-generated changes are reviewed and validated by a human before being committed.

---

# 🧠 Custom Agent & Skill

## Custom Agent — FlowAI Provider Engineer

Responsible for designing, implementing, testing, and debugging provider adapters while preserving the common FlowAI provider contract.

## Custom Skill — Long Conversation Transfer

Responsible for extracting large conversations, normalizing messages, handling large text payloads, chunking transfer data when required, and safely reconstructing context in destination providers.

Full documentation: [`docs/AGENTS_AND_SKILLS.md`](docs/AGENTS_AND_SKILLS.md)

---

# 🧪 Testing & Verification

Recommended checks:

```bash
npm run lint
npm run build
```

Before a release, verify ChatGPT detection, Claude detection, Gemini detection, conversation export/import, large conversation transfer, extension reload/install, and provider failure handling.

If Playwright tests are configured, they should run in CI and their reports should be retained as workflow artifacts.

---

# 🔐 Security & Privacy

FlowAI is designed around browser-local context handoff.

- No FlowAI backend is required for the core transfer workflow.
- Conversations are handled through the browser extension.
- Users explicitly initiate transfers.
- Provider-specific logic remains inside the extension.
- Secrets must never be committed to Git.

Never commit `.env` files, API keys, access tokens, passwords, cookies, session data, private conversations, or personal credentials.

---

# 🗺️ Roadmap

- [x] ChatGPT support
- [x] Claude support
- [x] Gemini support
- [x] Conversation export/import
- [x] Provider abstraction
- [x] Browser-local context handoff
- [x] Large conversation handling
- [x] Chrome Manifest V3
- [ ] Firefox support
- [ ] Microsoft Copilot support
- [ ] Conversation preview before transfer
- [ ] Transfer history
- [ ] Selective message transfer
- [ ] Better long-context optimization
- [ ] Additional AI providers

---

# 🏆 Deploy or Die — HowToAlgo × GDG on Campus KIIT

FlowAI was built for the **Deploy or Die: HowToAlgo × GDG on Campus KIIT Hackathon**.

## Track B — Developer Productivity Tools

FlowAI addresses a real developer workflow problem: moving working context between multiple AI assistants without repeatedly rebuilding the conversation.

### Evaluation areas

| Area | Weight |
|---|---:|
| Specification & Architecture | 25% |
| Working Software & Delivery | 30% |
| Agent Engineering & Code Quality | 30% |
| Testing & Verification | 15% |
| **Total** | **100%** |

### Required repository checkpoints

1. Architecture document
2. Agent rules
3. Working code
4. Custom agent + custom skill
5. Green CI/CD pipeline

---

# 📋 Hackathon Submission Checklist

- [ ] `README.md` is present
- [ ] `docs/ARCHITECTURE.md` is complete
- [ ] `AGENTS.md` is present
- [ ] `docs/AGENTS_AND_SKILLS.md` documents a custom agent and skill
- [ ] Application builds successfully
- [ ] `dist/` contains the working extension build
- [ ] GitHub Actions workflow exists
- [ ] Latest CI run is green
- [ ] Playwright/end-to-end tests pass if configured
- [ ] Linting passes
- [ ] Secrets are not committed
- [ ] Git history contains progressive commits
- [ ] A semantic version tag/release exists

---

# 🎥 Demo Flow

```text
1. Open ChatGPT
       ↓
2. Start a conversation
       ↓
3. Open FlowAI
       ↓
4. Export Conversation
       ↓
5. Select Claude or Gemini
       ↓
6. Transfer Conversation
       ↓
7. Continue working with the same context
```

The key demonstration is that **working context can move between AI tools with minimal friction**.

---

# 🧭 Design Philosophy

### 1. Context first
The most valuable thing being transferred is not just text — it is the user's working context.

### 2. User control
The user decides when and where a conversation moves.

### 3. Provider isolation
Platform-specific behavior stays inside provider adapters.

### 4. Fail visibly
If a provider cannot detect or import a conversation, FlowAI should report the failure instead of silently pretending the transfer succeeded.

### 5. Architect for change
New AI providers should be addable without rewriting the core transfer system.

---

# 📄 License

See [`LICENSE`](LICENSE).

---

# 👨‍💻 Author

**Bhuvan**

GitHub: https://github.com/polikeybhuvan

Project: https://github.com/polikeybhuvan/flow-ai

---

<p align="center">

## 🚀 FlowAI

### One conversation. Any model. Zero context loss.

**Built for developers who use more than one AI.**

</p>
