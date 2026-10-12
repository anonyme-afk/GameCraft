// electron/lib/engines/registry.js
// Architecture extensible par adaptateur (§2). Chaque moteur déclare EXPLICITEMENT
// les capacités qu'il prend RÉELLEMENT en charge — on ne prétend jamais qu'une
// intégration fonctionne si elle n'est pas implémentée et testée.
//
// Un adaptateur = { id, name, kind, caps:{...bool}, scaffold(name) }.
// `caps` décide de ce que l'UI propose et de ce que l'IA est autorisée à faire.

// --- Mode B : sans moteur (HTML5 / Canvas / WebGL / Three.js) ---
const webAdapter = {
  id: 'web',
  name: 'HTML5 (Canvas / WebGL / Three.js)',
  kind: 'engineless',
  caps: {
    createProject: true, readWriteFiles: true, scenes: true, run: true,
    preview: true, errorCapture: true, export: true, offline: true
  },
  scaffold(name) {
    return {
      type: '2d',
      files: {
        'index.html': { t: 'text', c: `<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${name}</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<canvas id="c"></canvas>\n<script src="game.js"></script>\n</body>\n</html>\n` },
        'style.css': { t: 'text', c: 'html,body{margin:0;height:100%;background:#11161d;overflow:hidden}\ncanvas{display:block;width:100vw;height:100vh}\n' },
        'game.js': { t: 'text', c: `// ${name} — moteur sans dépendance (Canvas 2D).\nconst cv=document.getElementById('c'),ctx=cv.getContext('2d');\nfunction resize(){cv.width=innerWidth;cv.height=innerHeight}\naddEventListener('resize',resize);resize();\nlet t=0;\n(function loop(){t++;ctx.clearRect(0,0,cv.width,cv.height);ctx.fillStyle='#E568A0';ctx.beginPath();ctx.arc(cv.width/2+Math.cos(t/40)*80,cv.height/2,30,0,7);ctx.fill();requestAnimationFrame(loop)})();\n` }
      }
    };
  }
};

// --- Mode A : Godot 4 (détection + écriture + lancement + logs réels) ---
const godotAdapter = {
  id: 'godot',
  name: 'Godot Engine 4',
  kind: 'engine',
  caps: {
    createProject: true, readWriteFiles: true, scenes: true, run: true,
    preview: false, errorCapture: true, export: false, offline: true,
    requiresExternal: true
  },
  scaffold(name) {
    return {
      type: 'godot',
      files: {
        'project.godot': { t: 'text', c: `config_version=5\n\n[application]\n\nconfig/name="${name}"\nrun/main_scene="res://main.tscn"\nconfig/features=PackedStringArray("4.3", "Forward Plus")\n\n[rendering]\n\nrenderer/rendering_method="forward_plus"\n` },
        'main.tscn': { t: 'text', c: `[gd_scene load_steps=2 format=3 uid="uid://b${Math.random().toString(16).slice(2)}"]\n\n[sub_resource type="GDScript" id="1"]\nscript/source = "extends Node2D\\n\\nfunc _ready():\\n\\tprint(\\"${name} démararré\\")\\n"\n\n[node name="Main" type="Node2D"]\nscript = SubResource("1")\n` },
        'main.gd': { t: 'text', c: `extends Node2D\n\nfunc _ready():\n\tprint("${name} — Godot 4")\n\nfunc _process(delta):\n\tqueue_redraw()\n\nfunc _draw():\n\tdraw_circle(Vector2(240,135), 30, Color(0.9,0.4,0.63))\n` }
      }
    };
  }
};

// --- Unity : écriture des fichiers/settings du projet (honnête : pas d'édition pilotée) ---
const unityAdapter = {
  id: 'unity', name: 'Unity', kind: 'engine',
  caps: { createProject: true, readWriteFiles: true, scenes: true, run: false, preview: false, errorCapture: false, export: false, offline: true, requiresExternal: true },
  scaffold(name) {
    return {
      type: 'unity',
      files: {
        'ProjectSettings/ProjectSettings.asset': { t: 'text', c: `%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!129 &1\nPlayerSettings:\n  m_ObjectHideFlags: 0\n  productName: ${name}\n  companyName: GameCraft\n  scriptingBackend: 0\n` },
        'Assets/Main.cs': { t: 'text', c: `using UnityEngine;\n\n// ${name} — point d'entrée Unity.\npublic class Main : MonoBehaviour\n{\n    void Start()\n    {\n        Debug.Log("${name} démarré (Unity)");\n    }\n}\n` },
        'Assets/README.md': { t: 'text', c: `# ${name}\n\nOuvre ce dossier avec Unity Hub (LTS). La compilation se fait dans l'éditeur.\n` }
      }
    };
  }
};

// --- Unreal : projet .uproject valide (honnête : pas de build C++ automatisé) ---
const unrealAdapter = {
  id: 'unreal', name: 'Unreal Engine', kind: 'engine',
  caps: { createProject: true, readWriteFiles: true, scenes: false, run: false, preview: false, errorCapture: false, export: false, offline: true, requiresExternal: true },
  scaffold(name) {
    return {
      type: 'unreal',
      files: {
        [`${name}.uproject`]: { t: 'text', c: JSON.stringify({ FileVersion: 3, EngineAssociation: "5.4", Category: "GameCraft", Description: "", Modules: [{ Name: name, Type: "Runtime", LoadingPhase: "Default", AdditionalDependencies: ["Engine"] }] }, null, 2) },
        'README.md': { t: 'text', c: `# ${name}\n\nOuvre ${name}.uproject avec Unreal Engine 5. La génération C++ se fait dans l'éditeur.\n` }
      }
    };
  }
};

const ADAPTERS = { web: webAdapter, godot: godotAdapter, unity: unityAdapter, unreal: unrealAdapter };
const LIST = [webAdapter, godotAdapter, unityAdapter, unrealAdapter];

function getAdapter(id) { return ADAPTERS[id] || null; }
function capsOf(id) { const a = getAdapter(id); return a ? a.caps : {}; }
function describeAll() { return LIST.map(a => ({ id: a.id, name: a.name, kind: a.kind, caps: a.caps })); }
function scaffold(id, name) {
  const a = getAdapter(id);
  if (!a) throw new Error(`scaffold: moteur inconnu « ${id} »`);
  return a.scaffold(name);
}

module.exports = { ADAPTERS, LIST, getAdapter, capsOf, describeAll, scaffold };

