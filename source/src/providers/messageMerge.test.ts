import assert from "node:assert/strict";
import test from "node:test";
import { getNonOverlappingMessages } from "./messageMerge.ts";
import type { ConversationMessage } from "./types.ts";

const user = (text: string): ConversationMessage => ({ role: "user", text });
const assistant = (text: string): ConversationMessage => ({ role: "assistant", text });

test("removes a multi-message overlap between adjacent snapshots", () => {
    const collected = [user("first"), assistant("answer"), user("repeat")];
    const current = [assistant("answer"), user("repeat"), assistant("next")];

    assert.deepEqual(
        getNonOverlappingMessages(collected, current),
        [assistant("next")]
    );
});

test("preserves a repeated message when it is a new turn", () => {
    const collected = [user("same"), assistant("reply")];
    const current = [assistant("reply"), user("same"), assistant("next")];

    assert.deepEqual(
        getNonOverlappingMessages(collected, current),
        [user("same"), assistant("next")]
    );
});

test("returns the whole first snapshot when nothing has been collected", () => {
    const current = [user("hello"), user("hello"), assistant("answer")];

    assert.deepEqual(getNonOverlappingMessages([], current), current);
});

test("handles snapshots with no common boundary", () => {
    assert.deepEqual(
        getNonOverlappingMessages([user("old")], [assistant("new")]),
        [assistant("new")]
    );
});
