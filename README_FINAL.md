# FlowAI — ready-to-load build

## Install immediately
1. Open `chrome://extensions`
2. Remove the old FlowAI extension.
3. Turn on Developer mode.
4. Click **Load unpacked**.
5. Select the **`dist`** folder from this package.
6. Open/refresh ChatGPT, Claude, or Gemini.

This `dist` folder is a direct Chrome extension build. No `npm install` or `npm run build` is required to test it.

## What is fixed
- No CRXJS service-worker loader.
- Background worker has no DOM/window dependencies.
- Popup reconnects to already-open AI tabs by injecting the content script when necessary.
- Transfer uses Chrome storage as a pending handoff.
- Destination tabs automatically import the pending conversation.
- ChatGPT export supports scrolling through long conversations when the page virtualizes messages.
- Large transfers are inserted in chunks.
- ChatGPT, Claude, and Gemini are supported.

The `source` directory contains the TypeScript/React project for continued development.
