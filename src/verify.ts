// Gate step 1: who is calling? Verify the NEP-413 signature locally, reject replays,
// then confirm on chain that the public key really belongs to the claimed account.
import { PublicKey } from 'near-api-js';
import { HEADERS, bodyHash, nep413Hash, requestMessage } from './nep413.js';
import { rpc } from './near.js';
import { config } from './config.js';

const MAX_SKEW_MS = 5 * 60 * 1000;
const KEY_CACHE_TTL_MS = 10 * 60 * 1000;
const NEG_CACHE_TTL_MS = 30 * 1000;

const usedNonces = new Map<string, number>(); // nonce -> expiry
const keyCache = new Map<string, { ok: boolean; reason?: string; exp: number }>();

export class VerifyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function pruneNonces(now: number) {
  if (usedNonces.size < 10_000) return;
  for (const [n, exp] of usedNonces) if (exp < now) usedNonces.delete(n);
}

/** view_access_key on chain, cached. Only FullAccess keys prove control of the account. */
export async function keyBelongsTo(accountId: string, publicKey: string) {
  const k = `${accountId}|${publicKey}`;
  const now = Date.now();
  const hit = keyCache.get(k);
  if (hit && hit.exp > now) return { ...hit, cached: true };
  let entry: { ok: boolean; reason?: string; exp: number };
  try {
    const r = await rpc('query', {
      request_type: 'view_access_key',
      finality: 'final',
      account_id: accountId,
      public_key: publicKey,
    });
    entry =
      r.permission === 'FullAccess'
        ? { ok: true, exp: now + KEY_CACHE_TTL_MS }
        : { ok: false, reason: 'key is not a FullAccess key', exp: now + NEG_CACHE_TTL_MS };
  } catch (e: any) {
    entry = { ok: false, reason: `key not found on account (${e.message})`, exp: now + NEG_CACHE_TTL_MS };
  }
  keyCache.set(k, entry);
  return { ...entry, cached: false };
}

export interface VerifiedCaller {
  accountId: string;
  publicKey: string;
  keyCached: boolean;
}

export async function verifyRequest(req: Request, body: string): Promise<VerifiedCaller> {
  const h = (n: string) => req.headers.get(n) ?? '';
  const accountId = h(HEADERS.account);
  const publicKey = h(HEADERS.publicKey);
  const sigB64 = h(HEADERS.signature);
  const nonceB64 = h(HEADERS.nonce);
  const ts = Number(h(HEADERS.ts));
  if (!accountId || !publicKey || !sigB64 || !nonceB64 || !ts) {
    throw new VerifyError(401, `missing signed headers (${Object.values(HEADERS).join(', ')})`);
  }
  const now = Date.now();
  if (Math.abs(now - ts) > MAX_SKEW_MS) throw new VerifyError(401, 'timestamp too old or in the future');

  const nonce = Buffer.from(nonceB64, 'base64');
  const signature = Buffer.from(sigB64, 'base64');
  if (nonce.length !== 32) throw new VerifyError(401, 'nonce must be 32 bytes');

  const url = new URL(req.url);
  const message = requestMessage(req.method, url.pathname + url.search, ts, bodyHash(body));
  let ok = false;
  try {
    ok = PublicKey.from(publicKey).verify(nep413Hash({ message, nonce, recipient: config.recipient }), signature);
  } catch {
    ok = false;
  }
  if (!ok) throw new VerifyError(401, 'bad signature');

  // Replay check after the signature check so junk can't fill the nonce table.
  pruneNonces(now);
  if (usedNonces.has(nonceB64)) throw new VerifyError(401, 'nonce already used');
  usedNonces.set(nonceB64, ts + MAX_SKEW_MS * 2);

  const key = await keyBelongsTo(accountId, publicKey);
  if (!key.ok) throw new VerifyError(401, `key does not belong to ${accountId}: ${key.reason}`);
  return { accountId, publicKey, keyCached: key.cached };
}
