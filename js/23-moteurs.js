'use strict';
/* ============ moteurs : choix A/B/C et capacités ============ */
// Miroir du registre d'adaptateurs (electron/lib/engines/registry) pour le
// renderer, afin que le choix de moteur fonctionne aussi en navigateur pur.
// Les capacités déclarées ici doivent rester cohérentes avec le backend.

const ENGINE_CAPS = {
  web:     { createProject:1, readWriteFiles:1, scenes:1, run:1, preview:1, errorCapture:1, export:1, offline:1 },
  godot:   { createProject:1, readWriteFiles:1, scenes:1, run:1, preview:0, errorCapture:1, export:0, offline:1, requiresExternal:1 },
  unity:   { createProject:1, readWriteFiles:1, scenes:1, run:0, preview:0, errorCapture:0, export:0, offline:1, requiresExternal:1 },
  unreal:  { createProject:1, readWriteFiles:1, scenes:0, run:0, preview:0, errorCapture:0, export:0, offline:1, requiresExternal:1 }
};
const ENGINE_NAMES = { web:'HTML5 (Canvas / WebGL / Three.js)', godot:'Godot Engine 4', unity:'Unity', unreal:'Unreal Engine' };

// Scaffolds identiques au backend, pour créer un projet jouable hors Electron.
function engineScaffold(id, name) {
  if (id === 'web') return {
    type: '2d',
    files: {
      'index.html': { t: 'text', c: `<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${name}</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<canvas id="c"></canvas>\n<script src="game.js"></script>\n</body>\n</html>\n` },
      'style.css': { t: 'text', c: 'html,body{margin:0;height:100%;background:#11161d;overflow:hidden}\ncanvas{display:block;width:100vw;height:100vh}\n' },
      'game.js': { t: 'text', c: `// ${name} — moteur sans dépendance (Canvas 2D).\nconst cv=document.getElementById('c'),ctx=cv.getContext('2d');\nfunction resize(){cv.width=innerWidth;cv.height=innerHeight}\naddEventListener('resize',resize);resize();\nlet t=0;\n(function loop(){t++;ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#E568A0';ctx.beginPath();ctx.arc(cv.width/2+Math.cos(t/40)*80,cv.height/2,30,0,7);ctx.fill();requestAnimationFrame(loop)})();\n` }
    }
  };
  if (id === 'godot') return {
    type: 'godot',
    files: {
      'project.godot': { t: 'text', c: `config_version=5\n\n[application]\n\nconfig/name="${name}"\nrun/main_scene="res://main.tscn"\nconfig/features=PackedStringArray("4.3", "Forward Plus")\n\n[rendering]\n\nrenderer/rendering_method="forward_plus"\n` },
      'main.gd': { t: 'text', c: `extends Node2D\n\nfunc _ready():\n\tprint("${name} — Godot 4")\n\nfunc _process(delta):\n\tqueue_redraw()\n\nfunc _draw():\n\tdraw_circle(Vector2(240,135), 30, Color(0.9,0.4,0.63))\n` }
    }
  };
  if (id === 'unity') return {
    type: 'unity',
    files: {
      'Assets/Main.cs': { t: 'text', c: `using UnityEngine;\n\npublic class Main : MonoBehaviour\n{\n    void Start() { Debug.Log("${name} démarré (Unity)"); }\n}\n` },
      'Assets/README.md': { t: 'text', c: `# ${name}\n\nOuvre ce dossier avec Unity Hub (LTS). La compilation se fait dans l'éditeur.\n` }
    }
  };
  if (id === 'unreal') {
    const uproj = `${name}.uproject`;
    const files = {};
    files[uproj] = { t: 'text', c: JSON.stringify({ FileVersion: 3, EngineAssociation: '5.4', Category: 'GameCraft', Modules: [{ Name: name, Type: 'Runtime', LoadingPhase: 'Default' }] }, null, 2) };
    files['README.md'] = { t: 'text', c: `# ${name}\n\nOuvre ${uproj} avec Unreal Engine 5. La génération C++ se fait dans l'éditeur.\n` };
    return { type: 'unreal', files };
  }
  return null;
}

// Description lisible d'une capacité, pour l'UI.
const CAP_LABEL = { createProject:'Créer le projet', readWriteFiles:'Lire/écrire les fichiers', scenes:'Scènes', run:'Lancer le jeu', preview:'Aperçu intégré', errorCapture:'Récupérer les erreurs', export:'Exporter', offline:'Hors-ligne' };

// État d'installation des moteurs (desktop uniquement ; vide en navigateur).
async function engineStatus() {
  if (!window.electronAPI?.engines) return null;
  try { return await window.electronAPI.engines.detect(); } catch { return null; }
}

// Carte HTML « Moteurs » : capacités déclarées + état d'installation réel.
// Rendu synchrone depuis les caps locales ; la détection installée est remplie
// de façon asynchrone juste après (via #engines-detect).
function enginesCard() {
  const order = ['web', 'godot', 'unity', 'unreal'];
  const capKeys = ['createProject', 'readWriteFiles', 'scenes', 'run', 'preview', 'errorCapture', 'export'];
  const row = (id) => {
    const caps = ENGINE_CAPS[id];
    const installed = id === 'web' ? 'toujours disponible' : (caps.requiresExternal ? 'à installer' : '');
    const capsHTML = capKeys.map(k =>
      `<span class="chip" style="opacity:${caps[k] ? 1 : .4}">${caps[k] ? '✓' : '✕'} ${CAP_LABEL[k]}</span>`).join(' ');
    return `<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px"><b>${ENGINE_NAMES[id]}</b><span class="dim" style="font-size:11px" id="eng-st-${id}">${installed}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${capsHTML}</div>
    </div>`;
  };
  return `<div class="card"><h3>Moteurs & méthodes de création</h3>
    <div class="dim" style="font-size:12px;margin-bottom:8px">Chaque moteur déclare ce qu'il sait faire réellement. Le choix se fait à la création d'un projet (Fichier → Nouveau projet), ou en laissant l'IA décider.</div>
    ${order.map(row).join('')}
    <div class="dim" style="font-size:11.5px;margin-top:8px" id="engines-detect"></div></div>`;
}

// Remplit l'état d'installation réel une fois la carte affichée (desktop).
async function refreshEnginesDetect() {
  const box = $('#engines-detect');
  if (!box) return;
  const st = await engineStatus();
  if (!st) { box.textContent = 'Détection des moteurs disponible dans la version bureau.'; return; }
  const set = (id, ok, detail) => {
    const el = $('#eng-st-' + id);
    if (el) { el.textContent = ok ? ('✓ ' + (detail || 'installé')) : '✕ non installé'; el.style.color = ok ? 'var(--ok)' : 'var(--text2)'; }
  };
  set('godot', st.godot.found, st.godot.version ? ('Godot ' + st.godot.version) : 'Godot');
  set('unity', st.unity.found, st.unity.found ? 'détecté (édition non pilotée)' : '');
  set('unreal', st.unreal.found, st.unreal.found ? 'détecté (build non automatisé)' : '');
  const hw = st.hardware || {};
  box.textContent = `Machine : ${hw.ramGB} Go RAM${hw.gpu ? ' · GPU ' + hw.gpu : ''}.`;
}
