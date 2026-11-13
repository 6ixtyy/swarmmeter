// Agent-side helper: sign each request with the agent's NEAR key (NEP-413) and send it.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { KeyPair, type KeyPairString } from 'near-api-js';
import { HEADERS, bodyHash, nep413Hash, requestMessage } from './nep413.js';

export interface AgentIdentity {
  accountId: string;
  keyPair: KeyPair;
}

export function loadIdentity(accountId: string, keysDir = 'keys'): AgentIdentity {
  const file = path.resolve(keysDir, `${accountId}.json`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { accountId, keyPair: KeyPair.fromString(j.private_key as KeyPairString) };
}

export function signRequestHeaders(
  id: AgentIdentity,
  method: string,
  url: string,
  body: string | undefined,
  recipient: string,
): Record<string, string> {
  const u = new URL(url);
  const ts = Date.now();
  const nonce = crypto.randomBytes(32);
  const message = requestMessage(method, u.pathname + u.search, ts, bodyHash(body));
  const hash = nep413Hash({ message, nonce, recipient });
  const { signature } = id.keyPair.sign(hash);
  return {
    [HEADERS.account]: id.accountId,
    [HEADERS.publicKey]: id.keyPair.getPublicKey().toString(),
    [HEADERS.signature]: Buffer.from(signature).toString('base64'),
    [HEADERS.nonce]: nonce.toString('base64'),
    [HEADERS.ts]: String(ts),
  };
}

/** fetch() with NEP-413 signed headers. */
export async function signedFetch(
  id: AgentIdentity,
  url: string,
  init: { method?: string; body?: string; headers?: Record<string, string> } = {},
  recipient = process.env.GATE_RECIPIENT ?? 'swarmmeter',
) {
  const method = init.method ?? (init.body ? 'POST' : 'GET');
  const headers = {
    ...(init.body ? { 'content-type': 'application/json' } : {}),
    ...init.headers,
    ...signRequestHeaders(id, method, url, init.body, recipient),
  };
  return fetch(url, { method, body: init.body, headers });
}
