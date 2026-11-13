import 'dotenv/config';

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const config = {
  network: process.env.NEAR_NETWORK ?? 'testnet',
  rpcUrl: process.env.NEAR_RPC_URL ?? 'https://rpc.testnet.near.org',
  ownerAccount: process.env.OWNER_ACCOUNT ?? '',
  freeCallsPerWindow: num(process.env.FREE_CALLS_PER_WINDOW, 10),
  windowSeconds: num(process.env.WINDOW_SECONDS, 3600),
  priceNear: process.env.PRICE_NEAR ?? '0.1',
  callsPerPayment: num(process.env.CALLS_PER_PAYMENT, 50),
  payToAccount: process.env.PAY_TO_ACCOUNT ?? '',
  recipient: process.env.GATE_RECIPIENT ?? 'swarmmeter',
  port: num(process.env.PORT, 8787),
};

if (config.network !== 'testnet') {
  throw new Error('SwarmMeter is testnet only. Set NEAR_NETWORK=testnet.');
}
