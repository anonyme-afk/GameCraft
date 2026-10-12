#!/usr/bin/env node
// Lanceur de build MULTI-PLATEFORME (Windows + Linux + macOS).
// Remplace l'appel direct à build.cmd (spécifique à Windows) qui échouait sur
// Linux avec « build.cmd: not found ». On pose ici les variables d'environnement
// utiles (désactivation de la signature de code en local) puis on délègue au
// binaire electron-builder installé dans node_modules/.bin.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

// Distribution locale : on coupe la signature de code pour éviter le
// téléchargement/extraction de winCodeSign (inutile et source d'échec sans
// privilèges administrateur). Sans effet sur Linux/macOS.
process.env.CSC_IDENTITY_AUTO_DISCOVERY = process.env.CSC_IDENTITY_AUTO_DISCOVERY || 'false';
process.env.ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES =
  process.env.ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES || 'true';

const isWin = process.platform === 'win32';
const args = process.argv.slice(2); // transmet les options (--dir, --win portable, etc.)

// On exécute electron-builder via Node directement (fichier .js), jamais via un
// .cmd avec shell:true : le chemin du projet contient un espace (« Nouveau
// dossier ») et cmd.exe le couperait. Node + chemin en argument, c'est robuste.
const ebEntry = path.join(__dirname, '..', 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');

console.log(`[build.js] ${process.platform} — electron-builder ${args.join(' ')}`);
const res = spawnSync(process.execPath, [ebEntry, ...args], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  shell: false
});
process.exit(res.status == null ? 1 : res.status);

