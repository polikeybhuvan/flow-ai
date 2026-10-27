import assert from "node:assert/strict";
import test from "node:test";
import { formatConversation } from "./formatter.ts";
import type { ConversationExport } from "../types/conversation.ts";

const sample: ConversationExport = {
    platform: "chatgpt",
    title: "Example conversation",
    url: "https://chatgpt.com/c/example",
    exportedAt: "2026-10-27T12:00:00.000Z",
    messages: [
        { role: "user", text: "Hello" },
        { role: "assistant", text: "Hi there" },
        { role: "user", text: "Can you help?" },
    ],
};

test("formats a transcript with metadata and ordered role labels", () => {
    const result = formatConversation(sample);

    assert.ok(result.startsWith("# FLOWAI CONTEXT\n\n"));
    assert.ok(result.includes("Platform: chatgpt\n"));
    assert.ok(result.includes("Title: Example conversation\n"));
    assert.ok(result.indexOf("USER\nHello") < result.indexOf("ASSISTANT\nHi there"));
    assert.ok(result.indexOf("ASSISTANT\nHi there") < result.indexOf("USER\nCan you help?"));
});

test("preserves message text, including internal line breaks", () => {
    const result = formatConversation({
        ...sample,
        messages: [{ role: "assistant", text: "Line one\nLine two" }],
    });

    assert.ok(result.includes("ASSISTANT\nLine one\nLine two\n\n"));
});

test("formats an empty conversation without throwing", () => {
    const result = formatConversation({ ...sample, messages: [] });

    assert.ok(result.includes("===== CONVERSATION =====\n\n"));
    assert.equal(result.endsWith("===== CONVERSATION =====\n\n"), true);
});
