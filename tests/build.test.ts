import { describe, it, expect } from 'bun:test';
import defaultModule, { serverWazobiaClient } from '../dist/index.js';

describe('Built Nuxt Module Bundle Verification', () => {
  it('exports defineNuxtModule instance as default export', () => {
    expect(typeof defaultModule).toBe('function');
    expect(typeof defaultModule.getMeta).toBe('function');
  });

  it('contains expected Nuxt module metadata in built bundle', async () => {
    const meta = await defaultModule.getMeta();
    expect(meta.name).toBe('wazobiamail-nuxt');
    expect(meta.configKey).toBe('wazobiamail');
    expect(meta.compatibility.nuxt).toContain('^3.0.0 || ^4.0.0');
  });

  it('exports serverWazobiaClient server utility', () => {
    expect(typeof serverWazobiaClient).toBe('function');
    const client = serverWazobiaClient(undefined, { apiKey: 'wzbm_test_key' });
    expect(client).toBeDefined();
    expect(typeof client.messages.send).toBe('function');
  });
});
