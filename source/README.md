# FlowAI source

This directory contains the React + TypeScript source for the FlowAI Chrome extension.

## Requirements
Use Node.js 22.12 or newer and npm.

## Development commands
- Install dependencies: npm install
- Lint the source: npm run lint
- Build the extension: npm run build
- Run both checks: npm run check

The build output is written to the repository-root dist directory because that is the folder loaded through Chrome's Load unpacked workflow. Rebuild after source changes before testing the extension.

## Important behavior
The extension transfers a plain-text, role-labeled transcript into a destination AI composer. It does not clone a provider-native thread or preserve attachments, images, tool calls, or hidden state. The user must review and send the resulting prompt.

Provider DOM structures change over time. Treat successful compilation as a build check, not proof that live export/import is working. See the repository-level README and the docs directory for architecture, privacy, contributor rules, and manual validation guidance.
