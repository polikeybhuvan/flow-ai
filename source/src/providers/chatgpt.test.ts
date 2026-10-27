import assert from "node:assert/strict";
import test from "node:test";
import { roleFromContentSearchUnitKey } from "./chatgpt";

test("recognizes user content units in the newer ChatGPT layout", () => {
    assert.equal(roleFromContentSearchUnitKey("thread:turn-12:user"), "user");
});

test("recognizes assistant content units in the newer ChatGPT layout", () => {
    assert.equal(roleFromContentSearchUnitKey("thread:turn-13:assistant"), "assistant");
});

test("accepts a simple role suffix", () => {
    assert.equal(roleFromContentSearchUnitKey("user"), "user");
    assert.equal(roleFromContentSearchUnitKey("assistant"), "assistant");
});

test("does not infer a role from an unrelated content-unit key", () => {
    assert.equal(roleFromContentSearchUnitKey("thread:turn-12:tool"), null);
    assert.equal(roleFromContentSearchUnitKey(null), null);
    assert.equal(roleFromContentSearchUnitKey("thread:user:message"), null);
});
