import { describe, it, expect } from 'bun:test';
import { nuxtCtx } from '@nuxt/kit';
import module from '../src/module';

describe('WazobiaMail Nuxt Module', () => {
  it('has proper module metadata and configKey', async () => {
    const meta = await module.getMeta();
    expect(meta.name).toBe('wazobiamail-nuxt');
    expect(meta.configKey).toBe('wazobiamail');
    expect(meta.compatibility.nuxt).toContain('^3.0.0 || ^4.0.0');
  });

  it('registers module and configures runtimeConfig with secret isolation', async () => {
    const mockNuxt = {
      _version: '3.15.0',
      options: {
        runtimeConfig: {
          public: {},
        },
        build: { transpile: [] },
        modules: [],
        _installedModules: [],
      },
      hook: () => {},
      callHook: async () => {},
      hooks: { hook: () => {}, callHook: async () => {} },
    } as any;

    nuxtCtx.set(mockNuxt);

    await module(
      {
        apiKey: 'wzbm_live_supersecret12345',
        baseUrl: 'https://custom.wazobiamail.com/api/v1',
        timeout: 20000,
      },
      mockNuxt
    );

    // Private runtimeConfig must have apiKey
    expect(mockNuxt.options.runtimeConfig.wazobiamail.apiKey).toBe('wzbm_live_supersecret12345');
    expect(mockNuxt.options.runtimeConfig.wazobiamail.baseUrl).toBe('https://custom.wazobiamail.com/api/v1');
    expect(mockNuxt.options.runtimeConfig.wazobiamail.timeout).toBe(20000);

    // Public runtimeConfig MUST NOT leak apiKey to the browser bundle
    expect(mockNuxt.options.runtimeConfig.public.wazobiamail.baseUrl).toBe('https://custom.wazobiamail.com/api/v1');
    expect(mockNuxt.options.runtimeConfig.public.wazobiamail.apiKey).toBeUndefined();
  });
});
