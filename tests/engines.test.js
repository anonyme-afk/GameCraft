'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const registry = require('../electron/lib/engines/registry');
const detect = require('../electron/lib/engines/detect');

test('chaque adaptateur déclare un jeu de capacités complet', () => {
  const REQUIRED = ['createProject', 'readWriteFiles', 'scenes', 'run', 'preview', 'errorCapture', 'export'];
  for (const a of registry.LIST) {
    assert.ok(a.id && a.name, 'id/name requis');
    for (const cap of REQUIRED) {
      assert.strictEqual(typeof a.caps[cap], 'boolean', `${a.id}.${cap} doit être un booléen`);
    }
  }
});

test('seul le mode web prend en charge run+preview (aperçu intégré)', () => {
  assert.strictEqual(registry.capsOf('web').run, true);
  assert.strictEqual(registry.capsOf('web').preview, true);
  assert.strictEqual(registry.capsOf('unity').run, false);
  assert.strictEqual(registry.capsOf('unreal').run, false);
});

test('describeAll renvoie les 4 moteurs', () => {
  const all = registry.describeAll();
  assert.strictEqual(all.length, 4);
  assert.deepStrictEqual(all.map(a => a.id).sort(), ['godot', 'unity', 'unreal', 'web']);
});

test('scaffold web produit un projet 2d jouable (index+game.js+style.css)', () => {
  const r = registry.scaffold('web', 'MonJeu');
  assert.strictEqual(r.type, '2d');
  assert.ok(r.files['index.html']);
  assert.ok(r.files['game.js']);
  assert.ok(r.files['style.css']);
});

test('scaffold godot produit project.godot + main.tscn', () => {
  const r = registry.scaffold('godot', 'MonJeu');
  assert.strictEqual(r.type, 'godot');
  assert.ok(r.files['project.godot'].c.includes('config/name="MonJeu"'));
  assert.ok(r.files['main.gd']);
});

test('scaffold unity/unreal produit des fichiers de projet valides', () => {
  const u = registry.scaffold('unity', 'MonJeu');
  assert.strictEqual(u.type, 'unity');
  assert.ok(u.files['Assets/Main.cs'].c.includes('MonoBehaviour'));
  const ue = registry.scaffold('unreal', 'MonJeu');
  assert.strictEqual(ue.type, 'unreal');
  const uproj = Object.keys(ue.files).find(f => f.endsWith('.uproject'));
  assert.ok(uproj, 'un .uproject doit être généré');
  JSON.parse(ue.files[uproj].c); // doit être du JSON valide
});

test('scaffold lève sur un moteur inconnu', () => {
  assert.throws(() => registry.scaffold('cryengine', 'X'));
});

test('detectAll renvoie un état par moteur sans jamais planter', () => {
  const d = detect.detectAll();
  assert.ok('godot' in d && 'unity' in d && 'unreal' in d);
  assert.strictEqual(typeof d.godot.found, 'boolean');
  assert.strictEqual(d.unity.canRun, false, 'Unity ne doit pas prétendre pouvoir être lancé');
  assert.strictEqual(d.unreal.canRun, false, 'Unreal ne doit pas prétendre pouvoir être lancé');
  assert.ok(d.hardware && typeof d.hardware.ramGB === 'number');
});
