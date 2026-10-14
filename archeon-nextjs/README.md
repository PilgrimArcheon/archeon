# Archeon — Personal Website & Apps

Next.js 15 App Router + TypeScript + Tailwind CSS. This project contains the Archeon personal website, portfolios, product showcases and experimental web apps.

## Start here

**For the first online release read [DEPLOY-TO-VERCEL.md](./DEPLOY-TO-VERCEL.md).** It covers GitHub, Vercel root directory, Neon schema, environment variables, first deployment and the follow-up update workflow.

## Run locally

```bash
npm install
npm run preflight
npm run typecheck
npm run build
npm run dev
```

Then visit `http://localhost:3000`.

Copy `.env.example` to `.env.local` and supply Neon + authentication values for account features. Do **not** commit `.env.local`. The portfolio pages can be browsed without these secrets; accounts, TackBoard cloud sync and server-side invoice storage cannot.

## Routes

- `/` — Archeon home
- `/gamedev` — Game Development portfolio
- `/product-design` — Product Design portfolio
- `/projects` — project directory
- `/products` and `/products/[slug]` — product catalog and case studies
- `/app` — applications directory
- `/app/tackboard` — TackBoard web app (guest/local and account/cloud)
- `/app/invoice` — Invoice Studio
- `/app/auth/sign-in` — shared Archeon email/password accounts

## Key constraints

- This is the **website**. A standalone Windows TackBoard desktop executable is not included in the web deployment; it is a separate native application build.
- Account emails aren't verified and there is not yet an email password-recovery flow. Use test accounts until these flows are ready for wider use.
- Gmail sending, the contact email form, and other email delivery features require optional external credentials and may be unavailable in this release.
- The original uploaded source archive was missing Next.js root configuration; root files were restored from an earlier Archeon release. The minimum Next.js version has been raised to a patched 15.5 release. Test the complete build before production.

## Updates

Push a feature branch, review the Vercel Preview deployment, then merge to `main` to automatically deploy. See the deployment guide.
