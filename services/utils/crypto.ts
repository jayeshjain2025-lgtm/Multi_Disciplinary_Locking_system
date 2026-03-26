// ============================================================
// services/utils/crypto.ts — ID and nonce generation
// ============================================================
// Uses the Web Crypto API (available in all modern browsers)
// so no external dependency is needed.

/** Generate a random UUID v4 for event/command IDs */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a cryptographically random nonce (hex string).
 * Used for anti-replay protection in phase unlock events.
 * The lock firmware should verify this nonce has not been
 * seen before and is within an acceptable time window.
 */
export function generateNonce(byteLength = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
