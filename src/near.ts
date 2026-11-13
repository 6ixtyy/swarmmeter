import { JsonRpcProvider } from 'near-api-js';
import { config } from './config.js';

export const provider = new JsonRpcProvider({ url: config.rpcUrl });

/** Raw JSON-RPC call (for endpoints where we want the plain response shape). */
export async function rpc<T = any>(method: string, params: unknown): Promise<T> {
  const res = await fetch(config.rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'swarmmeter', method, params }),
  });
  const j: any = await res.json();
  if (j.error) throw new Error(j.error?.cause?.name ?? j.error?.data ?? JSON.stringify(j.error));
  // Some query errors come back inside result.error instead of the JSON-RPC error field.
  if (j.result && typeof j.result.error === 'string') throw new Error(j.result.error);
  return j.result as T;
}
