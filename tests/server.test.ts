import { describe, it, expect } from 'bun:test';
import { serverWazobiaClient } from '../src';
import { WazobiaMail } from 'wazobiamail';

describe('serverWazobiaClient Server Utility', () => {
  it('instantiates WazobiaMail client with explicit options', () => {
    const client = serverWazobiaClient(undefined, {
      apiKey: 'wzbm_nitro_test_123',
      baseUrl: 'https://nitro.wazobiamail.com/api/v1',
      timeout: 15000,
    });

    expect(client).toBeInstanceOf(WazobiaMail);
    expect(client.toJSON().baseUrl).toBe('https://nitro.wazobiamail.com/api/v1');
    expect(client.toJSON().apiKey).toContain('wzbm_');
  });

  it('resolves configuration from globalThis.useRuntimeConfig in Nitro context', () => {
    (globalThis as any).useRuntimeConfig = () => ({
      wazobiamail: {
        apiKey: 'wzbm_runtime_config_key',
        baseUrl: 'https://runtime.wazobiamail.com/api/v1',
      },
    });

    const client = serverWazobiaClient();

    expect(client).toBeInstanceOf(WazobiaMail);
    expect(client.toJSON().baseUrl).toBe('https://runtime.wazobiamail.com/api/v1');
    expect(client.toJSON().apiKey).toContain('wzbm_');

    delete (globalThis as any).useRuntimeConfig;
  });
});
