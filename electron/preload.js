const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,

  // Window Controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (cb) => {
      const handler = (_, val) => cb(val);
      ipcRenderer.on('window:maximizeChange', handler);
      return () => ipcRenderer.removeListener('window:maximizeChange', handler);
    }
  },

  // Native Dialogs
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    openFiles: (filters) => ipcRenderer.invoke('dialog:openFiles', filters),
    saveFile: (defaultPath, filters) => ipcRenderer.invoke('dialog:saveFile', defaultPath, filters)
  },

  // File System & Persistence
  fs: {
    getDefaultProjectsDir: () => ipcRenderer.invoke('fs:getDefaultProjectsDir'),
    saveProjectToDisk: (project) => ipcRenderer.invoke('fs:saveProjectToDisk', project),
    loadProjectFromDisk: (folderPath) => ipcRenderer.invoke('fs:loadProjectFromDisk', folderPath),
    listDiskProjects: () => ipcRenderer.invoke('fs:listDiskProjects'),
    openInExplorer: (targetPath) => ipcRenderer.invoke('fs:openInExplorer', targetPath)
  },

  // External Game Engines (Godot, etc.)
  engine: {
    detectGodot: () => ipcRenderer.invoke('engine:detectGodot'),
    setGodotPath: (path) => ipcRenderer.invoke('engine:setGodotPath', path),
    runGodot: (projectId, project) => ipcRenderer.invoke('engine:runGodot', projectId, project),
    stopGodot: () => ipcRenderer.invoke('engine:stopGodot'),
    onEngineLog: (cb) => {
      const handler = (_, data) => cb(data);
      ipcRenderer.on('engine:log', handler);
      return () => ipcRenderer.removeListener('engine:log', handler);
    }
  },

  // System & Environment Info
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url)
  },

  // Coffre-fort des clés API (chiffrement au repos via le coffre-fort de l'OS)
  secure: {
    backend: () => ipcRenderer.invoke('secure:backend'),
    encrypt: (value) => ipcRenderer.invoke('secure:encrypt', value),
    decrypt: (stored) => ipcRenderer.invoke('secure:decrypt', stored)
  }
});
