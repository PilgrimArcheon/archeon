'use strict';
const { app, BrowserWindow, Tray, Menu, ipcMain, shell, screen, safeStorage, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { validateDoc } = require('./core.cjs');
const TOKEN = /^tb_[A-Za-z0-9_-]{40,100}$/;
const HOSTS = new Set(['https://archeon.vercel.app','http://localhost:3000']);
const DEFAULT_SETTINGS = { url:'https://archeon.vercel.app', theme:'dark', expanded:false, pinned:true, boardId:'' };
let win, tray, quitting=false, ephemeralToken='';
let local={ settings:{...DEFAULT_SETTINGS}, data:null, revision:0, pending:[] };
function dataFile(name) { return path.join(app.getPath('userData'),name); }
function writeJSON(file, value) {
  const temp = file+'.tmp';
  fs.writeFileSync(temp,JSON.stringify(value),{encoding:'utf8',mode:0o600});
  fs.renameSync(temp,file);
}
function loadState() {
  try {
    const raw=JSON.parse(fs.readFileSync(dataFile('workspace.json'),'utf8'));
    local={settings:{...DEFAULT_SETTINGS,...raw.settings},data:validateDoc(raw.data)?raw.data:null,revision:Number.isSafeInteger(raw.revision)?raw.revision:0,pending:Array.isArray(raw.pending)?raw.pending.slice(0,5000):[]};
    if (!HOSTS.has(local.settings.url)) local.settings.url=DEFAULT_SETTINGS.url;
  } catch { /* First run */ }
}
function tokenFromDisk() {
  if (ephemeralToken) return ephemeralToken;
  if (!safeStorage.isEncryptionAvailable() || (process.platform==='linux' && safeStorage.getSelectedStorageBackend?.()==='basic_text')) return '';
  try {
    const candidate = safeStorage.decryptString(fs.readFileSync(dataFile('pairing.bin')));
    return TOKEN.test(candidate) ? candidate : '';
  } catch { return ''; }
}
function saveToken(token) {
  ephemeralToken=token;
  if (safeStorage.isEncryptionAvailable() && !(process.platform==='linux' && safeStorage.getSelectedStorageBackend?.()==='basic_text')) {
    fs.writeFileSync(dataFile('pairing.bin'),safeStorage.encryptString(token),{mode:0o600});
  }
}
function clearToken() {
  ephemeralToken='';
  try { fs.unlinkSync(dataFile('pairing.bin')); } catch {}
}
function windowBounds(expanded) {
  const monitor=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const width=Math.min(monitor.width,expanded?900:390);
  const height=Math.min(monitor.height,expanded?700:620);
  return { width,height,x:monitor.x+monitor.width-width-20,y:monitor.y+24 };
}
function createWindow() {
  win=new BrowserWindow({ ...windowBounds(local.settings.expanded), minWidth:350,minHeight:440,backgroundColor:'#101112',show:false,frame:false,resizable:true,alwaysOnTop:!!local.settings.pinned,skipTaskbar:false,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true} });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.on('close',event=>{if (!quitting) {event.preventDefault();win.hide();}});
  win.once('ready-to-show',()=>win.show());
}
function restoreWindow() { if (!win || win.isDestroyed()) createWindow(); else {if(win.isMinimized())win.restore();win.show();win.focus();} }
async function requestCloud(method,payload) {
  const token=tokenFromDisk();
  if (!token) return {ok:false,status:401,error:'Connect from Settings first'};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try {
    const response=await fetch(local.settings.url+'/api/apps/tackboard/sync',{method,signal:controller.signal,headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});
    let json={};try{json=await response.json();}catch{}
    return {ok:response.ok,status:response.status,...json};
  } catch(error) {return {ok:false,status:0,error:error.name==='AbortError'?'Connection timed out':'Unable to reach TackBoard — changes stay on this device'};}
  finally{clearTimeout(timer);}
}
app.whenReady().then(()=>{
  loadState();
  const icon=nativeImage.createFromPath(path.join(__dirname,'../assets/icon.png'));
  tray=new Tray(icon);
  tray.setToolTip('TackBoard · Desktop notes');
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'Open TackBoard',click:restoreWindow},
    {label:'Quit TackBoard',click:()=>{quitting=true;app.quit();}},
  ]));
  tray.on('double-click',restoreWindow);
  createWindow();
  ipcMain.handle('tack:load',()=>({ ...local,paired:!!tokenFromDisk(), canRememberPairing:safeStorage.isEncryptionAvailable() }));
  ipcMain.handle('tack:persist',(_event,data)=>{
    if (!data || !validateDoc(data.data) || !Array.isArray(data.pending) || data.pending.length>5000 || !Number.isSafeInteger(data.revision)) throw new Error('Invalid workspace');
    const allowed={...DEFAULT_SETTINGS};for (const k of Object.keys(allowed)) if (Object.prototype.hasOwnProperty.call(data.settings||{},k)) allowed[k]=data.settings[k];
    if (!HOSTS.has(allowed.url)) throw new Error('Unsupported server');
    local={data:data.data,revision:data.revision,pending:data.pending,settings:allowed};
    writeJSON(dataFile('workspace.json'),local);
    return {ok:true};
  });
  ipcMain.handle('tack:connect',async(_event,{url,token})=>{
    if (!HOSTS.has(url) || !TOKEN.test(token))return {ok:false,error:'Use a valid Archeon address and pairing key.'};
    const previous=local.settings.url;local.settings.url=url;
    ephemeralToken=token;
    const result=await requestCloud('GET');
    if (!result.ok) {ephemeralToken='';local.settings.url=previous;return result;}
    saveToken(token);
    writeJSON(dataFile('workspace.json'),local);
    return {ok:true,data:result.data,revision:result.revision};
  });
  ipcMain.handle('tack:disconnect',()=>{clearToken();return {ok:true};});
  ipcMain.handle('tack:read',()=>requestCloud('GET'));
  ipcMain.handle('tack:write',(_event,{data,revision})=>{
    if (!validateDoc(data) || !Number.isSafeInteger(revision) || revision<0) return {ok:false,status:400,error:'Invalid note document or revision'};
    return requestCloud('PUT',{data,baseRevision:revision});
  });
  ipcMain.handle('tack:layout',(_event,expanded)=>{
    local.settings.expanded=expanded;
    const current=win.getBounds();const target=windowBounds(expanded);
    win.setMinimumSize(expanded?660:350,expanded?510:440);
    win.setBounds({...target,x:Math.min(current.x, target.x),y:current.y});
    writeJSON(dataFile('workspace.json'),local);
    return {expanded};
  });
  ipcMain.handle('tack:pin',(_event,pinned)=>{
    local.settings.pinned=pinned;win.setAlwaysOnTop(pinned);writeJSON(dataFile('workspace.json'),local);return {pinned};
  });
  ipcMain.handle('tack:hide',()=>{win.hide();return {ok:true};});
  ipcMain.handle('tack:open-web',()=>shell.openExternal(local.settings.url+'/app/tackboard'));
  ipcMain.handle('tack:version',()=>app.getVersion());
  app.on('activate',restoreWindow);
});
app.on('before-quit',()=>{quitting=true;});
app.on('window-all-closed',()=>{ /* stays available in tray until Quit */ });
