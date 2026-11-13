import { Hono } from 'hono';
import { verifyRequest, VerifyError } from './verify.js';

export const app = new Hono();

app.get('/', (c) => c.text('SwarmMeter: usage limits per owner for AI agent swarms.'));
app.get('/health', (c) => c.json({ ok: true }));

// Temporary probe for step 4: who am I, per the gate?
app.all('/whoami', async (c) => {
  try {
    const caller = await verifyRequest(c.req.raw, await c.req.text());
    return c.json(caller);
  } catch (e) {
    if (e instanceof VerifyError) return c.json({ error: e.message }, e.status as 401);
    throw e;
  }
});
