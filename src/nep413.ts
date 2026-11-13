// NEP-413 message payload: shared by the agent client (signing) and the gate (verifying).
import { serialize } from 'borsh';
import { sha256 } from '@noble/hashes/sha2.js';

export const NEP413_PREFIX = 2147483648 + 413; // 2^31 + 413

const schema = {
  struct: {
    message: 'string',
    nonce: { array: { type: 'u8', len: 32 } },
    recipient: 'string',
    callbackUrl: { option: 'string' },
  },
} as const;

export interface Nep413Payload {
  message: string;
  nonce: Uint8Array; // 32 bytes
  recipient: string;
  callbackUrl?: string | null;
}

/** sha256(borsh(u32 prefix) ++ borsh(payload)): the bytes that get signed with ed25519. */
export function nep413Hash(p: Nep413Payload): Uint8Array {
  const prefix = serialize('u32', NEP413_PREFIX);
  const body = serialize(schema as any, {
    message: p.message,
    nonce: Array.from(p.nonce),
    recipient: p.recipient,
    callbackUrl: p.callbackUrl ?? null,
  });
  const buf = new Uint8Array(prefix.length + body.length);
  buf.set(prefix);
  buf.set(body, prefix.length);
  return sha256(buf);
}

/** The message an agent signs binds the signature to one HTTP request. */
export function requestMessage(method: string, pathWithQuery: string, ts: number, bodyHashHex: string) {
  return JSON.stringify({ method: method.toUpperCase(), path: pathWithQuery, ts, body: bodyHashHex });
}

export const HEADERS = {
  account: 'x-near-account-id',
  publicKey: 'x-near-public-key',
  signature: 'x-near-signature', // base64
  nonce: 'x-near-nonce', // base64, 32 bytes
  ts: 'x-near-timestamp', // ms since epoch
} as const;

export function hex(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('hex');
}

export function bodyHash(body: string | Uint8Array | undefined) {
  return hex(sha256(typeof body === 'string' ? new TextEncoder().encode(body) : (body ?? new Uint8Array())));
}
