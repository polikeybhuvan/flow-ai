export const PENDING_TRANSFER_TTL_MS = 10 * 60 * 1000;
export const CLOCK_SKEW_GRACE_MS = 60 * 1000;

/**
 * Reject malformed timestamps, timestamps too far in the future, and transfers
 * that have reached their ten-minute time-to-live.
 */
export function isPendingTransferInvalidOrExpired(
    createdAt: string,
    now = Date.now()
): boolean {
    const timestamp = Date.parse(createdAt);

    if (!Number.isFinite(now) || !Number.isFinite(timestamp)) {
        return true;
    }

    if (timestamp > now + CLOCK_SKEW_GRACE_MS) {
        return true;
    }

    return now - timestamp >= PENDING_TRANSFER_TTL_MS;
}
