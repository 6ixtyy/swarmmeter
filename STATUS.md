# Status

Update this whenever you start, finish or get blocked on a step from `PLAN.md`. If two sessions work in parallel, each claims a step here before starting it.

## Done
- Repo set up with CLAUDE.md, PLAN.md, STATUS.md.
- Step 1 Scaffold: Hono + TypeScript, `npm run dev` serves `/` and `/health`, `.env.example` added.
- Step 2 Testnet accounts: `npx tsx scripts/create-owner.ts [name.testnet]` creates or reuses an account via the testnet faucet helper, key saved to `keys/`. Owner `swarmmeter-mwf8izhm.testnet` (10 NEAR) and pay-to `swarmmeter-gate-89974.testnet` created and checked with `view_account`.
- Step 3 Signed requests: `src/nep413.ts` (payload hash) + `src/client.ts` (`signedFetch`). Signed message binds method, path, timestamp and body hash. `scripts/check-nep413.ts` shows our signatures match near-api-js `signMessage` byte for byte and pass its `verifyMessage` against testnet.

## In progress
- Step 4 Gate: verify.

## Blocked
- (none)

## Notes
- Deadline: Nov 14 2026, 23:59 UTC.
