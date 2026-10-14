// TackBoard web-brand migration. Edits only targeted spans in your CURRENT source;
// does not replace newer mobile dragging, cloud sync or auth implementations.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(process.cwd());
const changes = [];
function update(relative, replacer, {optional=false}={}) {
 const f=resolve(root,relative);
 if (!existsSync(f)) {if(optional) {console.log('SKIP missing',relative);return;} throw Error('Missing '+relative);}
 const before=readFileSync(f,'utf8');
 const next=replacer(before);
 if(next===before){console.log('UNCHANGED',relative);return;}
 writeFileSync(f,next);changes.push(relative);console.log('UPDATED',relative);
}
// Preflight before mutating any project files.
const source=resolve(root,'src/app/app/tackboard/TackboardClient.tsx');
const base=readFileSync(source,'utf8');
if(!base.includes('/images/tackboard-icon.png')&&!base.includes('<Layers3 size={21}/>')) {
 throw Error('TackBoard header differs from expected source; stop rather than overwrite it.');
}
update('src/app/app/tackboard/TackboardClient.tsx',s=>{
 if(s.includes('/images/tackboard-icon.png'))return s;
 if(!s.includes('import Image from "next/image";'))s=s.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from "next/image";');
 s=s.replace('<Layers3 size={21}/>', '<Image src="/images/tackboard-icon.png" width={36} height={36} alt="TackBoard" priority />');
 if(!s.includes('<Layers3'))s=s.replace('Grip, Layers3, Menu,', 'Grip, Menu,');
 return s;
});
update('src/app/app/tackboard/tackboard.module.css',s=>{
 const extra='\n/* Transparent TackBoard brand mark (no dark background tile). */\n.brandMark{background:transparent!important;color:inherit!important;flex:none}.brandMark img{display:block;width:36px;height:36px;object-fit:contain}\n';
 return s.includes('Transparent TackBoard brand mark')?s:s+extra;
});
update('src/app/app/tackboard/desktop/page.tsx',s=>{
 if(s.includes('tackboard-icon.png'))return s;
 if(!s.includes('import Image from "next/image";'))s=s.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from "next/image";');
 return s.replace('<p className={styles.kicker}>TACKBOARD DESKTOP · WINDOWS + MAC</p>', '<div className={styles.heroBrand}><Image src="/images/tackboard-icon.png" width={56} height={56} alt="TackBoard logo" priority /><p className={styles.kicker}>TACKBOARD DESKTOP · WINDOWS + MAC</p></div>');
},{optional:true});
update('src/app/app/tackboard/desktop/desktop.module.css',s=>{
 const extra='\n/* The same transparent TackBoard logo used on desktop and in the web app. */\n.heroBrand{display:flex;align-items:center;gap:16px}.heroBrand img{object-fit:contain;flex:none}.heroBrand .kicker{margin:0}\n';
 return s.includes('The same transparent TackBoard logo')?s:s+extra;
},{optional:true});
update('.gitignore',s=>{
 const needed=['desktop/','_legacy-auth-backup/','*.bak','APPLY-FIX.ps1','FIXED-FILES.json'];
 const lines=s.split(/\r?\n/).map(x=>x.trim());
 const missing=needed.filter(x=>!lines.includes(x));
 return missing.length?s+'\n# Standalone desktop repo and obsolete local scratch files\n'+missing.join('\n')+'\n':s;
},{optional:true});
console.log(`Completed: ${changes.length} modified file(s). Review git diff, then npm run typecheck && npm run build.`);
