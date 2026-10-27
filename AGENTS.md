# Contributor and AI Agent Rules

## Source of truth
- The extension source of truth is under source/src and source/public.
- Build configuration and package scripts live under source.
- The checked-in top-level dist directory is generated output. Rebuild it from source before testing or releasing changes.
- The root README describes user-facing behavior; the documents in docs explain implementation and contributor workflow.

## Rules for changes
1. Keep provider-specific DOM selectors and import/export behavior inside the provider adapters.
2. Preserve the shared message shape: role plus plain-text content. Update the architecture document when this contract changes.
3. Never automatically submit a prompt. FlowAI may insert text into a composer, but sending must remain a deliberate user action.
4. Do not log message bodies or store credentials. Conversation text is sensitive even when it stays in browser-local storage.
5. Keep pending-transfer records short-lived, and clear them after success, failure, or expiry so page reloads do not duplicate inserted text.
6. Avoid deduplicating messages solely because their role and text are equal; a person can repeat the same words in distinct turns.
7. Narrow host permissions to supported provider domains. Any permission expansion must be justified in the README and reviewed.
8. Do not claim a provider works based only on compilation. Verify export/import manually on the provider's current UI.

## Local verification
From source, install dependencies, then run npm run lint and npm run build. There is not yet an automated unit or end-to-end test suite; document manual provider checks with each provider-related change.

## Release checklist
- Build and lint pass locally and in GitHub Actions.
- The generated root dist output is rebuilt from the same commit.
- ChatGPT, Claude, and Gemini export/import flows are checked manually.
- Long-text insertion, expiry behavior, failure handling, and clear-data behavior are checked.
- The release notes describe known provider-specific limitations.
- A project license is selected before inviting external reuse or redistribution.
