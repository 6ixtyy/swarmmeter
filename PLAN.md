# Build plan

Work top to bottom. Each step is done only when it works on testnet.

1. **Scaffold.** TypeScript + Hono app, `npm run dev` serves a hello route. `.env.example` with `NEAR_NETWORK=testnet`, `NEAR_RPC_URL`, `OWNER_ACCOUNT`, `FREE_CALLS_PER_WINDOW`, `WINDOW_SECONDS`, `PRICE_NEAR`, `PAY_TO_ACCOUNT`.
2. **Testnet accounts.** Script to create (or reuse) the owner account via faucet and save its key to `keys/` (git-ignored).
3. **Signed requests (client).** Helper that signs `{message, nonce, recipient}` per NEP-413 and sets headers: account id, public key, signature, nonce.
4. **Gate: verify.** Middleware checks the signature, rejects reused nonces, then confirms the key belongs to the account with `view_access_key` (cache results). Cut-off: 2 hours, then use the timestamp-signing fallback.
5. **Gate: owner + counter.** Root owner from the account name; implicit (64-hex) accounts have no owner. Rolling-window counter per owner.
6. **Gate: 402.** Over the limit, or no owner: return 402 with `{payTo, amount, memo}`. Payment check: confirm a transfer from any account of that owner to `PAY_TO_ACCOUNT` via RPC, then credit more calls.
7. **Demo API.** One endpoint behind the gate (e.g. `/api/summarize`).
8. **Swarm script.** Create `agent1..agent20.<owner>` sub-accounts (≈0.05 NEAR each), each runs one NEAR AI Cloud task and calls the API. Show the 402 when the owner limit is hit, then pay and retry. Also one implicit account calling.
9. **Dashboard.** Live page: owners, number of agents per owner, calls, payments, status (red when caught).
10. **Deploy.** Vercel or Render, public URL.
11. **Ship.** README with the pitch, how to run, and a GIF or video; demo post on X; submit before Nov 14 23:59 UTC.
