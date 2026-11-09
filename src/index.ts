import module from './module';

export default module;
export * from './module';
export { serverWazobiaClient } from './runtime/server/utils';

// Re-export all Vue composables and types so Nuxt developers can also import directly if needed
export * from 'wazobiamail-vue';
