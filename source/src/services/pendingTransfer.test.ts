import assert from "node:assert/strict";
import test from "node:test";
import {
    CLOCK_SKEW_GRACE_MS,
    isPendingTransferInvalidOrExpired,
    PENDING_TRANSFER_TTL_MS,
} from "./pendingTransfer.ts";

const BASE_TIME = Date.parse("2026-10-27T12:00:00.000Z");
const iso = (time: number) => new Date(time).toISOString();

test("accepts a recent pending transfer", () => {
    assert.equal(
        isPendingTransferInvalidOrExpired(iso(BASE_TIME - 30_000), BASE_TIME),
        false
    );
});

test("expires a transfer at the ten-minute boundary", () => {
    assert.equal(
        isPendingTransferInvalidOrExpired(
            iso(BASE_TIME - PENDING_TRANSFER_TTL_MS),
            BASE_TIME
        ),
        true
    );
});

test("rejects malformed timestamps", () => {
    assert.equal(isPendingTransferInvalidOrExpired("not-a-date", BASE_TIME), true);
});

test("rejects timestamps too far in the future", () => {
    assert.equal(
        isPendingTransferInvalidOrExpired(
            iso(BASE_TIME + CLOCK_SKEW_GRACE_MS + 1),
            BASE_TIME
        ),
        true
    );
});

test("allows a small clock-skew window", () => {
    assert.equal(
        isPendingTransferInvalidOrExpired(
            iso(BASE_TIME + CLOCK_SKEW_GRACE_MS),
            BASE_TIME
        ),
        false
    );
});

test("fails closed when the clock value is invalid", () => {
    assert.equal(isPendingTransferInvalidOrExpired(iso(BASE_TIME), Number.NaN), true);
});
