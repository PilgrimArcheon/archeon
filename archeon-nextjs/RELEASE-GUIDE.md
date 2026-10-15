# Archeon unified release: web + TackBoard desktop

This is a source release made from the two October 15 project archives. No production deployment, live Neon migration, or signed desktop installer was performed while assembling it.

## 1. Protect production data

1. Back up your existing Neon branch using Neon backups/branching before applying SQL.
2. Export a TackBoard backup from EACH web browser. Export any offline desktop notes you want to preserve.
3. Back up your existing repositories/branches. Review the updated files before merging; do not overwrite newer work blindly.

## 2. Additive Neon migration

In the Neon SQL Editor for the **existing Archeon database**, run `scripts/archeon-feedback-admin.sql`. It creates `archeon_feedback` and `archeon_feedback_rate_limits`. The script does not alter invoice records or TackBoard cloud documents.

If `ARCHEON_DATABASE_URL`/`ARCHEON_AUTH_RATE_SECRET` are already configured, the support form then writes into this private inbox. Anonymous support messages are limited by a hashed-IP, database-enforced hourly counter. In production, consider adding CAPTCHA/bot protection and a data retention policy before inviting widespread anonymous submissions.

## 3. Choose your private administrator

Use `/app/auth/sign-in` to log into your existing Archeon account (or create one). Find the exact UUID of that account in Neon with a read-only SQL query:

```sql
SELECT id, email FROM archeon_users WHERE email = 'your-own-email@example.com';
```

In Vercel → Project → Environment Variables, set:

- `ARCHEON_ADMIN_USER_IDS`: that UUID (or comma-separated UUIDs). **Do not use an email-only admin check.**
- `ARCHEON_ADMIN_SESSION_SECRET`: a NEW, independent 32+ character random secret, generated locally (`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`).
- Keep your existing `ARCHEON_DATABASE_URL` and `ARCHEON_AUTH_RATE_SECRET` private, server-side, and unchanged.

Then redeploy and visit `/app/admin`. The dashboard requires the existing authenticated Archeon account **and** a fresh password recheck, with a short-lived admin session bound to that login session. It shows account/workspace counts, invoice counts, TackBoard cloud documents, feedback, simple seven-day activity counts, and database size/health. It does **not** claim to show Neon compute hours, branching quotas or billing; those need an authorized Neon management integration. Enable multi-factor authentication and event audit logging before treating this as a production-grade staff console.

## 4. Web source checks and review

From the `archeon-nextjs` folder:

```bash
npm ci
npm run verify:release
npm run preflight
npm run typecheck
npm run build
npm run verify:invoice-receipts
npm run verify:invoice-gmail
```

Smoke-test locally before pushing a staging branch:

- Portfolio home, Game Development, Product Design, all project/product links.
- Dark/light appearance on the portfolio and `/app`, `/app/invoice`, `/app/tackboard`, `/app/support`, `/app/admin`, and the TackBoard desktop install page.
- Register/sign in from `/app/auth/sign-in`; access both Invoice Studio and TackBoard with the same account. Verify guest invoice PDF creation is unchanged.
- Paper-themed Invoice Studio, icon, invoices, invoice PDFs, receipts, and client data.
- Submit feedback via `/app/support?source=tackboard` and `/app/support?source=invoice`, request an app using the Apps pop-up; verify private inbox and status updates as your allowlisted admin.
- Submit a portfolio Contact message, verify it enters the private feedback inbox.
- Rename/create a TackBoard board and verify it survives reload and appears on a second web device.

## 5. Separate desktop source

The desktop folder is deliberately **not inside** the Next.js project. Keep it in a separate `TackBoardDesktop` repository. Do not copy Electron's `node_modules`, `dist`, cache or user-data directory into Git.

```bash
cd TackBoardDesktop
npm ci
npm test
npm start
```

Optional Chromium UI test (requires Python Playwright and Chromium):

```bash
python tests/hub-smoke.py
```

**Pairing behavior:** On your first connection, use Settings → **Export local backup** if needed. **Connect account** always replaces this computer's local boards and queued edits with your current cloud boards. The app confirms this action and also keeps a private internal recovery backup. Do not use desktop accounts to upload old offline work implicitly.

The desktop's Active board dropdown now includes **Create new board** and **Rename current board**. Notes, boards, checklist actions and renames use the existing scoped Neon synchronization API. The mint-glass appearance, light/dark/system themes and floating note windows remain intact.

For native builds on the matching operating systems:

```bash
npm run dist:win  # Windows only
npm run dist:mac  # macOS only
```

Both workflows are also defined in `.github/workflows/tackboard-desktop-installers.yml` in the separate desktop repository. Verify both Apple Silicon/Intel Mac builds and Windows installer behavior. The default preview workflow **does not sign or notarize** builds; do not distribute it as a production-ready one-click installer. After signing, notarization, and device verification, publish hosted downloads and set `NEXT_PUBLIC_TACKBOARD_WINDOWS_DOWNLOAD_URL`, `NEXT_PUBLIC_TACKBOARD_MAC_ARM64_DOWNLOAD_URL`, and `NEXT_PUBLIC_TACKBOARD_MAC_INTEL_DOWNLOAD_URL` on Vercel. The website then displays the download buttons.

## 6. Cleanup performed

- Preserved working website routes, Next.js settings, public assets, TackBoard cloud CAS API, invoice routes, and the shared account system.
- Removed copied TS build output and old preview screenshots from the Next.js source package.
- Removed unused Brevo helper modules, the unused browser-extension installer UI and retired browser-extension cleanup script. Kept the old extension-named **API** route because it still issues the scoped pairing keys used by TackBoard Desktop. Kept the old magic-link 410 routes as safe compatibility endpoints and kept historical database migrations for reproducibility.
- Removed a **personal desktop backup JSON** from the desktop source archive. Personal notes/backups should never enter Git or an installer.
- Fixed the Electron package file manifest to include `src/reconcile.cjs`.
- Added source-only regression checks and ignored build/backup file types.

## 7. Release gates not yet completed

A successful source syntax check is not a substitute for a full Next.js build. Native Electron tests and the desktop hub browser smoke test passed during packaging. A complete Next.js `npm ci`/`next build` couldn't be executed here due to unavailable registry downloads; run those commands locally before merging/deploying. Live Neon support submissions, admin authorization on your configured account, desktop-web bidirectional sync, accessibility reviews, macOS notarization, Windows code-signing, and security testing remain required before a customer release.
