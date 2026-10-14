'use strict';
// Deterministic hook integration test with a fake Neon compare-and-swap endpoint.
// Run with: node scripts/verify-tackboard-sync-harness.cjs
const assert = require('node:assert/strict');
const fs=require('fs'),path=require('path'),vm=require('vm');
const ts=require('typescript');
const basedir=path.resolve(__dirname,'../src/features/tackboard');
const moduleCache=new Map();
function transpileFile(file,ctx){
 const resolved=path.resolve(file);
 if(moduleCache.has(resolved))return moduleCache.get(resolved);
 const code=ts.transpileModule(fs.readFileSync(resolved,'utf8'),{fileName:resolved,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};moduleCache.set(resolved,exports);
 const script=new vm.Script(`(function(require,module,exports){${code}\n})`,{filename:resolved});
 script.runInNewContext(ctx)((key)=>{
  if(key==='react')return ctx.react;
  if(key.startsWith('.'))return transpileFile(path.resolve(path.dirname(resolved),key+'.ts'),ctx);
  throw new Error('Unexpected import '+key);
 },{exports},exports);
 return exports;
}
function fakeStorage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),_map:map};}
const base=()=>({version:1,boards:[{id:'board-1',name:'My first board',createdAt:1}],activeBoardId:'board-1',notes:[]});
const server={revision:1,data:base(),puts:0,gets:0,failNextPUT:false};
async function send(url,opts={}){
 if(url==='/api/auth/session')return {ok:true,status:200,json:async()=>({signedIn:true,userId:'user-1',email:'demo@example.com'})};
 if(url!=='/api/apps/tackboard/sync')throw Error('Unexpected path '+url);
 if(opts.method!=='PUT'){server.gets++;return {ok:true,status:200,json:async()=>({data:structuredClone(server.data),revision:server.revision,accountId:'user-1'})};}
 server.puts++;if(server.failNextPUT){server.failNextPUT=false;return {ok:false,status:503,json:async()=>({error:'Neon unavailable'})};}const body=JSON.parse(opts.body);
 if(body.baseRevision!==server.revision)return {ok:false,status:409,json:async()=>({data:structuredClone(server.data),revision:server.revision,error:'Conflict'})};
 server.data=structuredClone(body.data);server.revision++;
 return {ok:true,status:200,json:async()=>({saved:true,revision:server.revision})};
}
function client(){
 const localStorage=fakeStorage(),states=[],handlers={},timerIds=new Set();
 const react={useState:init=>{let value=init;return [value,next=>{value=typeof next==='function'?next(value):next;states.push(value);}];},useRef:init=>({current:init}),useCallback:fn=>fn,useEffect:fn=>{const cleanup=fn();handlers.cleanup=cleanup;}};
 const fakeWindow={addEventListener:()=>{},removeEventListener:()=>{}};
 const ctx={react,window:fakeWindow,document:{documentElement:{dataset:{}},visibilityState:'visible'},localStorage,
  navigator:{onLine:true},fetch:send,crypto:require('crypto').webcrypto,
  setTimeout,clearTimeout,setInterval:()=>0,clearInterval:()=>{},AbortController,console,Date,JSON,Map,Set,Number,String,Object,Math,Error};
 moduleCache.clear();
 const {useTackCloud}=transpileFile(path.join(basedir,'useTackCloud.ts'),ctx);
 const hook=useTackCloud();return {hook,localStorage,states};
}
(async()=>{
 const a=client();await new Promise(r=>setTimeout(r,50));
 const before=server.revision;
 a.hook.edit(old=>({...old,boards:old.boards.map(b=>({...b,name:'Planning Phase'}))}));
 assert.equal(await a.hook.saveNow(),true,'manual Save must await acknowledgment');
 assert.ok(server.revision>before);assert.equal(server.data.boards[0].name,'Planning Phase');
 assert.equal(a.localStorage.getItem('archeon:tackboard:pending:user-1'),null,'pending marker removed after server ack');
 const b=client();await new Promise(r=>setTimeout(r,50));
 b.hook.edit(old=>({...old,boards:[...old.boards,{id:'board-2',name:'Design',createdAt:2}]}));
 assert.equal(await b.hook.syncNow(),true,'Sync now uploads and verifies from server');
 assert.equal(server.data.boards.length,2);
 // Old client still at rev2, write an unrelated note. CAS conflict must merge
 // remote board instead of overwriting it.
 a.hook.edit(old=>({...old,notes:[...old.notes,{id:'note-1',boardId:'board-1',title:'A note',body:'',color:'butter',status:'planned',tasks:[],x:0,y:0,layer:1,archivedAt:null,createdAt:3,updatedAt:3}]}));
 assert.equal(await a.hook.syncNow(),true,'independent remote board and local note merged');
 assert.equal(server.data.boards.length,2);assert.equal(server.data.notes.length,1);
 assert.equal(a.localStorage.getItem('archeon:tackboard:pending:user-1'),null);
 const c=client();await new Promise(r=>setTimeout(r,50));
 assert.equal(c.localStorage.getItem('archeon:tackboard:account:user-1').includes('Design'),true,'new device downloads current cloud boards');
 // Failed uploads must not clear the pending marker or lose the board rename.
 const d=client();await new Promise(r=>setTimeout(r,50));
 d.hook.edit(old=>({...old,boards:old.boards.map(b=>b.id==='board-1'?{...b,name:'Resilient'}:b)}));
 server.failNextPUT=true;
 assert.equal(await d.hook.saveNow(),false,'server rejection must be surfaced');
 assert.equal(d.localStorage.getItem('archeon:tackboard:pending:user-1'),'1');
 assert.equal(await d.hook.saveNow(),true,'later retry must acknowledge the original edit');
 assert.equal(server.data.boards[0].name,'Resilient');
 assert.equal(d.localStorage.getItem('archeon:tackboard:pending:user-1'),null);
 console.log('PASS: acknowledged Save, server revisions, Sync now, concurrent merge, reload, offline-preserved edits and retry.');
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
