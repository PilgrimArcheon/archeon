import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd(), errors=[]; let total=0;
function allFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?allFiles(path.join(dir,x.name)):[path.join(dir,x.name)]);}
for(const file of allFiles('src').filter(f=>/\.(ts|tsx)$/.test(f))){
 total++;
 const source=fs.readFileSync(file,'utf8');
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 for(const d of sf.parseDiagnostics)errors.push(`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);
 for(const statement of sf.statements){
  if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
  const imp=statement.moduleSpecifier.text;
  if(!imp.startsWith('@/')&&!imp.startsWith('.'))continue;
  const base=imp.startsWith('@/')?path.join(root,'src',imp.slice(2)):path.resolve(path.dirname(file),imp);
  if(!['','.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].some(ext=>fs.existsSync(base+ext)))errors.push(`${file}: missing import ${imp}`);
 }
}
const pdf=fs.readFileSync('src/features/invoice/pdf.ts','utf8');
if(pdf.includes('"DRAFT"')||pdf.includes('draw(status')) errors.push('client PDF still shows draft/status badge');
const models=fs.readFileSync('src/features/invoice/models.ts','utf8');
if(!models.includes('invoiceReference')||!models.includes('depositPercent: 0'))errors.push('missing guest reference/default deposit');
const auth=fs.readFileSync('src/features/auth/server.ts','utf8');
for (const x of ['hashPassword(password)', 'verifyPassword(password', 'httpOnly: true', 'AUTH_DATABASE_SCHEMA_MISSING', 'archeon_password_credentials']) if(!auth.includes(x))errors.push(`Auth invariant missing: ${x}`);
for(const p of ['src/app/api/auth/register/route.ts','src/app/api/auth/login/route.ts']) if(!fs.existsSync(p))errors.push(`Missing account API: ${p}`);
if(fs.existsSync('src/app/api/auth/request/route.ts') || fs.existsSync('src/app/api/auth/verify/route.ts')) errors.push('Old magic-link API routes still present');
const invoiceServer=fs.readFileSync('src/features/invoice/server.ts','utf8');
for(const x of ['AND workspace_id=${workspaceId}','WHERE workspace_id=${workspaceId}'])if(!invoiceServer.includes(x))errors.push(`Invoice ownership missing: ${x}`);
console.log(`Checked ${total} TS/TSX files, local imports, account guards, PDF status and auth configuration.`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);} else console.log('PASS (source checks only; not a full build or live service test)');
