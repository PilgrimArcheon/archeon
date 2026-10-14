# Archeon — initial Vercel deployment and update workflow

## What this release is

This archive contains the **latest uploaded source and public assets**, plus the missing Next.js root files restored from an earlier Archeon release. It is intended to be placed at `archeon/archeon-nextjs/`. It has **not** yet been deployed to Vercel. A full Next.js production build requires installing dependencies in your environment (package installation was unavailable in the packaging environment).

The Web portfolio, Product Design pages, Products catalogue, Invoice Studio and TackBoard are in this package. A compiled Windows desktop application is **not** included, and Vercel cannot host an always-on-top desktop process. The TackBoard desktop page is informational until you publish an installer.

## 1. Prepare safely

1. Back up or commit your existing local `archeon/archeon-nextjs` directory.
2. Extract the deployment ZIP so `package.json` is at `archeon/archeon-nextjs/package.json` (do not nest the directory twice).
3. Keep your existing `.env.local` file safe: it contains secrets and is not in the ZIP.
4. Use Node.js 22 LTS (or a supported newer Node LTS).

From Windows PowerShell:

```powershell
cd "C:\path\to\archeon\archeon-nextjs"
node --version
npm install
npm run preflight
npm run typecheck
npm run build
npm run dev
```

If the build fails, do not deploy until the error is resolved. Keep the full terminal output.

## 2. Neon database

This app uses an existing Neon PostgreSQL database. Create a Neon branch for testing if possible. Set either `ARCHEON_DATABASE_URL` (preferred) or the legacy `INVOICE_DATABASE_URL` in your `.env.local` and Vercel.

For a brand-new database, inspect and run migrations **in order** in Neon SQL Editor:

1. `scripts/public-apps-schema.sql` (Archeon users, sessions, workspace invoice tables, password credentials).
2. `scripts/tackboard-cloud-sync.sql` (per-user TackBoard cloud documents and companion token tables).

If you already used these tables, do not blindly reset or drop them. `scripts/archeon-password-auth.sql` can supplement an earlier schema lacking `archeon_password_credentials`. `scripts/invoice-schema.sql` is for the legacy single-owner invoice schema, not the new shared-account schema.

## 3. Environment variables

Create `.env.local` from `.env.example`, without including real secrets in Git. Required for accounts and cloud features:

| Variable | Purpose |
|--|--|
| `ARCHEON_DATABASE_URL` | Neon connection string with SSL enabled (or existing `INVOICE_DATABASE_URL`) |
| `ARCHEON_AUTH_RATE_SECRET` | Strong random secret, **at least 32 characters** |
| `NEXT_PUBLIC_SITE_URL` | Local: `http://localhost:3000`; Production: your actual HTTPS domain |

Set `ARCHEON_PUBLIC_URL` to the same origin if using Invoice Studio Gmail OAuth. Optional Google OAuth and Brevo/email variables are **not required for general browsing or password login**, but invoice email sending and the contact form may not work without provider credentials.

Generate the auth rate secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The current password accounts **do not verify email ownership and cannot send password resets**. Avoid distributing account sign-up widely while this is still a test release.

## 4. Push to GitHub

In the Git repository root (`archeon/` if the repository includes `archeon-nextjs/`):

```powershell
git status
git add archeon-nextjs
git commit -m "Deploy Archeon site and TackBoard web beta"
git push origin main
```

If you normally use feature branches, push one first and review its Vercel Preview deployment before merging into `main`.

Do not commit `.env.local`, database connection strings, any `.vercel` auth files, or API keys.

## 5. Configure Vercel

1. Go to https://vercel.com/new and import your GitHub repository, or open the existing Vercel project.
2. Choose **Next.js** as framework preset.
3. Set **Root Directory = `archeon-nextjs`** *only if the Git repo root contains that directory*. If `archeon-nextjs` itself is the Git repository root, leave Root Directory `./`.
4. Keep default build (`next build`) and default output settings. Do **not** set the output directory to `out`; this app has server-side APIs.
5. Under **Settings → Environment Variables**, enter the Neon URL and secret for Production (and separate test values for Preview if you have a Neon development branch):

```
ARCHEON_DATABASE_URL=<your Neon connection string>
ARCHEON_AUTH_RATE_SECRET=<your long random secret>
NEXT_PUBLIC_SITE_URL=https://archeon.vercel.app
ARCHEON_PUBLIC_URL=https://archeon.vercel.app
```

Do not paste angle-bracket placeholders literally. Use the *actual* Vercel-assigned domain. If `archeon.vercel.app` is not assigned to your project, use the domain Vercel gives you, or add the domain in **Settings → Domains** if available.
6. Deploy. Vercel builds the server routes and runs functions on its servers.

Important: Make sure `NEXT_PUBLIC_SITE_URL` matches the deployment host for metadata and redirects. The Gmail OAuth callback additionally requires its exact URL to be configured in Google if you want that optional feature.

## 6. Smoke tests (before making it public)

1. `/` — homepage and theme switch.
2. `/gamedev` — game dev portfolio.
3. `/product-design` — product portfolio.
4. `/products` and `/products/tackboard` — product catalog and showcase.
5. `/projects` — portfolio projects.
6. `/app` — app directory.
7. `/app/tackboard` — create/edit/complete notes as guest, then sign in and sync.
8. `/app/auth/sign-in` — registration/login and sign-out (test without exposing personal data).
9. `/app/invoice` — PDF generation and authenticated invoice list.

For cloud sync, create a test note in Browser A, wait for the quiet Synced indicator, then open Browser B signed into the **same test account** and verify it appears. Try a separate account and verify it cannot see the first account's notes.

If auth endpoints return `503`, check Vercel environment variables and Neon schema. If routes return `404`, check Vercel's Root Directory. If email delivery fails, remember it is an optional integration not configured by these core variables.

## 7. Ongoing updates

Use `feature/...` branches for changes. Push branch to GitHub → Vercel creates Preview → test → merge into `main` → Vercel automatically creates a Production deployment. This is the recommended low-risk workflow for ongoing app updates.

For a manual CLI deployment, from `archeon-nextjs` you can also run `npx vercel` (Preview) and `npx vercel --prod` (Production), after authenticating and linking your Vercel project. Never run `--prod` as a substitute for testing.

## Known limitations

- No independent Windows desktop executable is included with this web archive. The desktop companion remains a separate native app project.
- Cloud sync requires the Neon migration and credentials; this archive doesn't contain credentials.
- Email/password accounts currently lack ownership verification and password recovery.
- Contact form and Invoice Studio email sending are optional, not usable without configured provider credentials.
- A real production build and end-to-end Vercel/Neon test have not been performed in the packaging environment.
