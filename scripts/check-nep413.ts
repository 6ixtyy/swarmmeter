// Cross-check our NEP-413 signing against near-api-js's own signMessage/verifyMessage on testnet.
import crypto from 'node:crypto';
import { Account, JsonRpcProvider, KeyPairSigner } from 'near-api-js';
import { signMessage, verifyMessage } from 'near-api-js/nep413';
import { loadIdentity, signRequestHeaders } from '../src/client.js';
import { nep413Hash, requestMessage, bodyHash, HEADERS } from '../src/nep413.js';
import { config } from '../src/config.js';

const id = loadIdentity(config.ownerAccount);
const provider = new JsonRpcProvider({ url: config.rpcUrl });
const nonce = crypto.randomBytes(32);
const payload = { message: 'hello', nonce, recipient: 'swarmmeter' };

const account = new Account(id.accountId, provider, new KeyPairSigner(id.keyPair));
const lib = await signMessage({ signerAccount: account, payload });
const ours = id.keyPair.sign(nep413Hash(payload)).signature;
console.log('signatures match library:', Buffer.from(lib.signature).equals(Buffer.from(ours)));
await verifyMessage({ signerAccountId: id.accountId, signerPublicKey: lib.publicKey, payload, signature: ours, provider });
console.log('library verifyMessage on testnet: OK');

const h = signRequestHeaders(id, 'POST', 'http://x/api/summarize?a=1', '{"t":1}', 'swarmmeter');
const msg = requestMessage('POST', '/api/summarize?a=1', Number(h[HEADERS.ts]), bodyHash('{"t":1}'));
await verifyMessage({
  signerAccountId: id.accountId,
  signerPublicKey: h[HEADERS.publicKey],
  payload: { message: msg, nonce: Buffer.from(h[HEADERS.nonce], 'base64'), recipient: 'swarmmeter' },
  signature: Buffer.from(h[HEADERS.signature], 'base64'),
  provider,
});
console.log('request headers verify on testnet: OK', h);
