/** Source-level sanity checks; integration with live Neon still requires manual QA. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const source = fs.readFileSync(path.join(root,"src/features/tackboard/model.ts"),"utf8");
const transpiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports = {};
vm.runInNewContext(transpiled,{exports,crypto:globalThis.crypto,Date,JSON,Set,Number,String,Array}, {filename:"model.cjs"});
const sample = exports.initialData();
assert.equal(sample.version,1);
assert.ok(sample.boards.length > 0 && sample.notes.length > 0);
const roundtrip = exports.readStore(JSON.stringify(sample));
assert.equal(roundtrip?.notes.length,sample.notes.length);
const next = exports.makeNote(sample.boards[0].id);
next.tasks=[{id:exports.freshId(),text:"Finish design",done:true}];
assert.equal(exports.allTasksComplete(next),true);
assert.equal(exports.readStore('{invalid'),null);

const required = [
  "src/app/api/apps/tackboard/sync/route.ts",
  "src/app/api/apps/tackboard/extension/route.ts",
  "src/features/tackboard/useTackCloud.ts",
  "src/styles/archeon-app-tokens.css",
  "scripts/tackboard-cloud-sync.sql",
];
for(const file of required) assert.ok(fs.existsSync(path.join(root,file)),`Missing ${file}`);
for (const browser of ["chrome","firefox"]) {
  const dir = path.join(root,"browser-extension",browser);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
  assert.equal(manifest.manifest_version,3);
  for (const name of ["background.js","content.js","options.html","options.js"]) assert.ok(fs.existsSync(path.join(dir,name)),`${browser}/${name}`);
}
const syncRoute = fs.readFileSync(path.join(root,required[0]),"utf8");
assert.ok(syncRoute.includes('response.status === 409') === false); // route uses 409 response, not a client check
assert.ok(syncRoute.includes('WHERE tack_sync_documents.revision='));
assert.ok(syncRoute.includes('validOrigin(req)'));
console.log("TackBoard source checks passed (model roundtrip, CAS guard, auth origin guard, both extension manifests).");
