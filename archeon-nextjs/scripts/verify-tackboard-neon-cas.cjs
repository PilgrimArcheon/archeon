'use strict';
// Regression for the actual Next.js route handler, with a small mock SQL adapter.
// Run: node scripts/verify-tackboard-neon-cas.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(__dirname, '../src/app/api/apps/tackboard/sync/route.ts');
const js = ts.transpileModule(fs.readFileSync(file,'utf8'), {
  fileName:file,
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  reportDiagnostics:true,
});
assert.equal(js.diagnostics?.length ?? 0,0,'TypeScript transpile diagnostics');
const docs = new Map();
let inserts=0, updates=0, reads=0;
const sql = async (parts,...args) => {
  const statement = parts.join(' ? ').replace(/\s+/g,' ').trim().toUpperCase();
  if (statement.startsWith('INSERT INTO TACK_SYNC_DOCUMENTS')) {
    inserts++;
    const [accountId, encoded] = args;
    if (docs.has(accountId)) return [];
    docs.set(accountId,{content:JSON.parse(encoded),revision:1});
    return [{revision:1}];
  }
  if (statement.startsWith('UPDATE TACK_SYNC_DOCUMENTS')) {
    updates++;
    const [encoded,accountId,baseRevision] = args;
    const found = docs.get(accountId);
    if (!found || found.revision !== baseRevision) return [];
    found.content = JSON.parse(encoded);
    found.revision += 1;
    return [{revision:found.revision}];
  }
  if (statement.startsWith('SELECT REVISION,CONTENT FROM')) {
    reads++;
    const document = docs.get(args[0]);
    return document ? [{revision:document.revision,content:document.content}]:[];
  }
  if (statement.startsWith('SELECT CONTENT, REVISION FROM')) {
    reads++;
    const document = docs.get(args[0]);
    return document ? [{revision:document.revision,content:document.content}]:[];
  }
  throw new Error('Unexpected SQL: '+statement);
};
const json = (data, status=200) => ({status, async json(){return data;}});
const fakeAuth = {
  database:()=>sql,
  json,
  validOrigin:()=>true,
  authProblem: error=>json({error:String(error)},500),
};
const modelParse = (input)=>{
  if (!input || input.version !== 1 || !Array.isArray(input.boards) || !input.boards.length || !Array.isArray(input.notes)) return null;
  return structuredClone(input);
};
const fakeSync = {parseTackDocument:modelParse,tackIdentity:async req=>req.accountId?{userId:req.accountId,companion:false}:null};
const routeExports={};
vm.runInNewContext(`(function(require,module,exports){${js.outputText}\n})`, {console})((id)=>{
  if (id==='next/server') return {};
  if (id==='@/features/auth/server') return fakeAuth;
  if (id==='@/features/tackboard/server/sync') return fakeSync;
  throw new Error('Unexpected import: '+id);
},{exports:routeExports},routeExports);
const {GET,PUT} = routeExports;
const board = name => ({version:1,boards:[{id:'board-1',name,createdAt:10}],notes:[],activeBoardId:'board-1'});
const request = (accountId, baseRevision, data)=>({accountId,headers:{get:()=>null},text:async()=>JSON.stringify({baseRevision,data})});
const response = async result => ({status:result.status,...await result.json()});
(async()=>{
  // First upload creates revision 1.
  let r = await response(await PUT(request('account-a',0,board('My first board'))));
  assert.deepEqual({status:r.status,revision:r.revision,saved:r.saved},{status:200,revision:1,saved:true});
  assert.equal(inserts,1);assert.equal(updates,0);
  // THIS previously always returned a 409 due to an INSERT...SELECT WHERE 0 bug.
  r = await response(await PUT(request('account-a',1,board('Planning Phase'))));
  assert.equal(r.status,200,'second save must succeed');
  assert.equal(r.revision,2);
  assert.equal(updates,1);
  // Subsequent update and GET must reflect server state.
  r = await response(await PUT(request('account-a',2,board('Published Plan'))));
  assert.equal(r.status,200);assert.equal(r.revision,3);
  r = await response(await GET({accountId:'account-a'}));
  assert.equal(r.revision,3);assert.equal(r.data.boards[0].name,'Published Plan');
  // Outdated tab must receive a real conflict and CURRENT data, not overwrite it.
  r = await response(await PUT(request('account-a',1,board('Stale overwrite'))));
  assert.equal(r.status,409);assert.equal(r.revision,3);
  assert.equal(r.data.boards[0].name,'Published Plan');
  // Repeated first create must not rewrite an established account.
  r = await response(await PUT(request('account-a',0,board('Initial again'))));
  assert.equal(r.status,409);assert.equal(r.revision,3);
  // Different account's new doc cannot modify account-a.
  r = await response(await PUT(request('account-b',0,board('Separate account'))));
  assert.equal(r.status,200);assert.equal(r.revision,1);
  r = await response(await GET({accountId:'account-a'}));
  assert.equal(r.data.boards[0].name,'Published Plan');
  // Unauthorized access is rejected.
  r = await response(await PUT(request(null,0,board('Invalid user'))));
  assert.equal(r.status,401);
  assert.equal(inserts,3);assert.equal(updates,3);
  assert.ok(reads>=3);
  console.log('PASS: create rev1, update rev2/rev3, GET, stale conflict, duplicate creation, account isolation, unauthorized access');
  console.log('SQL branches exercised: inserts='+inserts+', updates='+updates+', reads='+reads);
})().catch(error=>{console.error(error);process.exitCode=1;});
