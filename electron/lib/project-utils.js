// electron/lib/project-utils.js
// Logique pure et testable, sans dépendance à Electron.
// Utilisée par le processus principal ET par la suite de tests.

const path = require('path');
const fs = require('fs');

// Extensions considérées comme du texte (éditables directement).
const TEXT_EXT_RE = /\.(txt|md|json|js|mjs|css|html|htm|csv|glsl|frag|vert|xml|tsv|gd|tscn|godot|tres|cfg|ini|yml|yaml|txt)$/i;

function isTextFileName(name) {
  return TEXT_EXT_RE.test(name);
}

// Convertit une extension (avec ou sans point) en type MIME.
function mimeForExt(ext) {
  const e = String(ext || '').toLowerCase().replace(/^\./, '');
  switch (e) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    case 'glb': return 'model/gltf-binary';
    case 'gltf': return 'model/gltf+json';
    default: return 'application/octet-stream';
  }
}

// Nettoie un nom de dossier pour le rendre sûr sur le système de fichiers.
function safeDirName(name) {
  return (name || 'Projet')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Projet';
}

// Valide un chemin relatif destiné à être écrit sous un répertoire racine.
// Retourne le chemin RELATIF normalisé si sûr, sinon null.
// Protège contre le path traversal (../../etc/passwd) et les chemins absolus.
function safeRelPath(relPath) {
  if (typeof relPath !== 'string' || !relPath) return null;

  // Rejette les NUL et les caractères de contrôle.
  if (/[\x00]/.test(relPath)) return null;

  // Normalise les séparateurs Windows -> POSIX pour l'analyse.
  const unified = relPath.replace(/\\/g, '/');

  // Rejette les chemins absolus (C:/..., /..., \\serveur).
  if (path.isAbsolute(relPath) || unified.startsWith('/')) return null;
  if (/^[a-zA-Z]:/.test(unified)) return null;

  // Rejette tout segment ".." (remontée de dossier).
  const segments = unified.split('/');
  if (segments.some(s => s === '..')) return null;

  // Ignore les segments vides et les "." et reconstruit un chemin propre.
  const clean = segments.filter(s => s && s !== '.').join('/');
  if (!clean) return null;

  // Vérification finale : la cible doit rester sous la racine.
  // (double garde, indépendante de la plateforme)
  return clean;
}

// Vérifie qu'un chemin absolu résolu reste bien à l'intérieur d'une racine.
function isInside(root, target) {
  const r = path.resolve(root);
  const t = path.resolve(target);
  return t === r || t.startsWith(r + path.sep);
}

// Déduit le type de projet à partir des fichiers présents.
function detectProjectType(files) {
  if (files && files['project.godot']) return 'godot';
  if (files && files['scene.json']) return '3d';
  return '2d';
}

// Lit récursivement un dossier et renvoie un objet { relPath: { t, c|d, m, size } }.
// fs/path sont des modules Node standard : cette fonction est testable hors Electron.
function readDirRecursive(baseDir, currentDir = '', { maxTextSize = 5 * 1024 * 1024 } = {}) {
  const fullCurrent = path.join(baseDir, currentDir);
  const entries = fs.readdirSync(fullCurrent, { withFileTypes: true });
  const result = {};

  for (const ent of entries) {
    const rel = currentDir ? `${currentDir}/${ent.name}` : ent.name;
    if (ent.name === 'project.meta.json' || ent.name === '.git') continue;

    const full = path.join(baseDir, rel);

    // Garde-fou de sécurité : ne jamais sortir du dossier de base.
    if (!isInside(baseDir, full)) continue;

    if (ent.isDirectory()) {
      Object.assign(result, readDirRecursive(baseDir, rel, { maxTextSize }));
    } else {
      const stat = fs.statSync(full);
      if (isTextFileName(ent.name) && stat.size < maxTextSize) {
        result[rel] = { t: 'text', c: fs.readFileSync(full, 'utf8') };
      } else {
        const buf = fs.readFileSync(full);
        const mime = mimeForExt(path.extname(ent.name));
        result[rel] = {
          t: 'bin',
          d: `data:${mime};base64,${buf.toString('base64')}`,
          m: mime,
          size: stat.size
        };
      }
    }
  }
  return result;
}

module.exports = {
  isTextFileName,
  mimeForExt,
  safeDirName,
  safeRelPath,
  isInside,
  detectProjectType,
  readDirRecursive
};
