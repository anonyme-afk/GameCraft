// tests/project-utils.test.js
// Suite de tests backend réelle (exécutable avec `npm test`).
// Vérifie la logique pure du processus principal : validation des chemins,
// détection de type, détection texte/binaire, MIME et lecture récursive sûre.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const {
  isTextFileName,
  mimeForExt,
  safeDirName,
  safeRelPath,
  isInside,
  detectProjectType,
  readDirRecursive
} = require('../electron/lib/project-utils');

/* ------------------------------------------------------------------ *
 *  safeRelPath — garde-fou anti path-traversal (cœur de la sécurité)
 * ------------------------------------------------------------------ */
test('safeRelPath accepte un chemin relatif simple', () => {
  assert.strictEqual(safeRelPath('game.js'), 'game.js');
  assert.strictEqual(safeRelPath('src/main.gd'), 'src/main.gd');
  assert.strictEqual(safeRelPath('assets/img/player.png'), 'assets/img/player.png');
});

test('safeRelPath normalise les séparateurs Windows et les "." ', () => {
  assert.strictEqual(safeRelPath('src\\main.gd'), 'src/main.gd');
  assert.strictEqual(safeRelPath('./game.js'), 'game.js');
});

test('safeRelPath REJETTE la remontée de dossier (path traversal)', () => {
  assert.strictEqual(safeRelPath('../evil.txt'), null);
  assert.strictEqual(safeRelPath('../../etc/passwd'), null);
  assert.strictEqual(safeRelPath('src/../../evil'), null);
  assert.strictEqual(safeRelPath('a/../b/../../c'), null);
});

test('safeRelPath REJETTE les chemins absolus', () => {
  assert.strictEqual(safeRelPath('/etc/passwd'), null);
  assert.strictEqual(safeRelPath('C:/Windows/system32'), null);
  assert.strictEqual(safeRelPath('C:\\Windows'), null);
  if (path.sep === '\\') {
    assert.strictEqual(safeRelPath('\\\\serveur\\share'), null);
  }
});

test('safeRelPath rejette les entrées invalides', () => {
  assert.strictEqual(safeRelPath(''), null);
  assert.strictEqual(safeRelPath(null), null);
  assert.strictEqual(safeRelPath(undefined), null);
  assert.strictEqual(safeRelPath(42), null);
  assert.strictEqual(safeRelPath('a\x00b'), null); // caractère NUL
});

/* ------------------------------------------------------------------ *
 *  isInside — double garde indépendante de la plateforme
 * ------------------------------------------------------------------ */
test('isInside autorise la racine elle-même et ses sous-dossiers', () => {
  const root = path.resolve('/tmp/projet-test');
  assert.strictEqual(isInside(root, path.join(root, 'game.js')), true);
  assert.strictEqual(isInside(root, path.join(root, 'src', 'main.gd')), true);
  assert.strictEqual(isInside(root, root), true);
});

test('isInside REFUSE la sortie du dossier racine', () => {
  const root = path.resolve('/tmp/projet-test');
  assert.strictEqual(isInside(root, path.resolve('/tmp/autre')), false);
  assert.strictEqual(isInside(root, path.resolve('/tmp/projet-test-evil')), false);
  // piège classique : un préfixe partagé ne doit PAS passer
  assert.strictEqual(isInside(root, path.join(root, '..', 'projet-test-evil')), false);
});

/* ------------------------------------------------------------------ *
 *  safeDirName — nettoyage des noms de dossier
 * ------------------------------------------------------------------ */
test('safeDirName neutralise les caractères interdits sur Windows', () => {
  assert.strictEqual(safeDirName('a/b\\c:d*e?f"g<h>i|j'), 'a_b_c_d_e_f_g_h_i_j');
});

test('safeDirName borne la longueur et fournit un défaut', () => {
  assert.strictEqual(safeDirName(''), 'Projet');
  assert.strictEqual(safeDirName(null), 'Projet');
  assert.strictEqual(safeDirName('   '), 'Projet');
  assert.ok(safeDirName('x'.repeat(200)).length <= 80);
});

/* ------------------------------------------------------------------ *
 *  isTextFileName / mimeForExt — classification des fichiers
 * ------------------------------------------------------------------ */
test('isTextFileName reconnaît les fichiers de code et de données', () => {
  assert.strictEqual(isTextFileName('game.js'), true);
  assert.strictEqual(isTextFileName('main.gd'), true);
  assert.strictEqual(isTextFileName('level.tscn'), true);
  assert.strictEqual(isTextFileName('style.css'), true);
  assert.strictEqual(isTextFileName('scene.json'), true);
  assert.strictEqual(isTextFileName('notes.md'), true);
});

test('isTextFileName refuse les ressources binaires', () => {
  assert.strictEqual(isTextFileName('hero.png'), false);
  assert.strictEqual(isTextFileName('model.glb'), false);
  assert.strictEqual(isTextFileName('jump.mp3'), false);
  assert.strictEqual(isTextFileName('anim.gltf'), false); // gltf = binaire/data
  assert.strictEqual(isTextFileName('sprite.webp'), false);
});

test('mimeForExt mappe les extensions courantes', () => {
  assert.strictEqual(mimeForExt('png'), 'image/png');
  assert.strictEqual(mimeForExt('.PNG'), 'image/png');
  assert.strictEqual(mimeForExt('jpg'), 'image/jpeg');
  assert.strictEqual(mimeForExt('mp3'), 'audio/mpeg');
  assert.strictEqual(mimeForExt('glb'), 'model/gltf-binary');
  assert.strictEqual(mimeForExt('inconnu'), 'application/octet-stream');
  assert.strictEqual(mimeForExt(''), 'application/octet-stream');
});

/* ------------------------------------------------------------------ *
 *  detectProjectType — déduction du moteur depuis les fichiers
 * ------------------------------------------------------------------ */
test('detectProjectType déduit Godot, 3D ou 2D', () => {
  assert.strictEqual(detectProjectType({ 'project.godot': {} }), 'godot');
  assert.strictEqual(detectProjectType({ 'scene.json': {} }), '3d');
  assert.strictEqual(detectProjectType({ 'index.html': {} }), '2d');
  // priorité Godot même si scene.json est aussi présent
  assert.strictEqual(detectProjectType({ 'project.godot': {}, 'scene.json': {} }), 'godot');
  assert.strictEqual(detectProjectType({}), '2d');
  assert.strictEqual(detectProjectType(null), '2d');
});

/* ------------------------------------------------------------------ *
 *  readDirRecursive — lecture réelle sur un dossier temporaire,
 *  avec le garde-fou isInside vérifié de bout en bout.
 * ------------------------------------------------------------------ */
test('readDirRecursive lit texte et binaire sur un vrai dossier', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'gcutil-'));
  try {
    fs.writeFileSync(path.join(base, 'index.html'), '<h1>ok</h1>');
    fs.mkdirSync(path.join(base, 'assets'));
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // signature PNG
    fs.writeFileSync(path.join(base, 'assets', 'hero.png'), png);
    // éléments qui doivent être ignorés
    fs.writeFileSync(path.join(base, 'project.meta.json'), '{"ignored":true}');

    const out = readDirRecursive(base);
    assert.ok(out['index.html'], 'index.html doit être lu');
    assert.strictEqual(out['index.html'].t, 'text');
    assert.strictEqual(out['index.html'].c, '<h1>ok</h1>');

    assert.ok(out['assets/hero.png'], 'assets/hero.png doit être lu');
    assert.strictEqual(out['assets/hero.png'].t, 'bin');
    assert.strictEqual(out['assets/hero.png'].m, 'image/png');
    assert.ok(out['assets/hero.png'].d.startsWith('data:image/png;base64,'));
    assert.strictEqual(out['assets/hero.png'].size, png.length);

    // project.meta.json est explicitement exclu par readDirRecursive
    assert.ok(!('project.meta.json' in out), 'project.meta.json doit être ignoré');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

