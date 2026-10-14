const fs=require('node:fs');const path=require('node:path');
const base=path.join(__dirname,'..','src');
const source=fs.readFileSync(path.join(base,'core.cjs'),'utf8');
const marker='module.exports = { COLORS, STATUSES, blankBoard, validateDoc, applyOperation, replay };';
if(!source.includes(marker))throw Error('Update browser core generation for new module exports');
fs.writeFileSync(path.join(base,'core-browser.js'),source.replace(marker,'globalThis.TackCore = { COLORS, STATUSES, blankBoard, validateDoc, applyOperation, replay };'));
