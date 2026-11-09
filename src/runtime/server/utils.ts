import { WazobiaMail, type WazobiaClientOptions } from 'wazobiamail';

export function serverWazobiaClient(
  event?: any,
  overrideOptions?: WazobiaClientOptions
): WazobiaMail {
  if (overrideOptions) {
    return new WazobiaMail(overrideOptions);
  }

  // Attempt to resolve configuration from Nitro event context or runtime config if available
  let runtimeConfig: Record<string, any> | undefined;

  try {
    // Check global useRuntimeConfig in Nitro context
    const globalRuntimeConfig = (globalThis as any).useRuntimeConfig;
    if (typeof globalRuntimeConfig === 'function') {
      runtimeConfig = globalRuntimeConfig(event);
    }
  } catch {
    // Nitro context not active or runtime config unavailable
  }

  const wazobiaConfig = runtimeConfig?.wazobiamail || {};

  const apiKey = wazobiaConfig.apiKey || process.env.WAZOBIA_API_KEY || process.env.WAZOBIAMAIL_API_KEY;
  const baseUrl = wazobiaConfig.baseUrl || process.env.WAZOBIA_BASE_URL || 'https://app.wazobiamail.com/api/v1';
  const timeout = wazobiaConfig.timeout ? Number(wazobiaConfig.timeout) : 30000;

  return new WazobiaMail({
    apiKey,
    baseUrl,
    timeout,
  });
}
