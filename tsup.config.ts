import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'runtime/server/utils': 'src/runtime/server/utils.ts',
  },
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
