# FlowAI Architecture

## Purpose and current scope
FlowAI is a Chrome Manifest V3 extension that transfers a readable transcript between ChatGPT, Claude, and Gemini. It exports messages through a provider adapter, stores the normalized transcript in chrome.storage.local, opens the destination provider, and inserts the transcript into its composer.

The destination receives a role-labeled prompt. FlowAI does not recreate the destination's native message history and does not preserve attachments, images, tool calls, hidden system state, or provider-specific metadata.

## Main components
- Popup: detects the active AI site, starts an export, chooses a destination, requests a transfer, downloads JSON, and clears locally stored transfer data.
- Provider adapters: identify the current site, read visible conversation content, locate the composer, and insert a prepared transcript. Selectors are dependent on each provider's DOM and can break when those sites change.
- Storage service: stores the latest export and a pending-transfer record in Chrome local storage.
- Transfer service: formats the stored messages, creates a pending transfer record, and opens the chosen destination.
- Content script: answers popup messages, exports the current conversation, imports the stored transcript, and handles pending transfers after a destination page loads.
- Background service worker: registers extension lifecycle listeners. The current transfer path uses the popup, content scripts, and Chrome tabs API directly; no tab-navigation logging is required.

## Transfer lifecycle
1. The user opens the extension on a supported conversation and selects Export Conversation.
2. The content script asks the active provider adapter for message text.
3. The popup normalizes the export with platform, title, URL, export timestamp, and ordered messages.
4. The normalized conversation is stored locally in Chrome storage.
5. The user selects a destination. The transfer service writes a pending record with destination and creation timestamp before opening the destination tab.
6. The destination content script checks the record, rejects invalid or expired records, waits briefly for the editor, and attempts to insert the role-labeled transcript.
7. The pending record is cleared after the attempt to prevent an accidental duplicate insertion on reload. The user reviews and sends the prompt manually.

## Data model
A conversation export contains a platform identifier, title, source URL, exported-at timestamp, and an ordered array of messages. Each message contains a role (user, assistant, or system where supported) and plain text. A pending transfer contains a destination identifier and creation timestamp; a tab ID may be present for future targeted handoff behavior.

## Privacy and security
- The core transfer path does not require a FlowAI server.
- Manifest permissions are limited to local storage and script execution, with host access restricted to the three supported AI websites.
- Conversation content is stored in Chrome local storage on the user's browser. This is local storage, not an encrypted vault; other code running with the extension's privileges may be able to access it.
- The popup provides a Clear Saved Data action that removes the saved conversation and pending-transfer record.
- FlowAI must not automatically submit the inserted transcript or silently transmit it to a remote FlowAI service.
- Avoid logging transcript text, credentials, cookies, or session data.
- Pending transfers expire after ten minutes and are removed after a destination import attempt.

## Build and validation
The source application is under source. Running npm run build there writes the extension output to the repository-root dist directory. GitHub Actions runs lint and build checks; provider behavior still requires manual verification because there is not yet an automated test suite.
