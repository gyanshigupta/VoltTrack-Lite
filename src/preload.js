const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('voltTrack', {
  analyze: (readings) => ipcRenderer.invoke('meter:analyze', readings),
  exportReport: (report) => ipcRenderer.invoke('report:export', report),
  notifyHighRisk: (meterId) => ipcRenderer.invoke('notification:high-risk', meterId)
});
