const { contextBridge, ipcRenderer } = require('electron');
// Strictly expose narrowly scoped actions. No renderer access to Node or arbitrary IPC.
contextBridge.exposeInMainWorld('tack', Object.freeze({
  load: () => ipcRenderer.invoke('tack:load'),
  persist: payload => ipcRenderer.invoke('tack:persist', payload),
  connect: params => ipcRenderer.invoke('tack:connect', params),
  disconnect: () => ipcRenderer.invoke('tack:disconnect'),
  read: () => ipcRenderer.invoke('tack:read'),
  write: (data, revision) => ipcRenderer.invoke('tack:write', { data, revision }),
  layout: expanded => ipcRenderer.invoke('tack:layout', !!expanded),
  pin: pinned => ipcRenderer.invoke('tack:pin', !!pinned),
  close: () => ipcRenderer.invoke('tack:hide'),
  openWeb: () => ipcRenderer.invoke('tack:open-web'),
  version: () => ipcRenderer.invoke('tack:version'),
}));
