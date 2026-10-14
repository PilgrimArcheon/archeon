import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const required=['package.json','next.config.ts','postcss.config.mjs','tsconfig.json','src/app/page.tsx','src/app/layout.tsx','src/app/app/tackboard/page.tsx','src/app/app/invoice/page.tsx','public/images/favicon.png','scripts/public-apps-schema.sql','scripts/tackboard-cloud-sync.sql'];
const missing=required.filter(f=>!existsSync(join(root,f)));
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const problems=[];
if(missing.length) problems.push('Missing files: '+missing.join(', '));
if(!pkg.dependencies?.next||!pkg.dependencies?.react||!pkg.devDependencies?.['@tailwindcss/postcss']) problems.push('Missing Next.js/React/Tailwind dependencies');
if(existsSync(join(root,'.env.local'))) console.log('Local .env.local exists (make sure it is NOT committed).');
if(problems.length){console.error('Deployment preflight failed:\n'+problems.join('\n')); process.exit(1);}
console.log(`Deployment files are present (${required.length} required paths checked).`);
console.log('NOTE: preflight does not test npm dependency installation, Neon connectivity, or production build.');
