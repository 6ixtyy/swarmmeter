# SwarmMeter

Usage limits per owner for AI agent swarms. NEAR account names show who owns each agent, so a swarm can't pose as many separate users.

Built for the NEAR Hackathon. **Deadline: Nov 14 2026, 23:59 UTC.** Submission = working prototype + this public repo + a demo post on X. Target tracks: AI swarms, agent economies (confirm exact names on nearhackathon.com).

## The problem
APIs limit usage per key or per IP, but one owner can run 1,000 agents. A swarm spreads calls across many free-tier keys, each agent stays under the limit, and the owner uses 1,000x more. The API can't tell, so it gets abused or blocks everyone.

## The NEAR trick
Only `zaki.testnet` can create `agent7.zaki.testnet`. The name itself proves the owner, so `agent1…agent1000.zaki.testnet` all roll up to one owner.

Loophole: a swarm can use unrelated anonymous accounts (64-hex implicit accounts). Fix: the free tier only goes to named owners. Accounts with no owner pay from the first call. Show who you are, or pay.

## How it works
1. The agent signs each request with its NEAR key (NEP-413 message signing: `{message, nonce, recipient}`), sent in headers with its account id and public key.
2. The gate verifies the signature locally, then confirms on chain that the key belongs to that account (`view_access_key` RPC, cached).
3. It finds the root owner by reading the account name from the right (`agent7.zaki.testnet` → `zaki.testnet`).
4. It counts calls per owner over a rolling window.
5. Under the limit: pass. Over it: `402` with a NEAR payment request. Once the transfer is confirmed on chain, the owner gets more calls.
6. A dashboard shows owners, swarm sizes, calls, payments, and caught swarms in red.

## Parts
| Part | What |
|---|---|
| Gate | Middleware/proxy: signature check, key check, owner lookup, counter, 402 |
| Demo API | A simple endpoint behind the gate |
| Swarm script | Creates 20 testnet sub-accounts and fires calls from all of them. Each sub-agent does one real task via NEAR AI Cloud so it's an actual AI swarm |
| Dashboard | Live usage per owner, caught swarms in red |

Stack: TypeScript, Hono, near-api-js, NEAR testnet, SQLite or in-memory. Deploy to Vercel or Render.

## Demo (60–90 s)
1. One agent calls the API and gets in on the free tier.
2. The owner spins up 20 sub-agents to split the load.
3. The dashboard rolls all 20 up to the owner, the limit is hit, they get 402.
4. The owner pays in NEAR, access comes back.
5. An anonymous account tries to sneak in and pays from its first call.

## Scope
- Must: signature check, key check, owner lookup, per-owner counter, 402, swarm script, dashboard.
- Nice: real on-chain payment check (a plain NEAR transfer is fine).
- Cut: NEAR Intents, reputation scores, multiple APIs.

## Rules
- **Testnet only.** Never mainnet, never real funds.
- **Never commit keys.** Testnet key files live in `keys/` or `.env`, both git-ignored.
- **Verify each feature end to end** (real calls on testnet) before moving on. Tests passing is not enough.
- **Fallback:** if NEP-413 verification isn't working within 2 hours, sign a timestamp with the NEAR key instead and keep going.
- **Keep the last 1.5 hours** for README, demo video and the X post.
- Read `PLAN.md` for the order of work. Update `STATUS.md` whenever you start, finish or get blocked on a step.
