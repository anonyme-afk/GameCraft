#!/usr/bin/env node
// Bundle des sources lisibles js/*.js vers app.js chargé par studio.html.
// Concatene les fichiers dans l'ordre de leur prefixe numerique.
// Chaque fragment commence par 'use strict'; : on ne le garde qu'une fois,
// en tete du bundle, et on insere un marqueur de section devant chaque fichier.
// Idempotent : regenerer sans changer les sources produit un app.js identique.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'js');
const outFile = path.join(root, 'app.js');

const files = fs.readdirSync(jsDir)
  .filter(f => f.endsWith('.js'))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

let out = "'use strict';\n";
for (const f of files) {
  let src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  // Retire la directive 'use strict'; en tête de fichier (déjà mise en tête de bundle).
  src = src.replace(/^\s*'use strict';\s*\r?\n/, '');
  out += `\n/* ===== ${f} ===== */\n` + src;
}

fs.writeFileSync(outFile, out, 'utf8');
console.log(`Bundle OK : ${files.length} fichiers -> app.js (${out.length} octets)`);
