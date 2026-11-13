// Create (or reuse) the testnet owner account via the NEAR testnet faucet helper,
// and save its key to keys/<account>.json (git-ignored).
import fs from 'node:fs';
import path from 'node:path';
import { KeyPair, JsonRpcProvider } from 'near-api-js';
import { config } from '../src/config.js';

const KEYS_DIR = path.resolve('keys');

async function accountExists(provider: JsonRpcProvider, accountId: string) {
  try {
    await provider.viewAccount({ accountId });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const accountId = process.argv[2] || config.ownerAccount || `swarmmeter-${Date.now().toString(36)}.testnet`;
  if (!accountId.endsWith('.testnet')) throw new Error('Owner must be a .testnet account');
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  const keyFile = path.join(KEYS_DIR, `${accountId}.json`);
  const provider = new JsonRpcProvider({ url: config.rpcUrl });

  if (fs.existsSync(keyFile) && (await accountExists(provider, accountId))) {
    console.log(`Reusing ${accountId} (key in ${keyFile})`);
    return;
  }

  const keyPair = KeyPair.fromRandom('ed25519');
  const publicKey = keyPair.getPublicKey().toString();
  console.log(`Creating ${accountId} via faucet helper...`);
  const res = await fetch('https://helper.testnet.near.org/account', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ newAccountId: accountId, newAccountPublicKey: publicKey }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Faucet failed: ${res.status} ${text.slice(0, 300)}`);
  fs.writeFileSync(
    keyFile,
    JSON.stringify({ account_id: accountId, public_key: publicKey, private_key: keyPair.toString() }, null, 2),
    { mode: 0o600 },
  );
  console.log(`Created ${accountId}. Key saved to ${keyFile}`);
  console.log(`Set OWNER_ACCOUNT=${accountId} in .env`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
