# WazobiaMail Nuxt Module

**Start free with 3,000 emails/month.** WazobiaMail is a Resend alternative for transactional email through an API or SMTP, with sending domains, hosted mailboxes and deliverability tools.

[![npm version](https://img.shields.io/npm/v/wazobiamail-nuxt.svg?style=flat-square)](https://www.npmjs.com/package/wazobiamail-nuxt)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.x%20%7C%204.x-00DC82.svg?style=flat-square)](https://nuxt.com/)
[![Docs](https://img.shields.io/badge/Docs-docs.wazobiamail.com-blueviolet.svg?style=flat-square)](https://docs.wazobiamail.com)

Official Nuxt 3 & Nuxt 4 module for [WazobiaMail](https://wazobiamail.com). Full-stack email sending, Nitro server utilities, automated secret isolation, and auto-imported Vue composables.

> 📚 **Official Platform Documentation**: Visit [docs.wazobiamail.com](https://docs.wazobiamail.com) for exhaustive API references, architecture guides, DNS setup walkthroughs, and webhook configurations.

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

### 2. Delivery Tracking, Stats, Read Receipts & Click Receipts

Every message sent through Nitro server routes returns a `trackingId`. WazobiaMail automatically tracks:

- **Read Receipts (Open Tracking)**: An invisible 1x1 tracking pixel records when recipients open your email, capturing timestamp, IP geolocation, user-agent, and open counts.
- **Click Receipts (Link Tracking)**: Links in HTML content are automatically rewritten to your tracking domain, logging each click event, recipient, destination URL, and click counts.
- **Delivery Lifecycle**: Real-time status progression from `queued` ➔ `sent` ➔ `delivered` ➔ `opened` ➔ `clicked` ➔ `bounced`.

In Nitro server endpoints (e.g., `server/api/receipts/[id].get.ts`):

```typescript
// server/api/receipts/[id].get.ts
export default defineEventHandler(async (event) => {
  const client = serverWazobiaClient(event);
  const trackingId = getRouterParam(event, 'id')!;

  const receipt = await client.messages.getTracked(trackingId);

  return {
    status: receipt.data.message.status,
    deliveredAt: receipt.data.message.lastDeliveryEventAt,
    openCount: receipt.data.message.openCount,     // Read Receipts count
    clickCount: receipt.data.message.clickCount,   // Click Receipts count
    events: receipt.data.events,                   // Detailed timeline
  };
});
```

---

### 3. Auto-Imported Composables in Pages & Components

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

### 4. Enterprise Mailbox Inbox

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

## Subdomain vs. Apex / Root Domain Architecture & Edge Cases

When configuring custom domains for transactional sending, choosing between a **subdomain** (e.g. `mail.yourdomain.com` or `send.yourdomain.com`) and an **apex/root domain** (`yourdomain.com`) is a critical architectural decision.

### 1. Why Using a Subdomain is Recommended (Root Domain NOT Used)

In production environments, **we strongly recommend using a dedicated sending subdomain** rather than your root/apex domain:

- **Preserve Existing Business Email (Google Workspace / Microsoft 365):**
  If your root domain (`yourdomain.com`) already receives corporate email via Google Workspace or Microsoft 365, adding MX records pointing to WazobiaMail at the root apex `@` will **break your existing company email inbox routing**. Using `mail.yourdomain.com` isolates transactional email routing completely.
- **Isolate Sender Reputation:**
  Transactional emails (password resets, invoices, OTP codes) have high engagement and deliverability requirements. Sending from a subdomain (`mail.yourdomain.com`) ensures that any accidental marketing spam complaints won't degrade your corporate employee email deliverability.
- **Avoid SPF 10-Lookup Limit Exhaustion (RFC 7208):**
  SPF records have a strict limit of 10 DNS lookups. Root domains often accumulate multiple SaaS providers (Google, Zendesk, Salesforce, HubSpot). A dedicated subdomain gives WazobiaMail its own clean, independent SPF record without lookup count contention.

---

### 2. DNS Hostnames When Root Domain is NOT Used

When verifying a subdomain like `mail.yourdomain.com`, ensure you configure your DNS provider (Cloudflare, Route53, Namecheap, GoDaddy) with the correct hostnames:

| Record Type | Host / Name (if domain is `mail.yourdomain.com`) | Target / Value | Notes |
| :--- | :--- | :--- | :--- |
| **TXT (SPF)** | `mail` (or `mail.yourdomain.com`) | `v=spf1 include:_spf.wazobiamail.com ~all` | **Do NOT** place on `@` root |
| **TXT (DKIM)** | `wzbm._domainkey.mail` | `k=rsa; p=MIGfMA0GCSqGSIb3...` | Selector is scoped to the subdomain |
| **MX (Hosted)**| `mail` (priority 10 / 20) | `mx1.wazobiamail.com` / `mx2.wazobiamail.com` | Only required if receiving mail or hosted inboxes |
| **CNAME (Tracking)** | `email.mail` | `trk.wazobiamail.com` | Used for custom branded click/open tracking |
| **TXT (DMARC)** | `_dmarc.mail` (or fallback to `_dmarc`) | `v=DMARC1; p=reject; rua=mailto:dmarc@...` | Resolvers fall back to apex `_dmarc` if omitted |

---

### 3. Critical Edge Cases & Troubleshooting

#### ⚠️ Edge Case 1: `UnverifiedSenderDomain` (HTTP 422 / 403)
- If you verified `mail.yourdomain.com` in WazobiaMail, your `from` address **must** match that subdomain:
  - ✅ **Valid**: `from: 'Acme <billing@mail.yourdomain.com>'`
  - ❌ **Invalid**: `from: 'Acme <billing@yourdomain.com>'` (Fails because apex `yourdomain.com` is unverified)
- Attempting to send from an unverified parent domain will be rejected with an `UnverifiedSenderDomain` error.

#### 💡 Edge Case 2: Reply-To Decoupling in Nitro Server Routes
- You can send from the verified subdomain while routing customer replies to your corporate root domain mailbox:
  ```typescript
  // server/api/contact.post.ts
  export default defineEventHandler(async (event) => {
    const client = serverWazobiaClient(event);
    const body = await readBody(event);

    return await client.messages.send({
      from: 'Acme Orders <orders@mail.yourdomain.com>', // Verified sending subdomain
      replyTo: 'support@yourdomain.com',               // Your corporate inbox on Google Workspace/Outlook
      to: body.email,
      subject: 'Order Confirmation',
      html: '<p>Thank you for your order!</p>',
    });
  });
  ```
- This gives you the deliverability benefits of a dedicated sending subdomain while preserving user-friendly reply handling.

#### ☁️ Edge Case 3: Cloudflare Proxy Status (Grey Cloud vs. Orange Cloud)
- **Problem**: In Cloudflare DNS, leaving the proxy enabled (**Orange Cloud**) for mail or tracking records breaks SMTP traffic, DNS verification, and SSL certificate issuance.
- **Solution**: Always toggle Cloudflare records to **"DNS only" (Grey Cloud / Proxied: Off)** for all WazobiaMail SPF, DKIM, MX, and tracking records.

#### ⏳ Edge Case 4: Negative DNS Caching (SOA Minimum TTL Delay)
- If you trigger verification immediately after publishing DNS records before they propagate, recursive resolvers may cache the negative response (`NXDOMAIN` or empty record).
- Subsequent verification checks will continue to fail until the DNS TTL expires (often 5 to 60 minutes).
- **Tip**: Test propagation first with `dig TXT mail.yourdomain.com` or `dig TXT wzbm._domainkey.mail.yourdomain.com +trace` before triggering verification.

#### 🛡️ Edge Case 5: DMARC Subdomain Policy (`sp=`) Inheritance
- If your apex domain (`yourdomain.com`) has a DMARC record with `sp=reject` or `sp=quarantine`:
  - Any subdomain (e.g. `mail.yourdomain.com`) automatically inherits that rejection policy unless it defines its own `_dmarc.mail.yourdomain.com` record.
  - If SPF or DKIM alignment fails on the subdomain, recipient mail servers (Gmail, Yahoo, Outlook) will reject or spam-folder your emails immediately. Ensure both SPF and DKIM pass before sending production traffic.

#### 📬 Edge Case 6: Headless Inboxes & Hosted Mailboxes on Subdomains
- When provisioning hosted mailboxes (`useMailbox`), the mailbox address is generated under the specific verified domain (e.g. `support@mail.yourdomain.com`).
- Inbound receiving requires the MX records for that exact subdomain to be pointing to WazobiaMail. Do not point the root domain MX to WazobiaMail if you have existing email services there.

#### 🔁 Edge Case 7: Network Timeouts & Idempotency
- If an HTTP request times out due to transient network issues, the email may already have been queued by the API Gateway.
- Always provide an `idempotencyKey` when dispatching critical transactional messages. Retrying with the same key returns the existing tracking receipt without duplicate sending.

---

## License

MIT License &copy; 2026 WazobiaMail

---

## Reading spam-check scores

The spam check returns a penalty `score`, a `threshold`, an `isSpam` boolean and an inverse `deliverabilityScore` (0–100, higher is better).

| `score` | `rating` | `isSpam` | `deliverabilityScore` | Decision |
| --- | --- | --- | --- | --- |
| `0.0 – 1.9` | `low_risk` | `false` | `81 – 100` | **Okay to send.** Clean or only minor findings. |
| `2.0 – 4.9` | `moderate_risk` | `false` | `51 – 80` | **Review first.** Not blocked, but fix the highest-point rules before sending. |
| `5.0 +` | `high_risk` | `true` | `0 – 50` | **Do not send.** Fix the findings and re-run the check. |

`isSpam` is the authoritative decision: it is true when `score >= threshold`. Read `threshold` from the response instead of hard-coding `5.0`; the server can change it. A green score is not a delivery guarantee — domain authentication, sender reputation and recipient engagement still matter.

## Official WazobiaMail SDKs

WazobiaMail is a **Resend alternative** for transactional email through an **API or SMTP**, with sending domains, hosted mailboxes and deliverability tools. Start free with **3,000 emails/month**.

The SDKs below all use the WazobiaMail API; SMTP/legacy clients that need SMTP submission can use WazobiaMail's SMTP access from the dashboard. Choose the package that matches your stack:

| Platform | Install | Registry | Source |
| --- | --- | --- | --- |
| TypeScript / Node.js | `npm install wazobiamail` | [npm](https://www.npmjs.com/package/wazobiamail) | [GitHub](https://github.com/WazobiaMail/wazobiamail-node) |
| Vue 3 | `npm install wazobiamail-vue wazobiamail` | [npm](https://www.npmjs.com/package/wazobiamail-vue) | [GitHub](https://github.com/WazobiaMail/wazobiamail-vue) |
| Nuxt 3 & 4 | `npm install wazobiamail-nuxt` | [npm](https://www.npmjs.com/package/wazobiamail-nuxt) | [GitHub](https://github.com/WazobiaMail/wazobiamail-nuxt) |
| Python | `pip install wazobiamail` | [PyPI](https://pypi.org/project/wazobiamail/) | [GitHub](https://github.com/WazobiaMail/wazobiamail-python) |
| PHP | `composer require wazobiamail/wazobiamail-php` | [Packagist](https://packagist.org/packages/wazobiamail/wazobiamail-php) | [GitHub](https://github.com/WazobiaMail/wazobiamail-php) |
| Laravel | `composer require wazobiamail/wazobiamail-laravel` | [Packagist](https://packagist.org/packages/wazobiamail/wazobiamail-laravel) | [GitHub](https://github.com/WazobiaMail/wazobiamail-laravel) |
| Rust | `cargo add wazobiamail` | [crates.io](https://crates.io/crates/wazobiamail) | [GitHub](https://github.com/WazobiaMail/wazobiamail-rust) |
| Go | `go get github.com/WazobiaMail/wazobiamail-go@v0.1.0` | [pkg.go.dev](https://pkg.go.dev/github.com/WazobiaMail/wazobiamail-go) | [GitHub](https://github.com/WazobiaMail/wazobiamail-go) |
| WordPress | Upload the plugin ZIP | [Packagist](https://packagist.org/packages/wazobiamail/wazobiamail-wordpress) · [GitHub releases](https://github.com/WazobiaMail/wazobiamail-wordpress/releases) | [GitHub](https://github.com/WazobiaMail/wazobiamail-wordpress) |

### What each package gives you

- **TypeScript / Node.js (`wazobiamail`)** — A zero-production-dependency typed client for Node.js 18+, Bun, Deno and edge runtimes. It ships ESM and CommonJS builds, typed errors, request builders, URL/multipart attachments, and resources for messages, domains, mailboxes, API keys, billing, units, plans, tracking, spam checks and support.
- **Vue 3 (`wazobiamail-vue`)** — A Vue plugin plus reactive composables: `useSendMail` for loading/success/error state, `useMailbox` for paginated headless inboxes with polling and optimistic delete, `useDomains` for domain/DNS workflows, and `useSpamCheck` for pre-flight deliverability checks.
- **Nuxt 3 & 4 (`wazobiamail-nuxt`)** — Keeps `runtimeConfig.wazobiamail.apiKey` on the Nitro server, adds the auto-imported `serverWazobiaClient(event)` helper, and auto-imports the Vue composables. Ideal for Nuxt apps that must not expose an API key to the browser bundle.
- **Python (`wazobiamail`)** — A synchronous, PEP 561-compliant client with **zero runtime dependencies** (standard library only), dataclass models and typed responses. Works in Django (sync views or `sync_to_async`), FastAPI (`def` endpoints or `run_in_threadpool`), Flask, scripts and workers. Includes webhook HMAC verification.
- **PHP (`wazobiamail/wazobiamail-php`)** — A Composer/Guzzle 7 client for PHP 8.1+. It accepts ergonomic flat send payloads or the canonical nested `content` shape, supports URL attachments and automatic multipart upload for inline files, and maps API failures to typed exceptions.
- **Laravel (`wazobiamail/wazobiamail-laravel`)** — Registers a native `wazobiamail` mail driver, service provider and `WazobiaMail` facade for Laravel 10–13. Existing `Mail`, Mailables and notifications keep working; the package also exposes domains, mailboxes and webhook verification.
- **Rust (`wazobiamail`)** — Async, strongly typed and `#![forbid(unsafe_code)]`, built on reqwest/tokio. Includes fluent request builders, typed response models, typed errors, secret masking in `Debug`, and resources for sending, domains, Cloudflare DNS, mailboxes, templates, tracking and billing.
- **Go (`github.com/WazobiaMail/wazobiamail-go`)** — Context-first, concurrency-safe and zero-dependency (standard library only). Typed request/response models, API-key or Bearer auth, multipart attachments, domains, mailboxes, billing, units, plans, support, templates and HMAC webhook verification.
- **WordPress (`wazobiamail-wordpress`)** — Routes every `wp_mail()` call through the WazobiaMail API without changing forms or plugins. It registers the site domain, displays SPF/DKIM/DMARC/MX records, verifies DNS, uploads attachments, and keeps recent delivery receipts in the admin screen.

### Documentation links

- [Official SDK guide and examples](https://docs.wazobiamail.com/docs/guides/sdks)
- [API reference](https://docs.wazobiamail.com/docs/api-reference)
- [Authentication and API keys](https://docs.wazobiamail.com/docs/guides/authentication)
- [Sending domains and DNS](https://docs.wazobiamail.com/docs/guides/domains)
- [Webhooks](https://docs.wazobiamail.com/docs/guides/webhooks)
