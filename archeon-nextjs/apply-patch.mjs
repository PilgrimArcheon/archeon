// Run: node apply-patch.mjs C:\path\to\archeon-nextjs
import { existsSync, mkdirSync, copyFileSync, rmSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const source = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.argv[2] ?? ".");
if (!existsSync(join(target, "package.json")) || !existsSync(join(target, "src/app/app/invoice/InvoiceClient.tsx"))) {
  console.error("Please specify the root of your existing Archeon Next.js project.");
  process.exit(1);
}
const files = [
  "src/app/app/invoice/InvoiceClient.tsx",
  "src/app/app/invoice/invoice.css",
  "src/app/api/apps/invoice/invoices/[id]/tracking/route.ts",
  "src/app/app/page.tsx", "src/app/app/apps.module.css",
  "src/app/layout.tsx", "INVOICE-MANUAL-TRACKING.md"
];
for (const rel of files) {
  const from = join(source, rel), to = join(target, rel);
  mkdirSync(dirname(to), { recursive: true });
  if (resolve(from) !== resolve(to)) copyFileSync(from, to);
  console.log("Updated", rel);
}
// The App Router file-based icon outranks the old metadata favicon. Delete it
// only for the requested restoration of the original Archeon icon setup.
for (const rel of ["src/app/icon.png", "src/components/ui/ArcheonMark.tsx",
                   "ARCHEON-A-MARK-UPDATE.md", "INVOICE-ICON-DATE-UPDATE.md"]) {
  rmSync(join(target, rel), { force: true });
  console.log("Reverted obsolete", rel);
}
console.log("Done. No database migration is needed; restart npm run dev.");
