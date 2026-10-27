# FlowAI source

This directory contains the React + TypeScript source for the FlowAI Chrome extension.

## Requirements
Use Node.js 22.12 or newer and npm.

## Development commands
- Install the locked dependencies: npm ci
- Lint the source: npm run lint
- Build the extension: npm run build
- Run unit tests: npm test
- Run all checks: npm run check

The locked dependency tree is recorded in `package-lock.json`. The build output is written to the repository-root `dist/` directory because that is the folder loaded through Chrome's Load unpacked workflow. Rebuild after source changes and commit the refreshed `dist/` output before sharing the updated build.

## Important behavior
The extension transfers a plain-text, role-labeled transcript into a destination AI composer. It does not clone a provider-native thread or preserve attachments, images, tool calls, or hidden state. The user must review and send the resulting prompt.

Provider DOM structures change over time. Unit tests cover transcript formatting, pending-transfer expiry, and overlap merging; they do not replace manual tests against the live provider sites. See the repository-level README and the docs directory for architecture, privacy, contributor rules, and manual validation guidance.
