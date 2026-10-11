const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const {
  safeDirName,
  safeRelPath,
  isInside,
  readDirRecursive,
  detectProjectType
} = require('./lib/project-utils');

let mainWindow = null;
let activeEngineProcess = null;
let customGodotPath = null;

// Identité stable de l'application sous Windows (icône + regroupement barre des tâches).
if (process.platform === 'win32') {
  app.setAppUserModelId('com.gamecraft.studio');
}

// ---- Instance unique : un seul exemplaire du logiciel ----
// Si une instance tourne déjà, on la ferme et on ramène l'existante au premier plan
// (comportement attendu d'un logiciel de bureau, cf. VS Code / Discord).
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ---- Persistance de la géométrie de fenêtre (taille, position, maximisé) ----
const windowStatePath = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const s = JSON.parse(fs.readFileSync(windowStatePath(), 'utf8'));
    return (s && typeof s === 'object') ? s : {};
  } catch {
    return {};
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    // getNormalBounds() donne la taille « restaurée » même quand la fenêtre est
    // maximisée, pour que « Restaurer » retrouve une taille normale correcte.
    const b = (typeof mainWindow.getNormalBounds === 'function')
      ? mainWindow.getNormalBounds()
      : mainWindow.getBounds();
    fs.writeFileSync(windowStatePath(), JSON.stringify({
      width: b.width, height: b.height, x: b.x, y: b.y,
      maximized: mainWindow.isMaximized()
    }, null, 2), 'utf8');
  } catch { /* la géométrie n'est pas critique : on ignore l'échec */ }
}

// Évite d'écrire sur le disque à chaque pixel de déplacement.
let _geoDebounceTimer = null;
function debounceSave() {
  clearTimeout(_geoDebounceTimer);
  _geoDebounceTimer = setTimeout(saveWindowState, 400);
}

// Vérifie que la fenêtre restaurée reste au moins partiellement visible à l'écran.
function isVisibleOnScreen(state) {
  if (typeof state.x !== 'number' || typeof state.y !== 'number') return false;
  return screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return state.x < a.x + a.width - 60 && state.x + 60 > a.x &&
           state.y < a.y + a.height - 40 && state.y + 40 > a.y;
  });
}

const defaultProjectsDir = path.join(app.getPath('documents'), 'GameCraft Projects');
if (!fs.existsSync(defaultProjectsDir)) {
  try {
    fs.mkdirSync(defaultProjectsDir, { recursive: true });
  } catch (err) {
    console.error('Erreur création dossier projets:', err);
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const hasIcon = fs.existsSync(iconPath);

  // Restaure la géométrie retenue au lancement précédent (taille, position, maximisé).
  // Valeurs de repli sûres si l'état est absent ou corrompu.
  const st = loadWindowState();
  const width = (typeof st.width === 'number' && st.width >= 980) ? st.width : 1380;
  const height = (typeof st.height === 'number' && st.height >= 620) ? st.height : 870;

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 980,
    minHeight: 620,
    title: 'GameCraft Studio',
    backgroundColor: '#18181B',
    autoHideMenuBar: true,
    frame: false, // Frameless window with custom integrated desktop titlebar
    icon: hasIcon ? iconPath : undefined,
    // Ne restaure la position que si elle reste visible (multi-écrans sûr) ;
    // sinon Electron centre la fenêtre.
    x: isVisibleOnScreen(st) ? st.x : undefined,
    y: isVisibleOnScreen(st) ? st.y : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../studio.html'));

  // N'affiche la fenêtre qu'une fois le contenu peint (évite le flash blanc),
  // puis restaure l'état maximisé retenu au lancement précédent.
  mainWindow.once('ready-to-show', () => {
    if (st.maximized) mainWindow.maximize();
    mainWindow.show();
  });

  // Retient la géométrie (taille + position) au fur et à mesure.
  mainWindow.on('resize', debounceSave);
  mainWindow.on('move', debounceSave);
  mainWindow.on('close', saveWindowState);

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximizeChange', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximizeChange', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (activeEngineProcess) {
      try {
        activeEngineProcess.kill();
      } catch {}
      activeEngineProcess = null;
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Dialogs
ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
});

ipcMain.handle('dialog:openFiles', async (_, filters) => {
  if (!mainWindow) return [];
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: filters || [{ name: 'Tous les fichiers', extensions: ['*'] }]
  });
  if (res.canceled) return [];
  return res.filePaths;
});

ipcMain.handle('dialog:saveFile', async (_, defaultName, filters) => {
  if (!mainWindow) return null;
  const res = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'export.html',
    filters: filters || [{ name: 'Tous les fichiers', extensions: ['*'] }]
  });
  if (res.canceled) return null;
  return res.filePath;
});

// File System persistence
ipcMain.handle('fs:getDefaultProjectsDir', () => defaultProjectsDir);

ipcMain.handle('fs:saveProjectToDisk', async (_, project) => {
  try {
    if (!project || !project.name) throw new Error('Données de projet invalides');
    const folderName = safeDirName(project.name);
    const projDir = path.join(defaultProjectsDir, folderName);
    
    if (!fs.existsSync(projDir)) {
      fs.mkdirSync(projDir, { recursive: true });
    }

    // Write all project files to actual disk files.
    // Chaque chemin est validé (anti path-traversal) : un fichier ne peut
    // jamais être écrit en dehors du dossier du projet.
    let rejected = 0;
    if (project.files) {
      for (const [relPath, fileObj] of Object.entries(project.files)) {
        const safe = safeRelPath(relPath);
        const fullPath = safe ? path.join(projDir, safe) : null;
        if (!safe || !isInside(projDir, fullPath)) { rejected++; continue; }

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        if (fileObj.t === 'text') {
          fs.writeFileSync(fullPath, fileObj.c || '', 'utf8');
        } else if (fileObj.t === 'bin' && fileObj.d) {
          const base64Data = fileObj.d.replace(/^data:[^;]+;base64,/, '');
          fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
        }
      }
    }

    // Write metadata file
    const meta = {
      id: project.id,
      name: project.name,
      type: project.type,
      created: project.created,
      updated: Date.now(),
      prompt: project.prompt || '',
      chat: project.chat || [],
      history: project.history || [],
      ui: project.ui || {}
    };
    fs.writeFileSync(path.join(projDir, 'project.meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    return { ok: true, path: projDir };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// readDirRecursive, safeDirName, safeRelPath, isInside, detectProjectType
// sont importés depuis ./lib/project-utils (protégés contre le path traversal).

ipcMain.handle('fs:loadProjectFromDisk', async (_, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) throw new Error('Dossier introuvable');
    const metaPath = path.join(folderPath, 'project.meta.json');
    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }

    const files = readDirRecursive(folderPath);
    const projectName = meta.name || path.basename(folderPath);

    return {
      ok: true,
      project: {
        id: meta.id || Date.now().toString(36),
        name: projectName,
        type: meta.type || detectProjectType(files),
        created: meta.created || Date.now(),
        updated: Date.now(),
        prompt: meta.prompt || '',
        chat: meta.chat || [],
        history: meta.history || [],
        ui: meta.ui || {},
        files,
        diskPath: folderPath
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:listDiskProjects', async () => {
  try {
    if (!fs.existsSync(defaultProjectsDir)) return [];
    const entries = fs.readdirSync(defaultProjectsDir, { withFileTypes: true });
    const projects = [];

    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const projDir = path.join(defaultProjectsDir, ent.name);
      const metaPath = path.join(projDir, 'project.meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          projects.push({
            id: meta.id,
            name: meta.name || ent.name,
            type: meta.type || '2d',
            updated: meta.updated || fs.statSync(projDir).mtimeMs,
            path: projDir
          });
        } catch {}
      }
    }
    return projects;
  } catch {
    return [];
  }
});

ipcMain.handle('fs:openInExplorer', (_, targetPath) => {
  const p = targetPath || defaultProjectsDir;
  if (fs.existsSync(p)) {
    shell.openPath(p);
    return true;
  }
  return false;
});

// Engine Integration (Godot, etc.)
function findGodotExecutable() {
  if (customGodotPath && fs.existsSync(customGodotPath)) return customGodotPath;

  // Try checking in PATH
  try {
    const cmd = process.platform === 'win32' ? 'where godot' : 'which godot';
    const res = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (res && fs.existsSync(res.split('\n')[0].trim())) {
      return res.split('\n')[0].trim();
    }
  } catch {}

  // Check common Windows locations
  const commonPaths = [
    'C:\\Program Files\\Godot\\Godot_v4.3-stable_win64.exe',
    'C:\\Program Files\\Godot\\Godot_v4.2-stable_win64.exe',
    'C:\\Program Files\\Godot\\godot.exe',
    path.join(app.getPath('home'), 'scoop/apps/godot/current/godot.exe'),
    path.join(app.getPath('home'), 'AppData/Local/Godot/godot.exe')
  ];

  for (const cp of commonPaths) {
    if (fs.existsSync(cp)) return cp;
  }

  return null;
}

ipcMain.handle('engine:detectGodot', () => {
  const exe = findGodotExecutable();
  return {
    available: !!exe,
    path: exe
  };
});

ipcMain.handle('engine:setGodotPath', (_, customPath) => {
  if (fs.existsSync(customPath)) {
    customGodotPath = customPath;
    return { ok: true, path: customPath };
  }
  return { ok: false, error: 'Exécutable introuvable au chemin indiqué.' };
});

ipcMain.handle('engine:runGodot', async (_, projectId, project) => {
  if (activeEngineProcess) {
    try { activeEngineProcess.kill(); } catch {}
    activeEngineProcess = null;
  }

  const godotExe = findGodotExecutable();
  if (!godotExe) {
    return {
      ok: false,
      error: "Godot n'est pas détecté sur cette machine. Télécharge Godot 4 depuis https://godotengine.org ou indique son chemin dans les paramètres."
    };
  }

  // Ensure project is written to disk
  const folderName = safeDirName(project.name);
  const projDir = path.join(defaultProjectsDir, folderName);
  
  if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });

  // Ensure minimal project.godot exists if missing
  const projectGodotPath = path.join(projDir, 'project.godot');
  if (!fs.existsSync(projectGodotPath)) {
    const defaultGodotCfg = `config_version=5

[application]

config/name="${project.name}"
run/main_scene="res://main.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")

[rendering]

renderer/rendering_method="forward_plus"
`;
    fs.writeFileSync(projectGodotPath, defaultGodotCfg, 'utf8');
  }

  // Write all current files
  for (const [relPath, f] of Object.entries(project.files || {})) {
    const safe = safeRelPath(relPath);
    const full = safe ? path.join(projDir, safe) : null;
    if (!safe || !isInside(projDir, full)) continue; // chemin non sûr : ignoré
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (f.t === 'text') fs.writeFileSync(full, f.c || '', 'utf8');
  }

  try {
    // Launch Godot project in test mode
    activeEngineProcess = spawn(godotExe, ['--path', projDir], {
      cwd: projDir
    });

    activeEngineProcess.stdout.on('data', (chunk) => {
      if (mainWindow) {
        mainWindow.webContents.send('engine:log', { l: 'log', t: chunk.toString() });
      }
    });

    activeEngineProcess.stderr.on('data', (chunk) => {
      if (mainWindow) {
        mainWindow.webContents.send('engine:log', { l: 'err', t: chunk.toString() });
      }
    });

    activeEngineProcess.on('close', (code) => {
      if (mainWindow) {
        mainWindow.webContents.send('engine:log', { l: 'info', t: `Processus Godot terminé (code ${code}).` });
      }
      activeEngineProcess = null;
    });

    return { ok: true, path: projDir };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('engine:stopGodot', () => {
  if (activeEngineProcess) {
    try { activeEngineProcess.kill(); } catch {}
    activeEngineProcess = null;
    return true;
  }
  return false;
});

// ---- Coffre-fort des clés API (chiffrement au repos via le coffre-fort OS) ----
// L'interface ne manipule jamais une clé en clair sur disque : elle demande au
// processus principal de la chiffrer avant stockage, et de la déchiffrer à la
// volée pour les appels. Aucun secret n'est écrit dans les logs.
const secrets = require('./lib/secrets');

ipcMain.handle('secure:backend', () => secrets.backend());
ipcMain.handle('secure:encrypt', (_, value) => {
  if (typeof value !== 'string' || !value) return { ok: false, error: 'valeur vide' };
  return { ok: true, value: secrets.encrypt(value) };
});
ipcMain.handle('secure:decrypt', (_, stored) => {
  try { return { ok: true, value: secrets.decrypt(stored) }; }
  catch (e) { return { ok: false, error: 'déchiffrement impossible' }; }
});

// System info
ipcMain.handle('system:getInfo', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    node: process.versions.node,
    electron: process.versions.electron,
    projectsDir: defaultProjectsDir
  };
});

ipcMain.handle('system:openExternal', (_, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
  }
});
