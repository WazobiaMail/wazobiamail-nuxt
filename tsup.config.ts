import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  target: 'es2022',
  external: [
    '@nuxt/kit',
    'nuxt',
    'vue',
    'defu',
    'wazobiamail',
    'wazobiamail-vue',
  ],
});
