const { contextBridge, ipcRenderer } = require('electron');

// Expose the IPC communication functions to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
