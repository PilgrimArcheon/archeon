/** Regression checks for the draggable, scrollable board. Run: node scripts/verify-tackboard-workspace.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const geometry = fs.readFileSync(path.join(root, 'src/features/tackboard/workspaceGeometry.ts'), 'utf8');
const compiled = ts.transpileModule(geometry, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleObj={exports:{}};
vm.runInNewContext(compiled,{module:moduleObj,exports:moduleObj.exports}, {filename:'workspaceGeometry.js'});
const {workspaceDimensions,edgeScrollVelocity,draggedNotePosition}=moduleObj.exports;

assert.equal(workspaceDimensions([]).width,1500);
assert.equal(workspaceDimensions([]).height,1050);
assert.equal(workspaceDimensions([{x:1650,y:1300}]).width,2000);
assert.equal(workspaceDimensions([{x:1650,y:1300}]).height,1680);
const rect={left:100,right:700,top:200,bottom:800};
assert.deepEqual(JSON.parse(JSON.stringify(edgeScrollVelocity(120,780,rect))),{x:-13,y:13});
assert.deepEqual(JSON.parse(JSON.stringify(edgeScrollVelocity(400,500,rect))),{x:0,y:0});
const base={origin:{x:100,y:100},pointerStart:{x:200,y:200},pointerCurrent:{x:300,y:260},scrollStart:{x:0,y:0},scrollCurrent:{x:150,y:75},canvas:{width:1500,height:1050},note:{width:247,height:260}};
assert.deepEqual(JSON.parse(JSON.stringify(draggedNotePosition(base))),{x:350,y:235});
assert.deepEqual(JSON.parse(JSON.stringify(draggedNotePosition({...base,pointerCurrent:{x:-10000,y:-10000}}))),{x:18,y:18});
assert.deepEqual(JSON.parse(JSON.stringify(draggedNotePosition({...base,pointerCurrent:{x:99999,y:99999}}))),{x:1235,y:772});

const client=fs.readFileSync(path.join(root,'src/app/app/tackboard/TackboardClient.tsx'),'utf8');
const styles=fs.readFileSync(path.join(root,'src/app/app/tackboard/tackboard.module.css'),'utf8');
assert.match(client,/onPointerDown=\{e => dragStart\(e,note\)\}/);
assert.match(client,/onPointerDownCapture=\{\(\) => setFrontNoteId\(note.id\)\}/);
assert.match(client,/data-note-action="true"/);
assert.match(client,/onClick=\{toggleBoardFocus\}/);
assert.match(client,/archeon:tackboard:expanded-board/);
assert.match(client,/role="region" aria-label="Scrollable pinboard/);
assert.match(styles,/\.boardViewport\s*\{[^}]*overflow:auto/s);
assert.match(styles,/\.boardFocused \.sidebar\s*\{display:none\}/);
assert.match(styles,/\.noteTop\s*\{[^}]*touch-action:none/s);
console.log('PASS: workspace canvas dimensions, two-axis scrolling, pointer geometry, edge scrolling, layer focus, drag handles, and expand/minimize controls');
