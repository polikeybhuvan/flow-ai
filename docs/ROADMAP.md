# FlowAI Roadmap

## Current foundation
- [x] Chrome Manifest V3 extension structure.
- [x] Provider adapters for ChatGPT, Claude, and Gemini.
- [x] Export visible messages into a normalized role/text transcript.
- [x] Store the most recent conversation in Chrome local storage.
- [x] Open a selected destination and hand off a pending transfer.
- [x] Download the normalized export as JSON.
- [x] Clear the saved conversation and pending-transfer data from the popup.
- [x] Expire pending transfers after ten minutes and clear them after an attempt.
- [x] GitHub Actions lint and build checks.
- [x] Unit tests for transcript formatting, overlap merging, and transfer expiry.
- [ ] Browser-level end-to-end tests on live provider pages.
- [ ] Add a license only if the project later needs to permit reuse or redistribution.

## Next priorities
1. Add tests for storage lifecycle and provider-independent transfer logic.
2. Add browser-level smoke tests for each provider using controlled fixtures or a documented test account.
3. Improve extraction reliability as ChatGPT, Claude, and Gemini change their DOM.
4. Preview the transcript and let users choose which messages to transfer.
5. Show a clearer warning that transferred text is inserted as a prompt rather than recreated as native conversation history.
6. Improve cancellation and retry UX for failed insertion without causing duplicate text.
7. Evaluate Firefox support after extension APIs and the build pipeline have a documented compatibility plan.
8. Consider additional AI providers only after the adapter contract and manual verification checklist are stable.

## Release gate
A release should not be described as provider-verified until lint and build pass, the generated extension has been rebuilt from the release commit, and manual export/import checks have been completed for the supported sites. A green build alone does not prove provider DOM extraction works.
