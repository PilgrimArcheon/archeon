import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTackDocuments } from '../src/features/tackboard/merge.ts';
const make = () => ({version:1,activeBoardId:'a',boards:[{id:'a',name:'Planning',createdAt:1}],notes:[{id:'n',boardId:'a',title:'Today',body:'',color:'butter',status:'planned',tasks:[{id:'t',text:'Do task',done:false}],x:0,y:0,layer:1,archivedAt:null,createdAt:1,updatedAt:1}]});
test('web rename merges with desktop checklist change',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.boards[0].name='New planning';remote.notes[0].tasks[0].done=true;remote.notes[0].updatedAt=9;const merged=mergeTackDocuments(base,local,remote);assert.deepEqual(merged.conflicts,[]);assert.equal(merged.data.boards[0].name,'New planning');assert.equal(merged.data.notes[0].tasks[0].done,true);});
test('two distinct note fields merge',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.notes[0].title='Changed';local.notes[0].updatedAt=5;remote.notes[0].x=90;remote.notes[0].updatedAt=7;const merged=mergeTackDocuments(base,local,remote);assert.deepEqual(merged.conflicts,[]);assert.equal(merged.data.notes[0].title,'Changed');assert.equal(merged.data.notes[0].x,90);assert.equal(merged.data.notes[0].updatedAt,7);});
test('competing board names require review',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.boards[0].name='Local';remote.boards[0].name='Cloud';assert.deepEqual(mergeTackDocuments(base,local,remote).conflicts,['board:a.name']);});
test('remote deletion versus local edit requires review',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.notes[0].title='Important';remote.notes=[];assert.deepEqual(mergeTackDocuments(base,local,remote).conflicts,['note:n']);});
test('remote-only add is retained',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);remote.notes.push({...remote.notes[0],id:'n2'});assert.equal(mergeTackDocuments(base,local,remote).data.notes.length,2);});
test('local-only new board and its note are retained',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.boards.push({id:'b',name:'Work',createdAt:2});local.notes.push({...local.notes[0],id:'n2',boardId:'b'});const merged=mergeTackDocuments(base,local,remote);assert.deepEqual(merged.conflicts,[]);assert.equal(merged.data.boards.length,2);assert.equal(merged.data.notes.length,2);});
test('board selection difference does not conflict',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.activeBoardId='a';remote.activeBoardId='a';assert.deepEqual(mergeTackDocuments(base,local,remote).conflicts,[]);});

test('independent checkboxes merge without conflict',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);base.notes[0].tasks.push({id:'t2',text:'Second',done:false});local.notes[0].tasks=structuredClone(base.notes[0].tasks);remote.notes[0].tasks=structuredClone(base.notes[0].tasks);local.notes[0].tasks[0].done=true;remote.notes[0].tasks[1].done=true;const merged=mergeTackDocuments(base,local,remote);assert.deepEqual(merged.conflicts,[]);assert.equal(merged.data.notes[0].tasks[0].done,true);assert.equal(merged.data.notes[0].tasks[1].done,true);});
test('competing edits to the same task require review',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.notes[0].tasks[0].text='Task A';remote.notes[0].tasks[0].text='Task B';assert.deepEqual(mergeTackDocuments(base,local,remote).conflicts,['note:n.task:t.text']);});
test('never drops a new cloud note when local board was deleted',()=>{const base=make(),local=structuredClone(base),remote=structuredClone(base);local.boards=[{id:'other',name:'Other',createdAt:2}];local.notes=[];remote.notes.push({...remote.notes[0],id:'new'});assert.ok(mergeTackDocuments(base,local,remote).conflicts.includes('note-on-deleted-board'));});

test('choosing local board rename keeps independent remote checklist update',()=>{
 const base=make(),local=structuredClone(base),remote=structuredClone(base);
 local.boards[0].name='Planning Phase';remote.boards[0].name='Planning v2';remote.notes[0].tasks[0].done=true;
 const merged=mergeTackDocuments(base,local,remote,{preferLocalConflicts:true});
 assert.ok(merged.conflicts.includes('board:a.name'));
 assert.equal(merged.data.boards[0].name,'Planning Phase');
 assert.equal(merged.data.notes[0].tasks[0].done,true);
});
