const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const invoice = read('src/app/app/invoice/InvoiceClient.tsx');
const css = read('src/app/app/invoice/invoice.css');
const apps = read('src/app/app/page.tsx');
const shell = read('src/components/layout/SiteShell.tsx');
const header = read('src/components/layout/Header.tsx');
const theme = read('src/components/theme/GlobalThemeControl.tsx');
const globalCss = read('src/app/globals.css');
// The sample remains guest-only. Never show it inside the logged-in dashboard.
assert.match(invoice, /Try a sample invoice/);
assert.doesNotMatch(invoice, /Try sample <ArrowRight/);
assert.doesNotMatch(invoice, /className="tiny-avatar"/);
assert.match(invoice, /className="today-chip"/);
// The Apps directory owns its header toggle instead of getting a floating duplicate.
assert.match(apps, /<GlobalThemeControl inline\s*\/>/);
assert.match(shell, /pathname === "\/app" \|\| pathname === "\/app\/tackboard" \|\| pathname === "\/app\/invoice"/);
assert.match(theme, /archeon-inline-theme/);
assert.match(globalCss, /\.archeon-global-theme\.archeon-inline-theme\s*\{/);
// Every app and portfolio theme button uses the same icon semantics.
assert.match(header, /theme === "dark" \? <Sun/);
assert.match(invoice, /theme === "dark" \? <Sun/);
assert.match(read('src/app/app/tackboard/TackboardClient.tsx'), /theme === "dark" \? <Sun/);
assert.match(css, /--invoice-bg:#080d14/);
assert.match(css, /--invoice-panel:#0e1620/);
assert.match(css, /:root\[data-theme="light"\] \.invoice-app/);
console.log('PASS: Apps theme alignment, single header toggle, consistent icon semantics');
console.log('PASS: signed-in Invoice Studio has no sample action or top-right avatar');
console.log('PASS: midnight navy dark palette and independent light paper palette');
