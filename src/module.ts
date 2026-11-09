import {
  defineNuxtModule,
  addImports,
  addServerImports,
  createResolver,
} from '@nuxt/kit';
import { defu } from 'defu';

export interface ModuleOptions {
  /**
   * WazobiaMail API Key (`wzbm_live_...`).
   * Stored privately on the Nitro server and never exposed to the client.
   * If omitted, falls back to `process.env.WAZOBIA_API_KEY`.
   */
  apiKey?: string;
  /**
   * API Gateway Base URL.
   * @default 'https://app.wazobiamail.com/api/v1'
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'wazobiamail-nuxt',
    configKey: 'wazobiamail',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0',
    },
  },
  defaults: {
    apiKey: process.env.WAZOBIA_API_KEY,
    baseUrl: 'https://app.wazobiamail.com/api/v1',
    timeout: 30000,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // 1. Private Nitro Server runtimeConfig (DO NOT expose in public)
    nuxt.options.runtimeConfig.wazobiamail = defu(
      nuxt.options.runtimeConfig.wazobiamail as any,
      {
        apiKey: options.apiKey,
        baseUrl: options.baseUrl,
        timeout: options.timeout,
      }
    );

    // 2. Safe Public runtimeConfig (only non-secret values like baseUrl)
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {};
    nuxt.options.runtimeConfig.public.wazobiamail = defu(
      (nuxt.options.runtimeConfig.public as any).wazobiamail,
      {
        baseUrl: options.baseUrl,
      }
    );

    // 3. Auto-import Vue composables from wazobiamail-vue
    addImports([
      { name: 'useWazobiaMail', from: 'wazobiamail-vue' },
      { name: 'useSendMail', from: 'wazobiamail-vue' },
      { name: 'useMailbox', from: 'wazobiamail-vue' },
      { name: 'useDomains', from: 'wazobiamail-vue' },
      { name: 'useSpamCheck', from: 'wazobiamail-vue' },
    ]);

    // 4. Auto-import server utility for Nitro route handlers
    addServerImports([
      {
        name: 'serverWazobiaClient',
        from: resolver.resolve('./runtime/server/utils'),
      },
    ]);
  },
});
