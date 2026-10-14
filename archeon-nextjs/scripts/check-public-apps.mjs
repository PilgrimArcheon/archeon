import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = process.cwd();
const original = process.env.ARCHEON_ORIGINAL_SOURCE || '';
const errors=[];
function traverse(folder) {
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry => entry.isDirectory()?traverse(path.join(folder,entry.name)):[path.join(folder,entry.name)]);
}
const tsFiles=traverse(path.join(root,'src')).filter(x=>/\.(tsx?|jsx?)$/.test(x));
for (const file of tsFiles) {
  const source=fs.readFileSync(file,'utf8');
  const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  for (const d of result.diagnostics||[]) if(d.category===ts.DiagnosticCategory.Error) errors.push(`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);
  const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  for(const statement of sf.statements) if(ts.isImportDeclaration(statement)&&ts.isStringLiteral(statement.moduleSpecifier)) {
    const imp=statement.moduleSpecifier.text;
    if(imp.startsWith('@/')||imp.startsWith('.')) {
      const base=imp.startsWith('@/')?path.join(root,'src',imp.slice(2)):path.resolve(path.dirname(file),imp);
      if(!['','.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].some(ext=>fs.existsSync(base+ext)&&fs.statSync(base+ext).isFile())) errors.push(`${file}: missing import ${imp}`);
    }
  }
}
if (original && fs.existsSync(original)) for(const f of ['src/app/page.tsx','src/app/globals.css','src/app/classic.css']){
 const originalFile=path.join(original,f),newFile=path.join(root,f);
 if(fs.existsSync(originalFile)&&!fs.readFileSync(originalFile).equals(fs.readFileSync(newFile))) errors.push(`${f}: original portfolio file changed`);
}
const server=fs.readFileSync('src/features/invoice/server.ts','utf8');
for(const table of ['invoice_workspace_records','invoice_workspace_clients','invoice_workspace_settings']) {
 const matches=server.match(new RegExp('(?:FROM|UPDATE|INSERT INTO) '+table,'g'))||[];
 if(!matches.length) errors.push(`server does not reference ${table}`);
}
// Guard against an accidental future removal of tenant filters.
const scopeChecks = [
  ['src/features/invoice/server.ts', 'WHERE id=${id} AND workspace_id=${workspaceId}'],
  ['src/features/invoice/server.ts', 'AND workspace_id=${workspaceId}'],
  ['src/app/api/apps/invoice/clients/[id]/route.ts', 'AND workspace_id=${account.workspaceId}'],
  ['src/app/api/apps/invoice/invoices/[id]/route.ts', 'AND workspace_id=${account.workspaceId}'],
  ['src/app/api/apps/invoice/invoices/[id]/send/route.ts', 'currentAccount()'],
  ['src/app/api/apps/invoice/invoices/[id]/pdf/route.ts', 'loadInvoice(id, account.workspaceId)'],
];
for (const [file,fragment] of scopeChecks) if(!fs.readFileSync(file,'utf8').includes(fragment)) errors.push(`tenant guard missing: ${file}`);
const authSource = fs.readFileSync('src/features/auth/server.ts','utf8');
for(const fragment of ['s.expires_at>NOW()', 'httpOnly: true', 'currentAccount()', 'archeon_password_credentials', 'hashPassword(password)', 'verifyPassword(password']) if(!authSource.includes(fragment)) errors.push(`Auth invariant missing: ${fragment}`);
const schema=fs.readFileSync('scripts/public-apps-schema.sql','utf8');
for (const fragment of ['UNIQUE(workspace_id,invoice_no)', 'ON DELETE SET NULL', 'archeon_password_credentials', 'archeon_workspace_members', 'invoice_workspace_counters', 'invoice_workspace_email_quota']) if(!schema.includes(fragment)) errors.push(`Schema invariant missing: ${fragment}`);
const allAPIs=traverse('src/app/api/apps/invoice').filter(x=>x.endsWith('route.ts')&&!x.endsWith('session/route.ts')&&!x.includes('/guest/pdf/'));
for(const file of allAPIs){const content=fs.readFileSync(file,'utf8');if(!content.includes('currentAccount()'))errors.push(`${file}: missing account check`);}
console.log(`Checked ${tsFiles.length} JS/TS/TSX files and ${allAPIs.length} workspace-scoped invoice endpoints.`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Syntax, local imports, original portfolio preservation, account guard checks: PASS');
