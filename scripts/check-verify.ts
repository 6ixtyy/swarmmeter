// End-to-end check of gate verification against a running server + testnet.
import { KeyPair } from 'near-api-js';
import { loadIdentity, signRequestHeaders, signedFetch } from '../src/client.js';
import { config } from '../src/config.js';

const base = process.env.BASE_URL ?? `http://localhost:${config.port}`;
const id = loadIdentity(config.ownerAccount);
const show = async (label: string, r: Response) => console.log(label.padEnd(28), r.status, await r.text());

await show('valid GET', await signedFetch(id, `${base}/whoami`));
await show('valid POST (cached key)', await signedFetch(id, `${base}/whoami`, { body: '{"x":1}' }));

const h = signRequestHeaders(id, 'GET', `${base}/whoami`, undefined, config.recipient);
await show('first use of nonce', await fetch(`${base}/whoami`, { headers: h }));
await show('replayed nonce', await fetch(`${base}/whoami`, { headers: h }));

const h2 = signRequestHeaders(id, 'POST', `${base}/whoami`, '{"x":1}', config.recipient);
await show('tampered body', await fetch(`${base}/whoami`, { method: 'POST', headers: h2, body: '{"x":2}' }));

const h3 = signRequestHeaders(id, 'GET', `${base}/whoami`, undefined, 'some-other-api');
await show('wrong recipient', await fetch(`${base}/whoami`, { headers: h3 }));

// A random key claiming to be the owner: signature is valid, but the key is not on the account.
const impostor = { accountId: config.ownerAccount, keyPair: KeyPair.fromRandom('ed25519') };
await show('impostor key', await signedFetch(impostor, `${base}/whoami`));

await show('no headers', await fetch(`${base}/whoami`));
