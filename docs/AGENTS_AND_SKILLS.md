# Agent and Skill Playbook

These are contributor workflow guides, not runtime autonomous agents shipped inside the extension.

## Custom agent: FlowAI Provider Engineer

### Mission
Implement and maintain one provider adapter while preserving the common FlowAI provider contract.

### Required inputs
- The target provider and its current supported URL patterns.
- The existing provider interface and sibling adapters.
- A small manual test matrix covering export, import, empty states, and long text.

### Rules
1. Keep selectors, editor detection, and provider-specific insertion logic in the provider adapter.
2. Return messages in visible conversation order using the shared role/text shape.
3. Avoid dropping distinct turns just because they have equal text.
4. Treat any selector-based extraction as best-effort; provider DOM changes can make it stale.
5. Do not click Send or otherwise submit a message automatically.
6. Avoid logging the user's conversation text.
7. Handle missing editors, empty text, and insertion failures visibly.
8. Run lint and build, then manually test the real provider page before marking the provider verified.

### Expected output
- Focused code changes for one provider, a summary of assumptions, manual validation results, and any unresolved selector risks.

## Custom skill: Long Conversation Transfer

### Objective
Move a long conversation as a plain-text transcript without silently claiming that a native conversation thread was cloned.

### Procedure
1. Extract the messages visible to the provider adapter and preserve their order.
2. Normalize each message to role and text.
3. Format the transcript with explicit role labels and spacing.
4. Store the normalized export locally and create a short-lived pending transfer record.
5. Insert the full transcript in the destination composer using the provider-specific text insertion helper.
6. Verify that the editor contains approximately the expected text, and treat partial insertion as a failure.
7. Clear the pending record after an attempt so refreshing the page cannot repeat the same insertion.
8. Tell the user that attachments, images, tool state, and native message boundaries are not preserved when that limitation matters.

### Failure handling
- If a provider page is unsupported, stop and show a visible error.
- If the editor cannot be found, do not claim success.
- If insertion is incomplete, report failure; do not automatically send or repeatedly insert the transcript.
- Do not log or upload the transcript body.
