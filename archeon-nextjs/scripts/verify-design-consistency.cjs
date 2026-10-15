const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const get = p => fs.readFileSync(path.join(base, p), 'utf8');

test('apps page has consistent branding and no public/private badge', () => {
  const apps = get('src/app/app/page.tsx');
  assert.match(apps, /archeon<span>\.<\/span>/);
  assert.doesNotMatch(apps, /app\.privacy|Back to Archeon/);
  assert.doesNotMatch(get('src/features/apps/registry.ts'), /privacy: "Private"/);
});
test('support preserves the origin, across apps and portfolio', () => {
  const source = get('src/app/app/support/page.tsx');
  for(const route of ['/app/tackboard','/app/invoice','/products/pocketline','/products/gatherly','/app']) assert(source.includes(route));
  assert.match(source, /destination\.href/);
  assert.match(get('src/app/app/page.tsx'), /support\?source=apps/);
});
test('TackBoard uses only theme and date in the header, and support is in sidebar', () => {
 const code = get('src/app/app/tackboard/TackboardClient.tsx');
 const header = code.slice(code.indexOf('<header className={styles.topbar}>'),code.indexOf('</header>',code.indexOf('<header className={styles.topbar}>')));
 assert(header.includes('headerDate') && header.includes('themeSwitch'));
 assert(!header.includes('topBack') && !header.includes('privateLabel') && !header.includes('topHelp'));
 assert.match(code, /className=\{styles\.supportLink\}/);
});
test('Invoice Studio uses paper-and-navy palette with borderless icon', () => {
 const css=get('src/app/app/invoice/invoice.css');
 const last=css.slice(css.indexOf('/* Archeon app design template'));
 assert(last.includes('#101e2d')&&last.includes('--page:#0f1722'));
 assert(last.includes('.brand-mark')&&last.includes('border:0!important'));
 assert(!get('public/images/invoice-studio-icon.svg').includes('stroke="#5b665c"'));
});
test('Admin provides real database-backed charts without fake Neon usage', () => {
 const page=get('src/app/app/admin/page.tsx');
 assert(page.includes('generate_series')&&page.includes('AdminCharts')&&page.includes('FeedbackInbox'));
 assert(page.includes('adminAccount()')&&page.includes('allowedAdmin(account)'));
 assert(page.includes('Neon compute') && page.includes('analytics provider'));
 assert(get('src/app/app/admin/AdminCharts.tsx').includes('downloadCsv'));
});
test('all public assets needed for app icons exist',()=>{
 assert(fs.existsSync(path.join(base,'public/images/tackboard-icon.png')));
 assert(fs.existsSync(path.join(base,'public/images/invoice-studio-icon.svg')));
});
