# WazobiaMail Nuxt Module

[![npm version](https://img.shields.io/npm/v/wazobiamail-nuxt.svg?style=flat-square)](https://www.npmjs.com/package/wazobiamail-nuxt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.x%20%7C%204.x-00DC82.svg?style=flat-square)](https://nuxt.com/)

Official Nuxt 3 & Nuxt 4 module for [WazobiaMail](https://wazobiamail.com). Full-stack email sending, Nitro server utilities, automated secret isolation, and auto-imported Vue composables.

---

## Features

- 🔒 **Zero-Leak Secret Isolation**: API keys live exclusively in Nitro server runtime configuration (`runtimeConfig.wazobiamail.apiKey`) and are never exposed to browser bundles.
- ⚡ **Auto-Imported Vue Composables**: `useSendMail`, `useMailbox`, `useDomains`, `useSpamCheck` available in every page and component without manual imports.
- 🛠️ **Nitro Server Integration**: `serverWazobiaClient(event)` auto-imported inside `server/api/` route handlers.
- 📬 **Enterprise Headless Inbox**: Full access to hosted mailboxes, unread filters, pagination, and real-time polling.
- 📦 **Nuxt 3 & Nuxt 4 Ready**: Built strictly on `@nuxt/kit` with full support for TypeScript and Nuxt DevTools.

---

## Installation

```bash
bun add wazobiamail-nuxt
# or
npm install wazobiamail-nuxt
```

---

## Configuration

Add `wazobiamail-nuxt` to the `modules` section of your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    'wazobiamail-nuxt',
  ],

  wazobiamail: {
    // Falls back to process.env.WAZOBIA_API_KEY if omitted
    apiKey: process.env.WAZOBIA_API_KEY,
    baseUrl: process.env.WAZOBIA_BASE_URL || 'https://app.wazobiamail.com/api/v1',
  },
});
```

Add your credentials to your `.env` file:

```dotenv
WAZOBIA_API_KEY=wzbm_live_your_secret_key_here
```

---

## Usage

### 1. Server-Side Sending in Nitro API Routes (`server/api/contact.post.ts`)

In Nuxt full-stack applications, keep email dispatch on the Nitro server so your API key never touches the user's browser:

```typescript
// server/api/contact.post.ts
export default defineEventHandler(async (event) => {
  const client = serverWazobiaClient(event);
  const body = await readBody(event);

  const response = await client.messages.send({
    from: 'Contact Form <noreply@yourdomain.com>',
    to: 'support@yourdomain.com',
    replyTo: body.email,
    subject: `New inquiry from ${body.name}`,
    html: `<p>${body.message}</p>`,
  });

  return { success: true, trackingId: response.data.result.trackingId };
});
```

---

### 2. Auto-Imported Composables in Pages & Components

All composables from `wazobiamail-vue` are automatically imported in your Nuxt templates:

```vue
<!-- app.vue or pages/index.vue -->
<script setup lang="ts">
const { isLoading, isSuccess, error, send } = useSendMail();

const sendNotification = async () => {
  await send({
    from: 'alerts@yourdomain.com',
    to: 'customer@example.com',
    subject: 'Order Processed',
    html: '<p>Your order is on its way!</p>',
  });
};
</script>

<template>
  <button @click="sendNotification" :disabled="isLoading">
    {{ isLoading ? 'Sending...' : 'Send Alert' }}
  </button>
  <p v-if="isSuccess">Sent!</p>
  <p v-if="error" class="error">{{ error.message }}</p>
</template>
```

---

### 3. Enterprise Mailbox Inbox

```vue
<!-- pages/inbox.vue -->
<script setup lang="ts">
const { messages, isLoading, refresh, deleteMessage } = useMailbox('mb_12345', {
  pollInterval: 10000,
});
</script>

<template>
  <div>
    <h1>Support Inbox</h1>
    <button @click="refresh" :disabled="isLoading">Refresh</button>

    <ul>
      <li v-for="msg in messages" :key="msg.id">
        <strong>{{ msg.subject }}</strong> - <span>{{ msg.from }}</span>
        <button @click="deleteMessage(msg.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>
```

---

## License

MIT License &copy; 2026 WazobiaMail
