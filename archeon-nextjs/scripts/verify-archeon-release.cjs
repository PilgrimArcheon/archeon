'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');const {test}=require('node:test');
const root=path.join(__dirname,'..');const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('shared accounts, support inbox and private admin routes are present',()=>{
 for(const f of ['src/app/app/auth/sign-in/page.tsx','src/app/app/support/page.tsx','src/app/app/admin/page.tsx','src/app/api/feedback/route.ts','src/app/api/admin/unlock/route.ts','scripts/archeon-feedback-admin.sql'])assert(exists(f),f);
 assert.match(read('src/features/admin/access.ts'),/ARCHEON_ADMIN_USER_IDS/);
 assert.match(read('src/features/admin/access.ts'),/jwtVerify/);
 assert.match(read('src/app/api/admin/unlock/route.ts'),/verifyPassword/);
 assert.match(read('src/app/api/feedback/route.ts'),/validOrigin/);
 assert.match(read('src/app/api/feedback/route.ts'),/ARCHEON_AUTH_RATE_SECRET/);
});
test('single shared account page is linked from Invoice Studio',()=>{
 const src=read('src/app/app/invoice/InvoiceClient.tsx');
 assert.match(src,/\/app\/auth\/sign-in\?mode=login&next=%2Fapp%2Finvoice/);
 assert.doesNotMatch(src,/function submitAccount\(/);
 assert.match(src,/invoice-studio-icon\.svg/);
});
test('new app-request modal and stable public design assets',()=>{
 assert.match(read('src/app/app/page.tsx'),/RequestAppButton/);
 assert(exists('public/images/tackboard-icon.png'));
 assert(exists('public/images/invoice-studio-icon.svg'));
 assert.match(read('src/app/app/tackboard/page.tsx'),/title: "TackBoard"/);
});
test('distribution excludes unsafe build output and secrets',()=>{
 assert(!exists('.env.local'),'do not include .env.local');
 assert(!exists('desktop'),'Electron belongs in the separate project');
 assert(!exists('tsconfig.tsbuildinfo'));
 assert(!exists('node_modules'));
 assert(!exists('.next'));
});
