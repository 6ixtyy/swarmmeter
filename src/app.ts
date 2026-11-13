import { Hono } from 'hono';

export const app = new Hono();

app.get('/', (c) => c.text('SwarmMeter: usage limits per owner for AI agent swarms.'));
app.get('/health', (c) => c.json({ ok: true }));
