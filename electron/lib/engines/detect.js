// electron/lib/engines/detect.js
// Détection RÉELLE des moteurs de jeu installés sur la machine.
// Logique pure et testable (aucune dépendance Electron) : on ne fait que
// sonder le système de fichiers et le PATH. On ne prétend jamais qu'un moteur
// est disponible sans l'avoir trouvé (§ cahier des charges : honnêteté).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

// Cherche un exécutable dans le PATH (multi-plateforme).
function which(name) {
  const paths = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const exts = process.platform === 'win32' ? ['.exe', '.bat', '.cmd', ''] : [''];
  for (const dir of paths) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext);
      if (fileExists(candidate)) return candidate;
    }
  }
  return null;
}

// Chemins d'installation connus par moteur, selon l'OS.
function godotCandidatePaths() {
  const out = [];
  if (process.platform === 'win32') {
    const pf = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]
      .filter(Boolean);
    for (const base of pf) {
      out.push(path.join(base, 'Godot'));
      // Godot portable souvent téléchargé dans Téléchargements/Bureau.
    }
  } else if (process.platform === 'darwin') {
    out.push('/Applications/Godot.app/Contents/MacOS/Godot');
  } else {
    out.push('/usr/local/bin/Godot', '/usr/bin/Godot', '/opt/godot');
  }
  return out;
}

// Détecte Godot 4 : d'abord le PATH, puis les emplacements connus.
function detectGodot() {
  const viaPath = which(process.platform === 'win32' ? 'Godot' : 'godot');
  if (viaPath) return { found: true, path: viaPath, source: 'PATH' };
  for (const dir of godotCandidatePaths()) {
    if (fileExists(dir)) return { found: true, path: dir, source: 'chemin connu' };
    if (dirExists(dir)) {
      // Cherche un Godot*.exe dans ce dossier (builds nommés Godot_v4.x.exe).
      try {
        const hit = fs.readdirSync(dir).find(f => /^godot.*\.exe$/i.test(f));
        if (hit) return { found: true, path: path.join(dir, hit), source: 'chemin connu' };
      } catch { /* ignore */ }
    }
  }
  return { found: false, path: null, source: null };
}

// Tente de lire la version d'un exécutable (--version pour Godot).
function godotVersion(exePath) {
  try {
    const out = execSync(`"${exePath}" --version`, { timeout: 6000 }).toString().trim();
    return out.split('\n')[0] || null;
  } catch { return null; }
}

// Unity : éditeur installé via Unity Hub (dossiers versionnés).
function detectUnity() {
  const roots = [];
  if (process.platform === 'win32') {
    const hubs = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Unity'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Unity', 'Hub', 'Editor'),
      'C:\\Program Files\\Unity\\Hub\\Editor'
    ];
    roots.push(...hubs);
  } else if (process.platform === 'darwin') {
    roots.push('/Applications/Unity/Hub/Editor');
  } else {
    roots.push(path.join(os.homedir(), 'Unity', 'Hub', 'Editor'), '/opt/unity');
  }
  const found = roots.filter(dirExists);
  // On peut détecter l'installation, mais pas piloter l'éditeur sans licence/API.
  return { found: found.length > 0, paths: found };
}

// Unreal Engine : dossiers d'installation versionnés (UE_5.x).
function detectUnreal() {
  const roots = [];
  if (process.platform === 'win32') {
    const base = process.env['ProgramFiles'] || 'C:\\Program Files';
    roots.push(path.join(base, 'Epic Games'));
  } else if (process.platform === 'darwin') {
    roots.push('/Users/Shared/Epic Games');
  } else {
    roots.push(path.join(os.homedir(), 'UnrealEngine'));
  }
  const found = [];
  for (const r of roots) {
    if (!dirExists(r)) continue;
    try {
      for (const entry of fs.readdirSync(r)) {
        if (/^UE_\d/i.test(entry)) found.push(path.join(r, entry));
      }
    } catch { /* ignore */ }
  }
  return { found: found.length > 0, paths: found };
}

// Détection GPU (pour modèles locaux) : sommaire mais réel.
function detectHardware() {
  const info = { platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model || null, ramGB: Math.round(os.totalmem() / (1024 ** 3)), gpu: null };
  try {
    if (process.platform === 'win32') {
      // nvidia-smi présent => GPU Nvidia (CUDA)
      if (which('nvidia-smi')) info.gpu = 'nvidia (CUDA probable)';
    } else if (process.platform === 'darwin') {
      // Apple Silicon => mémoire unifiée (Metal)
      if (process.arch === 'arm64') info.gpu = 'Apple Silicon (Metal, mémoire unifiée)';
    } else {
      if (which('rocm-smi')) info.gpu = 'AMD (ROCm)';
      else if (which('nvidia-smi')) info.gpu = 'nvidia (CUDA)';
    }
  } catch { /* la détection GPU est best-effort */ }
  return info;
}

// Vue d'ensemble pour l'UI : chaque moteur + ses capacités RÉELLES.
function detectAll() {
  const godot = detectGodot();
  if (godot.found) godot.version = godotVersion(godot.path);
  const unity = detectUnity();
  const unreal = detectUnreal();
  return {
    godot,
    unity: { ...unity, canRun: false }, // éditeur non pilotable sans licence/API
    unreal: { ...unreal, canRun: false }, // build lourd, non automatisé ici
    hardware: detectHardware()
  };
}

module.exports = { which, detectGodot, godotVersion, detectUnity, detectUnreal, detectHardware, detectAll };
