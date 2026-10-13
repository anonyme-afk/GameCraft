'use strict';

/* ===== 01-utilitaires.js ===== */
/* ============ utilitaires ============ */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Affecte une valeur à un chemin pointé dans un objet ("hp.temperature" -> obj.hp.temperature).
const setSettingPath=(obj,path,val)=>{const ks=String(path).split('.');let o=obj;for(let i=0;i<ks.length-1;i++){if(typeof o[ks[i]]!=='object'||o[ks[i]]===null)o[ks[i]]={};o=o[ks[i]]}o[ks[ks.length-1]]=val};
const fmtSize=n=>n<1024?n+' o':n<1048576?(n/1024).toFixed(1)+' Ko':(n/1048576).toFixed(1)+' Mo';
const fmtDate=t=>new Date(t).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const ext=p=>(p.match(/\.([^./]+)$/)||[])[1]?.toLowerCase()||'';
const IC={home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',folder:'<path d="M3 6h6l2 2h10v11H3z"/>',box:'<path d="M12 3l9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8"/>',settings:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',files:'<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>',history:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',play:'<path d="M7 4l13 8-13 8z"/>',stop:'<rect x="6" y="6" width="12" height="12"/>',send:'<path d="M4 12l16-8-6 16-3-7z"/>',clip:'<path d="M20 11l-8 8a5 5 0 01-7-7l9-9a3 3 0 014 4l-9 9a1 1 0 01-2-2l8-8"/>',plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',trash:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',copy:'<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',refresh:'<path d="M20 11a8 8 0 10-2 6M20 4v7h-7"/>',split:'<rect x="3" y="4" width="18" height="16"/><path d="M12 4v16"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;

IC.undo='<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/>';IC.redo='<path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3"/>';IC.image='<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-5 4 3 3-2 5 4"/>';IC.layers='<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>';IC.fs='<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';

/* ===== 02-parametres.js ===== */
/* ============ paramètres ============ */
const DEF={theme:'dark',active:'ollama',ctx:40000,maxTok:8192,numCtx:8192,editor:{fs:13,tab:2,wrap:false},sec:{allowAIDelete:true},last:'',
 layout:{chatW:360,sideW:270,bottomH:190,split:.5,chat:true,side:true,bottom:false,mode:'split'},
 hp:{temperature:null,topP:null,freqPenalty:null,presPenalty:null,system:''},
 dev:false,tel:false,
 p:{ollama:{base:'http://localhost:11434',model:''},openai:{base:'https://api.openai.com/v1',key:'',model:''},lmstudio:{base:'http://localhost:1234/v1',key:'',model:''},anthropic:{key:'',model:''},gemini:{key:'',model:''}}};
const PROV={ollama:{name:'Ollama (local)'},openai:{name:'OpenAI / compatible'},lmstudio:{name:'LM Studio (local)'},anthropic:{name:'Anthropic'},gemini:{name:'Google Gemini'}};
function merge(a,b){const o={...a};for(const k in b){o[k]=(a&&a[k]&&typeof a[k]==='object'&&b[k]&&typeof b[k]==='object')?merge(a[k],b[k]):b[k]}return o}
let ST;try{ST=merge(JSON.parse(JSON.stringify(DEF)),JSON.parse(localStorage.getItem('studio.settings')||'{}'))}catch{ST=JSON.parse(JSON.stringify(DEF))}
const saveSettings=()=>{try{(window.persistSettings?window.persistSettings(ST):0)||localStorage.setItem('studio.settings',JSON.stringify(ST))}catch(e){toast("Impossible d'enregistrer les paramètres : "+e.message,'err')}};
const provOK=k=>{const c=ST.p[k];return !!c.model&&(k==='ollama'||k==='lmstudio'?!!c.base:!!c.key&&(k!=='openai'||!!c.base))};
document.documentElement.dataset.theme=ST.theme;

/* ===== 03-stockage-des-projets.js ===== */
/* ============ stockage des projets (IndexedDB) ============ */
const DB={_d:null,open(){return this._d||(this._d=new Promise((res,rej)=>{const r=indexedDB.open('studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
 async tx(mode,fn){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('projects',mode);const q=fn(t.objectStore('projects'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
 all(){return this.tx('readonly',s=>s.getAll())},put(p){return this.tx('readwrite',s=>s.put(p))},del(id){return this.tx('readwrite',s=>s.delete(id))}};

/* ===== 04-etat.js ===== */
/* ============ état ============ */
const S={view:'home',project:null,out:[],phase:'',sel:null,creating:null,scat:'general',tabs:[],active:null,rt:'files',bt:'console',busy:false,ctl:null,unsaved:new Set(),logs:[],rtErr:[],tasks:[],save:'ok',saveMsg:'',att:[],kind:'2d',collapsed:new Set(),tests:{},pos:{},q:'',hp:'',asel:null,pf:'',list:[]};
let PROJ=[];
async function refreshProjects(){try{PROJ=(await DB.all()).sort((a,b)=>b.updated-a.updated)}catch(e){PROJ=[];toast('Lecture des projets impossible : '+e.message,'err')}}
const flushSave=async()=>{const p=S.project;if(!p)return;p.updated=Date.now();p.ui={tabs:[...S.tabs],active:S.active};try{await DB.put(p);if(window.electronAPI?.fs){await window.electronAPI.fs.saveProjectToDisk(p)}S.unsaved.clear();S.save='ok';$$('.tab.mod').forEach(t=>t.classList.remove('mod'))}catch(e){S.save='err';S.saveMsg=e.message;toast("Échec de l'enregistrement : "+e.message,'err')}updateStatus()};
const saveSoon=debounce(flushSave,500);
const touch=()=>{S.save='dirty';updateStatus();saveSoon()};

/* ===== 05-projets.js ===== */
/* ============ projets ============ */
function defaultScene(kind){return kind==='3d'?{version:1,mode:'3d',objects:[{id:'o1',name:'Sol',type:'plane',position:[0,0,0],rotation:[-90,0,0],scale:[10,10,1],color:'#2b2b31',role:''},{id:'o2',name:'Cube',type:'box',position:[0,0.5,0],rotation:[0,0,0],scale:[1,1,1],color:'#e568a0',role:'spin'}]}
 :{version:1,mode:'2d',objects:[{id:'o1',name:'Sol',type:'rect',x:0,y:400,w:800,h:50,color:'#2b2b31',role:'solid'},{id:'o2',name:'Plateforme',type:'rect',x:300,y:310,w:140,h:16,color:'#3d3d46',role:'solid'},{id:'o3',name:'Joueur',type:'rect',x:100,y:350,w:32,h:32,color:'#e568a0',role:'player'},{id:'o4',name:'Pièce',type:'circle',x:370,y:285,r:10,color:'#f5c542',role:'item'}]}}
function starter(kind){const F=c=>({t:'text',c});const css='html,body{margin:0;height:100%;background:#111;color:#eee;font-family:sans-serif}\n';const scene=F(JSON.stringify(defaultScene(kind),null,2)+'\n');
 if(kind==='godot')return{
  'project.godot':F('config_version=5\n\n[application]\n\nconfig/name="Mon jeu Godot"\nrun/main_scene="res://main.tscn"\nconfig/features=PackedStringArray("4.3", "Forward Plus")\n\n[rendering]\n\nrenderer/rendering_method="forward_plus"\n'),
  'main.tscn':F('[gd_scene load_steps=2 format=3 uid="uid://c1x8v9b8a0"]\n\n[ext_resource type="Script" path="res://main.gd" id="1_main"]\n\n[node name="Main" type="Node2D"]\nscript = ExtResource("1_main")\n\n[node name="ColorRect" type="ColorRect" parent="."]\noffset_right = 800.0\noffset_bottom = 450.0\ncolor = Color(0.1, 0.1, 0.18, 1.0)\n\n[node name="Label" type="Label" parent="."]\noffset_left = 240.0\noffset_top = 200.0\noffset_right = 560.0\noffset_bottom = 240.0\ntext = "GameCraft Studio — Jeu Godot 4"\nhorizontal_alignment = 1\n'),
  'main.gd':F('extends Node2D\n\nfunc _ready():\n\tprint("GameCraft Studio : Projet Godot 4 démarré avec succès !")\n\nfunc _process(delta):\n\tpass\n'),
  'README.md':F('# Projet Godot 4\n\nCréé avec GameCraft Studio.\nVous pouvez lancer ce jeu directement avec le bouton « Lancer » ou ouvrir le projet dans Godot 4.\n')
 };
 if(kind==='3d')return{'index.html':F('<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>Mon jeu 3D</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>\n<script src="game.js"><\/script>\n</body>\n</html>\n'),'style.css':F(css+'canvas{display:block}\n'),'scene.json':scene,
 'game.js':F(String.raw`if(typeof THREE==='undefined'){console.error('Three.js non chargé : une connexion Internet est nécessaire pour la 3D.')}else{
  const data=window.SCENE||{objects:[]};
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x1a1a2e);
  const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,200);camera.position.set(3,2.5,5);camera.lookAt(0,0.5,0);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);document.body.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,0.55));
  const sun=new THREE.DirectionalLight(0xffffff,0.9);sun.position.set(3,6,4);scene.add(sun);
  const spinning=[],rad=Math.PI/180;
  for(const o of data.objects){
    const geo=o.type==='sphere'?new THREE.SphereGeometry(0.5,24,16):o.type==='plane'?new THREE.PlaneGeometry(1,1):new THREE.BoxGeometry(1,1,1);
    const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:o.color||'#ffffff',side:THREE.DoubleSide}));
    const p=o.position||[0,0,0],r=o.rotation||[0,0,0],s=o.scale||[1,1,1];
    mesh.position.set(p[0],p[1],p[2]);mesh.rotation.set(r[0]*rad,r[1]*rad,r[2]*rad);mesh.scale.set(s[0],s[1],s[2]);
    scene.add(mesh);if(o.role==='spin')spinning.push(mesh);
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  (function loop(){requestAnimationFrame(loop);spinning.forEach(m=>m.rotation.y+=0.01);renderer.render(scene,camera)})();
}
`)};
 return{'index.html':F('<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>Mon jeu</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<canvas id="game" width="800" height="450"></canvas>\n<script src="game.js"><\/script>\n</body>\n</html>\n'),'style.css':F(css+'body{display:grid;place-items:center}\ncanvas{background:#1a1a2e;max-width:100%;border:1px solid #333}\n'),'scene.json':scene,
 'game.js':F(String.raw`const cv=document.getElementById('game'),ctx=cv.getContext('2d');
const scene=window.SCENE||{objects:[]};
const objs=scene.objects.map(o=>({...o}));
const player=objs.find(o=>o.role==='player');
const solids=objs.filter(o=>o.role==='solid');
let items=objs.filter(o=>o.role==='item');
const start=player?{x:player.x,y:player.y}:null;
const keys={};
addEventListener('keydown',e=>{keys[e.key]=true;if(e.key===' ')e.preventDefault()});
addEventListener('keyup',e=>keys[e.key]=false);
let vy=0,ground=false,score=0,last=performance.now();
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const box=o=>o.type==='circle'?{x:o.x-o.r,y:o.y-o.r,w:o.r*2,h:o.r*2}:o;
function update(dt){
  if(!player)return;
  const vx=((keys.ArrowRight||keys.d)?1:0)*220-((keys.ArrowLeft||keys.q||keys.a)?1:0)*220;
  if((keys[' ']||keys.ArrowUp)&&ground){vy=-520;ground=false}
  vy+=1400*dt;
  player.x+=vx*dt;
  for(const s of solids)if(hit(player,s)){if(vx>0)player.x=s.x-player.w;else if(vx<0)player.x=s.x+s.w}
  player.y+=vy*dt;ground=false;
  for(const s of solids)if(hit(player,s)){if(vy>0){player.y=s.y-player.h;ground=true}else if(vy<0){player.y=s.y+s.h}vy=0}
  player.x=Math.max(0,Math.min(cv.width-player.w,player.x));
  if(player.y>cv.height+200){player.x=start.x;player.y=start.y;vy=0}
  items=items.filter(it=>{if(hit(player,box(it))){score++;return false}return true});
}
function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);
  for(const o of objs){
    if(o.role==='item'&&!items.includes(o))continue;
    ctx.fillStyle=o.color||'#fff';
    if(o.type==='circle'){ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill()}
    else ctx.fillRect(o.x,o.y,o.w,o.h);
  }
  ctx.fillStyle='#aaa';ctx.font='13px sans-serif';
  ctx.fillText('Flèches ou ZQSD pour bouger, espace pour sauter. Pièces : '+score,12,22);
}
function loop(t){const dt=Math.min(0.05,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
`)}}
function newProject(name,type,prompt){return{id:uid(),name,type,created:Date.now(),updated:Date.now(),files:starter(type),chat:[],history:[],prompt:prompt||''}}
const nameFrom=t=>{const w=t.replace(/\s+/g,' ').trim().split(' ').slice(0,5).join(' ').replace(/[.,;:!?]+$/,'');return (w.length>40?w.slice(0,40):w)||'Nouveau jeu'};
const norm=p=>String(p).trim().replace(/\\/g,'/').replace(/^(\.\/)+/,'').replace(/^\/+/,'').split(/[?#]/)[0];
function cleanPath(p){p=norm(p);if(!p||p.length>200||p.split('/').some(s=>s===''||s==='..'||s==='.')||/[<>:"|*\0]/.test(p))return null;return p}
const safeName=n=>n.replace(/[^\w.\-]+/g,'_');
function uniquePath(p,path){if(!p.files[path])return path;const m=path.match(/^(.*?)(\.[^./]*)?$/);let i=2,np;do{np=m[1]+'-'+i+(m[2]||'');i++}while(p.files[np]);return np}
async function openProject(p){S.project=p;const ui=p.ui||{};S.tabs=(ui.tabs||[]).filter(t=>p.files[t]);S.active=p.files[ui.active]?ui.active:(S.tabs[0]||null);if(!S.tabs.length){const f=p.files['main.gd']?'main.gd':p.files['game.js']?'game.js':Object.keys(p.files).find(k=>p.files[k].t==='text');if(f){S.tabs=[f];S.active=f}}S.logs=[];S.rtErr=[];S.out=[];S.sel=null;S.save='ok';S.view='workspace';ST.last=p.id;saveSettings();render()}
async function closeProject(){await flushSave();S.project=null;S.view='home';render()}
async function createProjectFromDialog(){const opts=[['2d','HTML5 — 2D (Canvas)'],['3d','HTML5 — 3D (Three.js)'],['godot','Godot Engine 4 (GDScript)'],['unity','Unity (fichiers de projet)'],['unreal','Unreal Engine (fichiers de projet)']];const r=await modal({title:'Nouveau projet',fields:[{k:'name',label:'Nom du projet',value:'Mon jeu'},{k:'kind',label:'Moteur / méthode',type:'select',value:'2d',opts}],ok:'Créer'});if(!r||!r.name.trim())return;let p;const k=r.kind;
  if(k==='unity'||k==='unreal'){const sc=engineScaffold(k,r.name.trim());if(!sc){toast('Moteur inconnu.','err');return}p={id:uid(),name:r.name.trim(),type:sc.type,created:Date.now(),updated:Date.now(),files:sc.files,chat:[],history:[],prompt:''};toast('Projet '+ENGINE_NAMES[k]+' créé : ouvre-le avec l\'éditeur pour compiler.','info')}
  else p=newProject(r.name.trim(),k);
  try{await DB.put(p);if(window.electronAPI?.fs){await window.electronAPI.fs.saveProjectToDisk(p)}}catch(e){toast('Création impossible : '+e.message,'err');return}await refreshProjects();openProject(p)}

/* ===== 06-fichiers-du-projet.js ===== */
/* ============ fichiers du projet ============ */
const readURL=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(f)});
const TEXTX=/\.(txt|md|json|js|css|html|csv|glsl|frag|vert|xml|tsv)$/i;
async function readFile(f){if(f.size>20*1048576)throw new Error(f.name+' dépasse 20 Mo');if(TEXTX.test(f.name)&&f.size<1048576)return{name:f.name,t:'text',c:await f.text(),size:f.size};return{name:f.name,t:'bin',d:await readURL(f),m:f.type||'application/octet-stream',size:f.size}}
function putAsset(p,dir,a,forceName){const path=uniquePath(p,(dir?dir+'/':'')+safeName(forceName||a.name));p.files[path]=a.t==='text'?{t:'text',c:a.c}:{t:'bin',d:a.d,m:a.m,size:a.size};return path}
async function importFiles(files,dir='assets'){const p=S.project;if(!p){toast("Ouvre d'abord un projet.",'err');return[]}const out=[];for(const f of files){try{out.push(putAsset(p,dir,await readFile(f)))}catch(e){toast(e.message,'err')}}if(out.length){touch();renderSide();toast(out.length+' fichier(s) importé(s) dans '+dir+'/')}return out}
async function createFile(){const r=await modal({title:'Nouveau fichier',fields:[{k:'p',label:'Chemin (ex. scripts/player.js)',value:''}],ok:'Créer'});if(!r)return;const path=cleanPath(r.p);if(!path){toast('Chemin invalide.','err');return}if(S.project.files[path]){toast('Ce fichier existe déjà.','err');return}S.project.files[path]={t:'text',c:''};touch();openFile(path)}
async function renameFile(path){const r=await modal({title:'Renommer',fields:[{k:'p',label:'Nouveau chemin',value:path}],ok:'Renommer'});if(!r)return;const np=cleanPath(r.p);if(!np||np===path)return;if(S.project.files[np]){toast('Ce chemin existe déjà.','err');return}S.project.files[np]=S.project.files[path];delete S.project.files[path];S.tabs=S.tabs.map(t=>t===path?np:t);if(S.active===path)S.active=np;touch();renderTabs();renderEditor();renderSide();toast('Renommé. Les références dans le code ne sont pas mises à jour automatiquement.')}
async function deleteFile(path){const r=await modal({title:'Supprimer le fichier',html:`<p>Supprimer <code>${esc(path)}</code> ? Cette action est définitive.</p>`,ok:'Supprimer',danger:true});if(!r)return;delete S.project.files[path];S.tabs=S.tabs.filter(t=>t!==path);if(S.active===path)S.active=S.tabs[S.tabs.length-1]||null;touch();renderTabs();renderEditor();renderSide()}
function openFile(path,line){if(!S.project.files[path])return;captureEd();if(!S.tabs.includes(path))S.tabs.push(path);S.active=path;if(ST.layout.mode==='preview'){ST.layout.mode='split';applyLayout()}renderTabs();renderEditor();renderSide(true);if(line)gotoLine(line)}
function closeTab(path){captureEd();const i=S.tabs.indexOf(path);S.tabs=S.tabs.filter(t=>t!==path);if(S.active===path)S.active=S.tabs[Math.min(i,S.tabs.length-1)]||null;renderTabs();renderEditor();renderSide(true)}

/* ===== 07-coloration-syntaxique.js ===== */
/* ============ coloration syntaxique ============ */
const RX={js:/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|do|class|new|this|import|export|from|async|await|switch|case|break|continue|of|in|typeof|instanceof|true|false|null|undefined|extends|super|try|catch|finally|throw|default|static|void|delete)\b|\b(\d+(?:\.\d+)?)\b/g,
 css:/(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#[0-9a-fA-F]{3,8}\b)|(-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b)/g,
 html:/(<!-{2}[\s\S]*?-{2}>)|(<\/?[a-zA-Z][^>]*>)/g,
 json:/("(?:[^"\\\n]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g};
const CL={js:['c','s','k','n'],css:['c','s','k','n'],html:['c','t'],json:['s','k','n']};
const langOf=p=>({js:'js',mjs:'js',css:'css',html:'html',htm:'html',json:'json'})[ext(p)];
function hl(t,lang){const rx=RX[lang];if(!rx||t.length>400000)return esc(t)+'\n';const cl=CL[lang];let o='',last=0,m;rx.lastIndex=0;while((m=rx.exec(t))){if(m[0]===''){rx.lastIndex++;continue}o+=esc(t.slice(last,m.index));let gi=1;while(m[gi]===undefined)gi++;o+=`<span class="tk-${cl[gi-1]}">${esc(m[0])}</span>`;last=m.index+m[0].length}return o+esc(t.slice(last))+'\n'}

/* ===== 08-editeur.js ===== */
/* ============ éditeur ============ */
function captureEd(){const ta=$('#ta');if(ta&&S.active)S.pos[S.active]={top:ta.scrollTop,left:ta.scrollLeft,s:ta.selectionStart,e:ta.selectionEnd}}
function renderEditor(){const ep=$('#edpane');if(!ep)return;const path=S.active,f=path&&S.project.files[path];
 if(!path||!f){ep.innerHTML='<div class="empty" style="margin:auto">Aucun fichier ouvert.<br>Ouvre un fichier depuis l\'explorateur.</div>';return}
 if(f.t==='bin'){const m=f.m||'';ep.innerHTML=`<div class="viewer"><div>${m.startsWith('image/')?`<img src="${f.d}" alt="">`:m.startsWith('audio/')?`<audio controls src="${f.d}"></audio>`:`<div class="dim">Aperçu indisponible pour ce type de fichier.</div>`}<p><b>${esc(path)}</b><br><span class="dim">${esc(m)}, ${fmtSize(f.size||0)}, fichier binaire non éditable</span></p></div></div>`;return}
 ep.innerHTML=`<div id="findbar" hidden><div class="fr"><input class="inp" id="fq" placeholder="Rechercher"><span class="dim" id="fcount"></span><button class="ib" data-act="findNav" data-d="-1" title="Précédent">↑</button><button class="ib" data-act="findNav" data-d="1" title="Suivant">↓</button><button class="ib" data-act="findClose">${ico('x')}</button></div><div class="fr"><input class="inp" id="fr" placeholder="Remplacer par"><button class="btn sm" data-act="replOne">Remplacer</button><button class="btn sm" data-act="replAll">Tout</button></div></div><div class="ed"><div class="gut${ST.editor.wrap?' wrap':''}" id="gut"></div><div class="edwrap${ST.editor.wrap?' wrap':''}"><pre id="hl"></pre><textarea id="ta" spellcheck="false" wrap="${ST.editor.wrap?'soft':'off'}" autocapitalize="off" autocomplete="off"></textarea></div></div>`;
 const ta=$('#ta'),hlE=$('#hl'),gut=$('#gut');const wrap=!!ST.editor.wrap;let wrapW=-1;let lines=0;const lang=langOf(path);
 // mesureur de lignes visuelles (même police / hauteur de ligne que l'éditeur), pour
 // garder le gutter aligné quand le retour à la ligne est actif.
 const meas=document.createElement('span');meas.style.cssText='position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;padding:0;border:0;margin:0';document.body.appendChild(meas);
 const lh=()=>ST.editor.fs+7;
 const visLines=line=>{meas.textContent=line.length?line:' ';return Math.max(1,Math.round(meas.offsetHeight/lh()))};
 const paint=()=>{hlE.innerHTML=hl(ta.value,lang);const src=ta.value.split('\n');const n=src.length;
  if(wrap){if(wrapW!==hlE.clientWidth){wrapW=hlE.clientWidth;meas.style.font=getComputedStyle(hlE).font;meas.style.width=Math.max(1,hlE.clientWidth-24)+'px'}
   let out='';for(let i=0;i<n;i++)out+=(i+1)+'\n'.repeat(visLines(src[i])-1)+(i<n-1?'\n':'');gut.textContent=out}
  else if(n!==lines){lines=n;gut.textContent=Array.from({length:n},(_,i)=>i+1).join('\n')}
  hlE.scrollTop=ta.scrollTop;hlE.scrollLeft=ta.scrollLeft;gut.scrollTop=ta.scrollTop};
 let raf=0;const paintSoon=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(paint)};
 ta.value=f.c;paint();
 ta.addEventListener('input',()=>{f.c=ta.value;S.unsaved.add(path);$$('.tab').forEach(t=>{if(t.dataset.p===path)t.classList.add('mod')});touch();paintSoon();pbSoon()});
 ta.addEventListener('scroll',()=>{hlE.scrollTop=ta.scrollTop;hlE.scrollLeft=ta.scrollLeft;gut.scrollTop=ta.scrollTop});
 ta.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.ctrlKey&&!e.altKey){e.preventDefault();ins(' '.repeat(ST.editor.tab))}else if(e.key==='Enter'&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){const v=ta.value,s=ta.selectionStart,ls=v.lastIndexOf('\n',s-1)+1,line=v.slice(ls,s),ind=line.match(/^\s*/)[0];if(ind||/[{(\[]\s*$/.test(line)){e.preventDefault();ins('\n'+ind+(/[{(\[]\s*$/.test(line)?' '.repeat(ST.editor.tab):''))}}});
 function ins(t){ta.focus();if(!(document.execCommand&&document.execCommand('insertText',false,t))){const s=ta.selectionStart;ta.setRangeText(t,s,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}}
 const ps=S.pos[path];if(ps){ta.scrollTop=ps.top;ta.scrollLeft=ps.left;ta.setSelectionRange(ps.s,ps.e);paint()}
 $('#fq').addEventListener('input',()=>findNext(0));$('#fq').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findNext(e.shiftKey?-1:1)}else if(e.key==='Escape')A.findClose()})}
function gotoLine(n){const ta=$('#ta');if(!ta)return;const L=ta.value.split('\n');let s=0;for(let i=0;i<n-1&&i<L.length;i++)s+=L[i].length+1;ta.focus();ta.setSelectionRange(s,s+(L[n-1]||'').length);ta.scrollTop=Math.max(0,(n-6)*(ST.editor.fs+7))}
function findNext(d){const ta=$('#ta'),q=$('#fq')?.value;if(!ta||!q)return;const v=ta.value.toLowerCase(),ql=q.toLowerCase();let count=0,i=-1;while((i=v.indexOf(ql,i+1))>=0)count++;$('#fcount').textContent=count+' résultat(s)';let from=d>=0?(d===0?ta.selectionStart:ta.selectionEnd):ta.selectionStart-1,idx=d>=0?v.indexOf(ql,from):v.lastIndexOf(ql,from);if(idx<0)idx=d>=0?v.indexOf(ql):v.lastIndexOf(ql);if(idx<0)return;ta.setSelectionRange(idx,idx+q.length);const line=v.slice(0,idx).split('\n').length;ta.scrollTop=Math.max(0,(line-6)*(ST.editor.fs+7))}
const pbSoon=debounce(()=>{if(S.bt==='problems')renderBottom();else updateBadge()},600);

/* ===== 09-onglets.js ===== */
/* ============ onglets ============ */
function renderTabs(){const t=$('#tabs');if(!t)return;t.innerHTML=S.tabs.map(p=>`<div class="tab${p===S.active?' on':''}${S.unsaved.has(p)?' mod':''}" data-act="tab" data-p="${esc(p)}" title="${esc(p)}">${esc(p.split('/').pop())}<span class="dot"></span><button class="ib" data-act="closeTab" data-p="${esc(p)}" title="Fermer">${ico('x')}</button></div>`).join('')}

/* ===== 10-explorateur-panneau-droit.js ===== */
/* ============ explorateur / panneau droit ============ */
function treeOf(files){const root={d:{},f:[]};for(const p of Object.keys(files).sort()){const parts=p.split('/');let n=root;for(let i=0;i<parts.length-1;i++){const k=parts[i];n=n.d[k]=n.d[k]||{d:{},f:[],path:parts.slice(0,i+1).join('/')}}n.f.push(p)}return root}
function treeHTML(n,depth){let o='';for(const k of Object.keys(n.d).sort()){const d=n.d[k],open=!S.collapsed.has(d.path);o+=`<div class="row" style="padding-left:${6+depth*14}px" data-act="toggle" data-p="${esc(d.path)}" data-dir="${esc(d.path)}"><span class="tw">${open?'▾':'▸'}</span>${esc(k)}</div>`;if(open)o+=treeHTML(d,depth+1)}for(const p of n.f.sort()){o+=`<div class="row${p===S.active?' on':''}" style="padding-left:${22+depth*14}px" data-act="openFile" data-p="${esc(p)}" data-path="${esc(p)}">${esc(p.split('/').pop())}</div>`}return o}
function renderSide(onlyIfFiles){const sb=$('#sidebody');if(!sb)return;if(onlyIfFiles&&!['files','assets','scene'].includes(S.rt))return;const p=S.project;
 const tabs=[['files','Fichiers'],['scene','Scène'],['assets','Ressources']];if(S.rt==='search')tabs.push(['search','Recherche']);if(S.rt==='history')tabs.push(['history','Historique']);
 $('#shbar').innerHTML=tabs.map(([t,l])=>`<button class="${t===S.rt?'on':''}" data-act="sideBtn" data-t="${t}">${l}</button>`).join('');
 if(S.rt==='files'){sb.innerHTML=`<div class="sbar"><span class="t">${esc(p.name)}</span><button class="ib" data-act="newFile" title="Nouveau fichier">${ico('plus')}</button><button class="ib" data-act="importHere" title="Importer des fichiers">${ico('dl')}</button></div><div data-drop="files" style="min-height:80%">${treeHTML(treeOf(p.files),0)}</div>`}
 else if(S.rt==='scene')renderScene(sb);
 else if(S.rt==='search'){sb.innerHTML=`<div class="sbar"><input class="inp" id="gq" style="flex:1" placeholder="Rechercher dans le projet" value="${esc(S.q)}"></div><div id="gres"></div>`;const gq=$('#gq');gq.oninput=()=>{S.q=gq.value;runSearch()};gq.onkeydown=e=>{if(e.key==='Enter')runSearch()};runSearch()}
 else if(S.rt==='assets'){sb.innerHTML=`<div class="sbar"><span class="t">Ressources du projet</span><button class="ib" data-act="importAssets" title="Importer">${ico('plus')}</button></div><div class="mini" data-drop="files">${assetsHTML(p,true)}</div>`}
 else if(S.rt==='history'){const h=[...p.history].reverse();sb.innerHTML=h.length?h.map(e=>`<div class="hent"><div><b>${esc(e.prompt.slice(0,70)||'Modification')}</b></div><div class="t">${fmtDate(e.t)}, ${e.changes.length} fichier(s)</div><div class="a"><button class="btn sm" data-act="diff" data-h="${e.id}">Voir</button><button class="btn sm" data-act="revert" data-h="${e.id}">Annuler</button></div></div>`).join(''):'<div class="empty">Aucune modification de l\'IA pour le moment.</div>'}}
/* scène : objets et propriétés, écrits dans scene.json */
function getScene(p){const f=p.files['scene.json'];if(!f||f.t!=='text')return null;try{const d=JSON.parse(f.c);if(!d||!Array.isArray(d.objects))return{err:'scene.json doit contenir un tableau « objects ».'};return{d}}catch(e){return{err:'scene.json est invalide : '+e.message}}}
const reloadSoon=debounce(()=>{if(S.view==='workspace'&&ST.layout.mode!=='code')runGame()},600);
function writeScene(d){const p=S.project;p.files['scene.json']={t:'text',c:JSON.stringify(d,null,2)+'\n'};touch();if(S.active==='scene.json')renderEditor();reloadSoon()}
const OTYPES={rect:['Rectangle','▭'],circle:['Cercle','●'],box:['Cube','■'],sphere:['Sphère','◍'],plane:['Plan','▱']};
function olistHTML(d){return d.objects.length?d.objects.map(o=>`<div class="row${o.id===S.sel?' on':''}" style="padding-left:12px" data-act="objSel" data-id="${esc(o.id)}"><span class="tw">${(OTYPES[o.type]||['','?'])[1]}</span>${esc(o.name||o.id)}<span class="dim" style="margin-left:auto">${esc((OTYPES[o.type]||[o.type])[0])}</span></div>`).join(''):'<div class="empty">La scène est vide. Ajoute un objet avec le bouton +.</div>'}
function inspHTML(d){const o=d.objects.find(x=>x.id===S.sel);if(!o)return '<div class="dim" style="padding:4px 0">Sélectionne un objet pour modifier ses propriétés.</div>';
 const num=(k,v,i)=>`<input class="inp" type="number" step="any" data-sc="${k}"${i!==undefined?` data-ix="${i}"`:''} value="${v}">`;const vec=(k,l)=>{const a=Array.isArray(o[k])?o[k]:[0,0,0];return `<div class="pr"><label>${l}</label><div class="vec">${[0,1,2].map(i=>num(k,a[i]??0,i)).join('')}</div></div>`};
 const pr=(l,h)=>`<div class="pr"><label>${l}</label>${h}</div>`;const sel=(k,opts)=>`<select class="inp" data-sc="${k}">${opts.map(([v,t])=>`<option value="${v}"${(o[k]||'')===v?' selected':''}>${t}</option>`).join('')}</select>`;
 let h=pr('Nom',`<input class="inp" data-sc="name" value="${esc(o.name||'')}">`)+pr('Type',`<span class="dim">${esc((OTYPES[o.type]||[o.type])[0])}</span>`);
 if(S.project.type==='3d')h+=vec('position','Position')+vec('rotation','Rotation (°)')+vec('scale','Échelle')+pr('Couleur',`<input class="inp" type="color" data-sc="color" value="${esc(o.color||'#ffffff')}">`)+pr('Rôle',sel('role',[['','Aucun'],['spin','Rotation continue']]));
 else{h+=pr('x',num('x',o.x??0))+pr('y',num('y',o.y??0));h+=o.type==='circle'?pr('Rayon',num('r',o.r??10)):pr('Largeur',num('w',o.w??10))+pr('Hauteur',num('h',o.h??10));h+=pr('Couleur',`<input class="inp" type="color" data-sc="color" value="${esc(o.color||'#ffffff')}">`)+pr('Rôle',sel('role',[['','Décor'],['solid','Solide'],['player','Joueur'],['item','À ramasser']]))}
 return h+'<div class="dim" style="font-size:11px;margin-top:6px">Chaque modification est écrite dans scene.json et recharge l\'aperçu.</div>'}
function renderScene(sb){const p=S.project,g=getScene(p);
 if(!g){sb.innerHTML=`<div class="sbar"><span class="t">Scène</span></div><div class="empty" style="text-align:left">Ce projet n'a pas de fichier <code>scene.json</code>.<br><br>La liste des objets et leurs propriétés s'appuient sur ce fichier, que le jeu lit avec <code>window.SCENE</code>.<br><br><button class="btn" data-act="sceneCreate">Créer scene.json</button></div>`;return}
 if(g.err){sb.innerHTML=`<div class="sbar"><span class="t">Scène</span></div><div class="empty" style="text-align:left;color:var(--danger)">${esc(g.err)}<br><br><button class="btn" data-act="openFile" data-p="scene.json">Ouvrir scene.json</button></div>`;return}
 const d=g.d;if(S.sel&&!d.objects.find(o=>o.id===S.sel))S.sel=null;
 sb.innerHTML=`<div class="sbar"><span class="t">Objets (${d.objects.length})</span><button class="ib" data-act="objAdd" title="Ajouter un objet">${ico('plus')}</button><button class="ib" data-act="objDup" title="Dupliquer l'objet sélectionné">${ico('copy')}</button><button class="ib" data-act="objDel" title="Supprimer l'objet sélectionné">${ico('trash')}</button></div><div id="olist">${olistHTML(d)}</div><div id="insp">${inspHTML(d)}</div>`}
function sceneEdit(t){const g=getScene(S.project);if(!g||!g.d)return;const o=g.d.objects.find(x=>x.id===S.sel);if(!o)return;const k=t.dataset.sc;let v=t.value;if(t.type==='number'){v=parseFloat(v);if(!Number.isFinite(v))return}
 if(t.dataset.ix!==undefined){const a=Array.isArray(o[k])?[...o[k]]:[0,0,0];a[+t.dataset.ix]=v;o[k]=a}else o[k]=v;writeScene(g.d);if(k==='name'){const l=$('#olist');if(l)l.innerHTML=olistHTML(g.d)}}
function runSearch(){const r=$('#gres');if(!r)return;const q=S.q.trim().toLowerCase();if(q.length<2){r.innerHTML='<div class="empty">Saisis au moins 2 caractères.</div>';return}let n=0,o='';for(const [path,f] of Object.entries(S.project.files)){if(f.t!=='text')continue;const L=f.c.split('\n');for(let i=0;i<L.length&&n<200;i++){const j=L[i].toLowerCase().indexOf(q);if(j>=0){n++;o+=`<div class="sres" data-act="gotoRes" data-p="${esc(path)}" data-l="${i+1}"><b>${esc(path)}</b>:${i+1}  ${esc(L[i].trim().slice(0,90))}</div>`}}}r.innerHTML=o||'<div class="empty">Aucun résultat.</div>'}

/* ===== 11-ressources.js ===== */
/* ============ ressources ============ */
const TYPES={model3d:['Modèle 3D',['glb','gltf','obj']],image:['Image',['png','jpg','jpeg','webp','gif','svg']],texture:['Texture',['png','jpg','jpeg','webp']],sound:['Son',['wav','ogg','mp3']],music:['Musique',['mp3','ogg','wav']],animation:['Animation',['json','gif','png','glb']]};
function assetsHTML(p,mini){const as=Object.entries(p.files).filter(([,f])=>f.t==='bin');if(!as.length)return '<div class="empty">Aucune ressource. Importe des fichiers (images, sons, modèles…) ou glisse-les ici.</div>';
 const card=([path,f])=>{const m=f.m||'';return `<div class="acard"><div class="th">${m.startsWith('image/')?`<img src="${f.d}" alt="">`:m.startsWith('audio/')?`<audio controls src="${f.d}"></audio>`:`<span class="ext">.${esc(ext(path)||'?')}</span>`}</div><div class="in"><b title="${esc(path)}">${esc(path)}</b><span class="dim">${fmtSize(f.size||0)}</span></div><div class="bt"><button class="ib" data-act="copyPath" data-p="${esc(path)}" title="Copier le chemin">${ico('copy')}</button><button class="ib" data-act="openFile" data-p="${esc(path)}" title="Ouvrir">${ico('files')}</button><button class="ib" data-act="delAsset" data-p="${esc(path)}" title="Supprimer">${ico('trash')}</button></div></div>`};
 return mini?as.map(card).join(''):`<div class="agrid">${as.map(card).join('')}</div>`}
async function validateAsset(a,formats){const e=ext(a.name);const problems=[];if(formats.length&&!formats.includes(e))problems.push(`Format « .${e} » non prévu (attendu : ${formats.join(', ')}).`);
 if(a.t==='bin'&&a.m.startsWith('image/')){const ok=await new Promise(r=>{const i=new Image();i.onload=()=>r(true);i.onerror=()=>r(false);i.src=a.d});if(!ok)problems.push("L'image ne peut pas être décodée (fichier corrompu ?).")}
 else if(a.t==='bin'&&a.m.startsWith('audio/')){const ok=await new Promise(r=>{const au=new Audio();const t=setTimeout(()=>r(true),3000);au.onloadedmetadata=()=>{clearTimeout(t);r(true)};au.onerror=()=>{clearTimeout(t);r(false)};au.src=a.d});if(!ok)problems.push("Le son ne peut pas être lu par le navigateur.")}
 return problems}

/* ===== 12-journaux-problemes-taches.js ===== */
/* ============ journaux, problèmes, tâches ============ */
function computeProblems(p){const out=[],has=x=>!!p.files[x];
 if(!has('index.html'))out.push({s:'err',f:'',t:'index.html est absent : le jeu ne peut pas démarrer.'});
 for(const [path,f] of Object.entries(p.files)){if(f.t!=='text')continue;
  if(ext(path)==='json'){try{JSON.parse(f.c)}catch(e){out.push({s:'err',f:path,t:'JSON invalide : '+e.message})}}
  if(ext(path)==='js'){try{new Function(f.c)}catch(e){out.push({s:'err',f:path,t:'Erreur de syntaxe : '+e.message})}}
  if(ext(path)==='html'){for(const m of f.c.matchAll(/<(?:script[^>]+src|link[^>]+href)=["']([^"']+)["']/gi)){const r=m[1];if(/^(https?:)?\/\/|^data:/.test(r))continue;if(!has(norm(r)))out.push({s:'err',f:path,t:'Fichier référencé introuvable : '+r})}}
  if(/\.(html|js|css)$/.test(path)){for(const m of f.c.matchAll(/["'`]((?:\.\/)?[\w\-./]+\.(?:png|jpe?g|gif|webp|svg|mp3|wav|ogg|glb|gltf|obj|fbx))["'`]/gi)){if(!has(norm(m[1])))out.push({s:'warn',f:path,t:'Ressource référencée introuvable : '+m[1]})}}}
 for(const t of new Set(S.rtErr))out.push({s:'err',f:'exécution',t});return out}
function updateBadge(){const b=$('#pbadge');if(b&&S.project){const n=computeProblems(S.project).length;b.textContent=n?' ('+n+')':''}}
function renderBottom(){const b=$('#bottomp');if(!b||!S.project)return;const probs=computeProblems(S.project);const errs=probs.filter(x=>x.s==='err');
 const tabs=[['problems','Problèmes',probs.length],['out','Sorties',S.out.length],['console','Console',S.logs.length],['tasks','Tâches IA',S.tasks.length]];let body='';
 if(S.bt==='console')body=S.logs.length?S.logs.map(l=>`<div class="ln ${l.l}">${esc(l.t)}</div>`).join(''):'<div class="empty">La console du jeu est vide. Lance le jeu pour voir ses messages.</div>';
 else if(S.bt==='problems')body=probs.length?probs.map(x=>`<div class="ln ${x.s}">${x.f?`<span class="f">${esc(x.f)} : </span>`:''}${esc(x.t)}</div>`).join(''):'<div class="empty">Aucun problème détecté. Vérifications : index.html, syntaxe JS, JSON, fichiers et ressources référencés, erreurs d\'exécution.</div>';
 else if(S.bt==='out')body=S.out.length?S.out.map(o=>`<div class="ln ${o.l==='err'?'err':o.l==='warn'?'warn':''}"><span class="f">${new Date(o.ts).toLocaleTimeString('fr-FR')} </span>${esc(o.t)}</div>`).join(''):'<div class="empty">Aucune sortie pour le moment.</div>';
 else body=S.tasks.length?[...S.tasks].reverse().map(t=>`<div class="ln ${t.st==='err'?'err':''}">${fmtDate(t.ts)}, ${t.st==='run'?'en cours':t.st==='ok'?'terminé':t.st==='cancel'?'interrompu':'échec'} : ${esc(t.t)}${t.msg?' ('+esc(t.msg)+')':''}</div>`).join(''):'<div class="empty">Aucune tâche IA.</div>';
 b.innerHTML=`<div class="bth">${tabs.map(([k,l,n])=>`<button class="t${S.bt===k?' on':''}" data-act="bt" data-t="${k}">${l}${k==='problems'?`<span id="pbadge">${n?' ('+n+')':''}</span>`:n?' ('+n+')':''}</button>`).join('')}<div class="sp"></div>${errs.length&&!S.busy?`<button class="btn sm" data-act="fixErrors">Demander à l'IA de corriger</button>`:''}${S.bt==='console'?`<button class="ib" data-act="clearLogs" title="Effacer la console">${ico('trash')}</button>`:''}<button class="ib" data-act="cmd" data-c="toggleBottom" title="Fermer le panneau">${ico('x')}</button></div><div class="bbody" id="bbody">${body}</div>`;
 const bb=$('#bbody');if(S.bt==='console'||S.bt==='out')bb.scrollTop=bb.scrollHeight}
const bump=debounce(()=>{if(ST.layout.bottom&&S.view==='workspace')renderBottom()},120);
addEventListener('message',e=>{const fr=$('#pvframe');if(!fr||e.source!==fr.contentWindow)return;const d=e.data;if(!d||d.studio!==1)return;S.logs.push({l:d.l,t:d.t});if(S.logs.length>500)S.logs.shift();if(d.l==='error'){S.rtErr.push(d.t);if(!ST.layout.bottom){ST.layout.bottom=true;S.bt='console';applyLayout()}}bump()});

/* ===== 13-execution-du-jeu.js ===== */
/* ============ exécution du jeu ============ */
const HOOK='<script>(function(){var P=function(l,a){try{parent.postMessage({studio:1,l:l,t:Array.prototype.map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){P(k==="info"?"log":k,arguments);o.apply(console,arguments)}});addEventListener("error",function(e){P("error",[e.message+" ("+String(e.filename||"").split("/").pop()+":"+e.lineno+")"])});addEventListener("unhandledrejection",function(e){P("error",["Promise rejetée : "+(e.reason&&e.reason.message||e.reason)])})})()<\/script>';
function buildGame(p,hook=true){let html=p.files['index.html']?.c;if(html==null)return '<body style="font-family:sans-serif;padding:20px">index.html est introuvable dans ce projet.</body>';
 const text=x=>{const f=p.files[norm(x)];return f&&f.t==='text'?f.c:null};
 html=html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi,(m,h)=>{if(!/stylesheet/i.test(m))return m;const c=text(h);return c!=null?'<style>'+c+'</style>':m});
 html=html.replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi,(m,a,s,b)=>{const c=text(s);return c!=null?`<script${a}${b}>${c.replace(/<\/script/gi,'<\\/script')}<\/script>`:m});
 for(const [path,f] of Object.entries(p.files)){if(f.t!=='bin')continue;html=html.split('./'+path).join(path).split(path).join(f.d)}
 let sc={objects:[]};const g=getScene(p);if(g&&g.d)sc=g.d;
 const inj=(hook?HOOK:'')+'<script>window.SCENE='+JSON.stringify(sc).replace(/</g,'\\u003c')+';<\/script>';
 return /<head[^>]*>/i.test(html)?html.replace(/<head[^>]*>/i,m=>m+inj):inj+html}
async function runGame(){
  if(S.view!=='workspace')return;
  if(S.project?.type==='godot'){
    const s=$('#pvstatus');if(s)s.textContent='Exécution (Godot 4)';
    if(window.electronAPI?.engine){
      logOut('Lancement du projet avec Godot Engine 4...','info');
      const res=await window.electronAPI.engine.runGodot(S.project.id,S.project);
      if(!res.ok){toast(res.error,'err');logOut(res.error,'err');if(s)s.textContent='Erreur Godot'}
      else{toast('Projet Godot 4 lancé en arrière-plan. Journaux dans la console.');if(!ST.layout.bottom){ST.layout.bottom=true;S.bt='console';applyLayout()}}
    }else{
      toast("L'exécution de Godot nécessite le logiciel de bureau.",'warn');
    }
    return;
  }
  if(ST.layout.mode==='code'){ST.layout.mode='split';applyLayout()}
  const fr=$('#pvframe');if(!fr)return;S.logs=[];S.rtErr=[];fr.srcdoc=buildGame(S.project);const s=$('#pvstatus');if(s)s.textContent='Exécution';if(ST.layout.bottom)renderBottom()
}
function stopGame(){
  if(S.project?.type==='godot'&&window.electronAPI?.engine){
    window.electronAPI.engine.stopGodot();
    logOut('Processus Godot arrêté.','info');
  }
  const fr=$('#pvframe');if(fr)fr.srcdoc='';const s=$('#pvstatus');if(s)s.textContent='Arrêté'
}
function exportHtml(){const b=new Blob([buildGame(S.project,false)],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=safeName(S.project.name)+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Jeu exporté en HTML autonome.')}

/* ===== 14-fournisseurs-d-ia.js ===== */
/* ============ fournisseurs d'IA ============ */
function redact(t){let o=String(t);for(const k of Object.keys(ST.p)){const key=ST.p[k].key;if(key&&key.length>5)o=o.split(key).join('***')}return o}
class HttpErr extends Error{constructor(s,b){super(redact('HTTP '+s+(b?' : '+b.slice(0,300):'')));this.status=s}}
async function jf(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new HttpErr(r.status,await r.text().catch(()=>''));return r.json()}
const AH=k=>({'x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'});
async function* lines(res){const rd=res.body.getReader(),d=new TextDecoder();let buf='';for(;;){const {done,value}=await rd.read();if(done)break;buf+=d.decode(value,{stream:true});let i;while((i=buf.indexOf('\n'))>=0){const l=buf.slice(0,i).trim();buf=buf.slice(i+1);if(l)yield l}}if(buf.trim())yield buf.trim()}
function normalizeMsgs(m){const o=[];for(const x of m){if(!x.content)continue;if(o.length&&o[o.length-1].role===x.role)o[o.length-1].content+='\n\n'+x.content;else o.push({role:x.role,content:x.content})}while(o.length&&o[0].role!=='user')o.shift();return o}
async function* streamChat(k,system,msgs,signal,hp){hp=hp||{};const c=ST.p[k];
 if(k==='ollama'){const res=await fetch(c.base.replace(/\/$/,'')+'/api/chat',{method:'POST',signal,body:JSON.stringify({model:c.model,stream:true,options:{num_ctx:ST.numCtx,...(hp.temperature!=null?{temperature:hp.temperature}:{}),...(hp.topP!=null?{top_p:hp.topP}:{})},messages:[{role:'system',content:system},...msgs]})});if(!res.ok)throw new HttpErr(res.status,await res.text().catch(()=>''));for await(const l of lines(res)){const j=JSON.parse(l);if(j.error)throw new Error(j.error);if(j.message?.content)yield j.message.content;if(j.done)break}}
 else if(k==='openai'||k==='lmstudio'){const res=await fetch(c.base.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(c.key||'lm-studio')},body:JSON.stringify({model:c.model,stream:true,...(hp.temperature!=null?{temperature:hp.temperature}:{}),...(hp.topP!=null?{top_p:hp.topP}:{}),...(hp.freqPenalty!=null?{frequency_penalty:hp.freqPenalty}:{}),...(hp.presPenalty!=null?{presence_penalty:hp.presPenalty}:{}),messages:[{role:'system',content:system},...msgs]})});if(!res.ok)throw new HttpErr(res.status,await res.text().catch(()=>''));for await(const l of lines(res)){if(!l.startsWith('data:'))continue;const v=l.slice(5).trim();if(!v||v==='[DONE]')continue;const j=JSON.parse(v);if(j.error)throw new Error(j.error.message||'Erreur du fournisseur');const t=j.choices?.[0]?.delta?.content;if(t)yield t}}
 else if(k==='anthropic'){const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal,headers:{'Content-Type':'application/json',...AH(c.key)},body:JSON.stringify({model:c.model,max_tokens:ST.maxTok,stream:true,system,messages:msgs,...(hp.temperature!=null?{temperature:hp.temperature}:{}),...(hp.topP!=null?{top_p:hp.topP}:{})})});if(!res.ok)throw new HttpErr(res.status,await res.text().catch(()=>''));for await(const l of lines(res)){if(!l.startsWith('data:'))continue;const j=JSON.parse(l.slice(5));if(j.type==='error')throw new Error(j.error?.message||'Erreur Anthropic');if(j.type==='content_block_delta'&&j.delta?.text)yield j.delta.text}}
 else{const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(c.model)+':streamGenerateContent?alt=sse',{method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':c.key},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},generationConfig:{maxOutputTokens:ST.maxTok,...(hp.temperature!=null?{temperature:hp.temperature}:{}),...(hp.topP!=null?{topP:hp.topP}:{})},contents:msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))})});if(!res.ok)throw new HttpErr(res.status,await res.text().catch(()=>''));for await(const l of lines(res)){if(!l.startsWith('data:'))continue;const j=JSON.parse(l.slice(5));const t=j.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('');if(t)yield t}}}
function friendlyError(e,k){const n=PROV[k].name;if(e.name==='AbortError')return 'Interrompu.';if(e instanceof HttpErr){if(e.status===401||e.status===403)return `${n} : clé API refusée (${e.status}). Vérifie la clé dans les paramètres.`;if(e.status===404)return `${n} : modèle ou adresse introuvable (404). Vérifie le nom du modèle${k==='ollama'?" (l'as-tu téléchargé avec « ollama pull » ?)":''}.`;if(e.status===429)return `${n} : limite de requêtes atteinte (429). Réessaie plus tard.`;return `${n} : ${e.message}`}
 if(e instanceof TypeError)return `${n} : connexion impossible. ${k==='ollama'?"Ollama est-il lancé ? Démarre-le avec OLLAMA_ORIGINS=* pour autoriser cette page, et vérifie l'adresse dans les paramètres.":"Vérifie ta connexion Internet ; si tu utilises un fournisseur compatible, il doit autoriser les appels depuis un navigateur (CORS)."}`;return `${n} : ${redact(e.message)}`}
async function testProvider(k){const c=ST.p[k],ac=new AbortController(),to=setTimeout(()=>ac.abort(),10000);S.tests[k]={st:'run'};renderTestUI(k);
 try{let models=[];
  if(k==='ollama'){const r=await jf(c.base.replace(/\/$/,'')+'/api/tags',{signal:ac.signal});models=(r.models||[]).map(m=>m.name)}
  else if(k==='openai'||k==='lmstudio'){const r=await jf(c.base.replace(/\/$/,'')+'/models',{headers:{Authorization:'Bearer '+(c.key||'lm-studio')},signal:ac.signal});models=(r.data||[]).map(m=>m.id)}
  else if(k==='anthropic'){const r=await jf('https://api.anthropic.com/v1/models?limit=100',{headers:AH(c.key),signal:ac.signal});models=(r.data||[]).map(m=>m.id)}
  else{const r=await jf('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',{headers:{'x-goog-api-key':c.key},signal:ac.signal});models=(r.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>m.name.replace(/^models\//,''))}
  let st='ok',msg=`Connexion réussie, ${models.length} modèle(s) disponible(s).`;
  if(!models.length){st='warn';msg=k==='ollama'?"Ollama répond mais aucun modèle n'est installé. Télécharge-en un, par exemple : ollama pull <nom-du-modèle>.":'Connexion réussie mais aucune liste de modèles renvoyée : saisis le nom du modèle à la main.'}
  else if(c.model&&!models.includes(c.model)&&!models.includes(c.model+':latest')){st='warn';msg+=` Attention : « ${c.model} » n'est pas dans la liste.`}
  S.tests[k]={st,msg,models}}
 catch(e){S.tests[k]={st:'err',msg:e.name==='AbortError'?'Délai dépassé (10 s).':friendlyError(e,k),models:[]}}
 clearTimeout(to);renderTestUI(k)}
function renderTestUI(k){const t=S.tests[k],el=$('#st-'+k);if(!el)return;if(!t){el.innerHTML='';return}if(t.st==='run'){el.className='stt dim';el.textContent='Test en cours…';return}el.className='stt '+t.st;el.textContent=t.msg;const ml=$('#ml-'+k);if(ml)ml.innerHTML=(t.models||[]).slice(0,40).map(m=>`<button class="xchip" data-act="pickModel" data-k="${k}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}

/* ===== 15-agent-ia.js ===== */
/* ============ agent IA ============ */
function sysPrompt(p){return `Tu es l'assistant de développement intégré à « Studio », un éditeur de jeux vidéo. Tu travailles directement sur les fichiers du projet de l'utilisateur.

MOTEUR : jeu HTML5 exécuté dans un iframe. ${p.type==='3d'?'Projet 3D : utilise Three.js r128 chargé par une balise script vers cdnjs.cloudflare.com (connexion Internet nécessaire ; pas de OrbitControls ni de modules ES).':'Projet 2D : Canvas et JavaScript.'}
Règles techniques : scripts classiques uniquement (pas d'import/export ES entre fichiers), fichiers référencés par chemin relatif depuis index.html, aucune bibliothèque externe hors cdnjs.cloudflare.com, point d'entrée index.html.

SCÈNE : si le fichier scene.json existe, il décrit les objets de la scène et le studio l'injecte dans le jeu sous window.SCENE avant les scripts. Fais lire cette variable par game.js au lieu de coder les objets en dur, et quand tu ajoutes un objet de décor ou de gameplay, ajoute-le aussi dans scene.json (id unique) pour qu'il apparaisse dans la hiérarchie du studio.
Format 2D : {"version":1,"mode":"2d","objects":[{"id":"o1","name":"Sol","type":"rect","x":0,"y":400,"w":800,"h":50,"color":"#2b2b31","role":"solid"}]} avec type rect (x,y,w,h) ou circle (x,y,r), role parmi solid, player, item ou vide.
Format 3D : objets {"id","name","type":"box|sphere|plane","position":[x,y,z],"rotation":[x,y,z] en degrés,"scale":[x,y,z],"color":"#rrggbb","role":"spin ou vide"}.

FORMAT DE RÉPONSE :
- Explique brièvement en français ce que tu fais, puis écris chaque fichier créé ou modifié ainsi :
<file path="chemin/fichier.ext">
contenu COMPLET du fichier
</file>
- Toujours le contenu complet du fichier, jamais d'extraits ni de « ... ». N'écris que les fichiers qui changent. Ne mets pas de blocs markdown à l'intérieur des balises file.
- Pour supprimer un fichier : <delete path="chemin"/>
- Si une ressource (modèle 3D, image, texture, son, musique, animation) est indispensable et absente de la liste des fichiers : <need_resource type="model3d|image|texture|sound|music|animation" name="nom_sans_extension" usage="à quoi elle sert" formats="glb,gltf" specs="caractéristiques souhaitées"/>. Fais fonctionner le jeu sans elle en attendant (forme dessinée en code, son optionnel) et considère-la indisponible tant qu'elle n'apparaît pas dans la liste des fichiers.
- N'affirme jamais qu'un test a réussi : tu ne peux pas exécuter le jeu. Dis ce que tu as écrit et ce que l'utilisateur doit vérifier.
- DÉLÉGATION À DES SOUS-AGENTS (optionnelle) : si la demande est complexe et se décompose en plusieurs métiers indépendants (ex. « crée un jeu de plateforme avec du son et une doc »), tu peux confier une partie à un sous-agent spécialisé. Écris, là où c'est pertinent :
<agent role="code|design|world|art|test|doc" title="titre très court">consigne précise et autonome, comme si tu la donnais à un collègue qui ne voit que le projet</agent>
Le sous-agent travaille sur le projet à jour et ses fichiers sont appliqués comme les tiens ; son avancement s'affiche dans la conversation. Rôles : code (programmation), design (mécaniques/règles), world (scène/niveau via scene.json), art (ressources : images/sons, via need_resource — il ne génère pas de binaires), test (débogage), doc (fichiers .md). Ne délègue QUE si c'est utile ; pour une modification simple, écris les fichiers toi-même. Ne mets pas de <agent> à l'intérieur d'un <file>.
- Ne modifie que les fichiers du projet. Reste concis.`}
function projCtx(p,limit){let used=0,omitted=0,o='FICHIERS DU PROJET :\n';const ks=Object.keys(p.files).sort((a,b)=>a==='index.html'?-1:b==='index.html'?1:a.localeCompare(b));
 for(const k of ks){const f=p.files[k];o+=f.t==='bin'?`- ${k} (ressource binaire, ${f.m||'?'}, ${fmtSize(f.size||0)})\n`:`- ${k} (${f.c.length} caractères)\n`}
 o+='\nCONTENU DES FICHIERS TEXTE :\n';
 for(const k of ks){const f=p.files[k];if(f.t!=='text')continue;const blk=`<file path="${k}">\n${f.c}\n</file>\n`;if(used+blk.length>limit){omitted++;o+=`<file path="${k}">[contenu omis : limite de contexte atteinte]</file>\n`;continue}used+=blk.length;o+=blk}
 return{text:o,omitted}}
function attrs(s){const o={};for(const m of s.matchAll(/(\w+)="([^"]*)"/g))o[m[1]]=m[2];return o}
function parseAI(raw){const files=[],dels=[],needs=[],agents=[];let text=raw,partial=null;
 text=text.replace(/<file\s+path="([^"]+)"\s*>\n?([\s\S]*?)<\/file>/g,(m,p,c)=>{c=c.replace(/\n$/,'');const fm=c.match(/^```[\w+-]*\n([\s\S]*?)\n?```\s*$/);if(fm)c=fm[1];files.push({path:p,content:c});return '\u0000F'+(files.length-1)+'\u0000'});
 const pi=text.search(/<file\s+path="[^"]+"\s*>/);if(pi>=0){partial=(text.slice(pi).match(/path="([^"]+)"/)||[])[1];text=text.slice(0,pi)+'\u0000P'+partial+'\u0000'}
 text=text.replace(/<agent\s+([^>]*?)>\s*([\s\S]*?)\s*<\/agent>/g,(m,a,brief)=>{const at=attrs(a);agents.push({role:at.role||'code',title:at.title||'Sous-tâche',brief:brief.trim()});return '\u0000A'+(agents.length-1)+'\u0000'});
 text=text.replace(/<delete\s+path="([^"]+)"\s*\/?>/g,(m,p)=>{dels.push(p);return '\u0000D'+(dels.length-1)+'\u0000'});
 text=text.replace(/<need_resource\s+([^>]*?)\/?>/g,(m,a)=>{needs.push(attrs(a));return ''});
 return{text:text.trim(),files,dels,needs,agents,partial}}
function md(t){return t.split('```').map((s,i)=>i%2?`<pre class="code">${esc(s.replace(/^[\w+-]*\n/,''))}</pre>`:esc(s).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')).join('')}
function aiBody(m){const P=parseAI(m.raw||'');let h=md(P.text).replace(/\u0000F(\d+)\u0000/g,(x,i)=>`<span class="chip">✎ ${esc(P.files[i].path)}</span>`).replace(/\u0000D(\d+)\u0000/g,(x,i)=>`<span class="chip">✗ ${esc(P.dels[i])}</span>`).replace(/\u0000P([^\u0000]*)\u0000/g,(x,n)=>`<span class="chip">✎ écriture de ${esc(n)}…</span>`).replace(/\u0000A(\d+)\u0000/g,(x,i)=>agentChip(P.agents[i]));
 if(m.streaming)h+=`<div class="dim" style="margin-top:6px;font-size:12px">${esc(m.phase||'En cours')}…</div>`;return h}
const AGENT_LABEL={code:'Programmation',design:'Conception',world:'Monde & scènes',art:'Graphisme',test:'Test',doc:'Documentation'};
function agentChip(a){if(!a)return'';const st=a._st||'pending';const cls=st==='done'?'ok':st==='run'?'run':st==='err'?'err':st==='cancel'?'cancel':'';const dot=st==='done'?'✓':st==='run'?'●':st==='err'?'✕':st==='cancel'?'⊘':'◇';return `<span class="chip ag ${cls}">${dot} ${esc(AGENT_LABEL[a.role]||a.role)} : ${esc(a.title)}</span>`}
function msgHTML(m,i){const p=S.project;
 if(m.role==='user')return `<div class="msg user"><div class="who">Vous</div><div>${esc(m.text).replace(/\n/g,'<br>')}</div>${m.atts?.length?`<div class="atts" style="padding:6px 0 0">${m.atts.map(a=>`<span class="att">${esc(a)}</span>`).join('')}</div>`:''}</div>`;
 let h=`<div class="msg ai" data-i="${i}"><div class="who"><b>Assistant</b><span>${esc(m.model||'')}</span></div><div class="body">${aiBody(m)}</div>`;
 if(m.changes?.length)h+=`<div class="chg">${m.changes.map((c,ci)=>`<div class="r"><span class="n">${esc(c.path)}</span>${c.deleted?'<span class="mn">supprimé</span>':c.isNew?'<span class="pl">nouveau</span>':''}<span class="pl">+${c.add}</span><span class="mn">−${c.del}</span><button class="btn sm" data-act="diff" data-h="${m.hid}" data-i="${ci}">Voir</button></div>`).join('')}<div class="r"><span class="n dim">Modifications appliquées au projet</span><button class="btn sm" data-act="revert" data-h="${m.hid}">Annuler</button></div></div>`;
 if(m.note)h+=`<div class="note">${esc(m.note)}</div>`;
 if(m.verify)h+=`<div class="verify${m.verify.bad.length?' bad':''}">${m.verify.bad.length?`Vérification automatique : ${m.verify.bad.length} problème(s) détecté(s).<br>${m.verify.bad.map(esc).join('<br>')}<div style="margin-top:6px"><button class="btn sm" data-act="fixProbs" data-i="${i}">Demander à l'IA de corriger</button></div>`:"Vérification automatique : aucune erreur de syntaxe ni fichier manquant. Le jeu n'a pas été exécuté par l'IA : teste le résultat dans l'aperçu."}</div>`;
 for(const [ni,n] of (m.needs||[]).entries())h+=needHTML(i,ni,n);
 if(m.error)h+=`<div class="err">${esc(m.error)}</div><div style="margin-top:6px"><button class="btn sm" data-act="retry" data-i="${i}">Réessayer</button></div>`;
 return h+'</div>'}
function needHTML(mi,ni,n){const T=TYPES[n.type]||['Fichier',[]];const fm=(n.formats?n.formats.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean):T[1]);n._f=fm;
 const existing=Object.entries(S.project.files).filter(([p,f])=>f.t==='bin'&&(!fm.length||fm.includes(ext(p))));
 const state=n.state==='done'?`<span class="pl">✓ Fournie : ${esc(n.file)}</span>`:n.state==='skipped'?'<span class="dim">Ignorée</span>':'<span style="color:var(--warn)">En attente — non disponible dans le projet</span>';
 return `<div class="need ${n.state||''}" data-drop="need" data-m="${mi}" data-n="${ni}"><div class="nh">Ressource nécessaire : ${esc(T[0])}${n.name?' — '+esc(n.name):''}</div><dl><dt>Utilisation</dt><dd>${esc(n.usage||'non précisée')}</dd><dt>Formats</dt><dd>${fm.length?fm.map(x=>'.'+esc(x)).join(', '):'libres'}</dd>${n.specs?`<dt>Caractéristiques</dt><dd>${esc(n.specs)}</dd>`:''}<dt>État</dt><dd>${state}</dd></dl>${n.state?'':`<div class="na"><button class="btn sm pri" data-act="needImport" data-m="${mi}" data-n="${ni}">${ico('dl')} Importer un fichier</button>${existing.length?`<select class="inp" data-act="needPick" data-m="${mi}" data-n="${ni}"><option value="">Utiliser un fichier du projet…</option>${existing.map(([p])=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>`:''}<button class="btn sm ghost" data-act="needSkip" data-m="${mi}" data-n="${ni}">Ignorer</button></div><div class="dim" style="padding:0 10px 8px;font-size:11px">Tu peux aussi glisser-déposer le fichier sur ce cadre.</div>`}</div>`}
function renderChat(force=false){const b=$('#chatmsgs');if(!b)return;const near=b.scrollHeight-b.scrollTop-b.clientHeight<80,top=b.scrollTop;const c=S.project.chat;b.innerHTML=c.length?c.map(msgHTML).join(''):'<div class="empty">Décris ce que tu veux créer ou modifier.<br>L\'IA lit les fichiers du projet et les modifie directement.</div>';b.scrollTop=(force||near)?b.scrollHeight:top}
let streamRaf=0;function paintStream(m){if(streamRaf)return;streamRaf=requestAnimationFrame(()=>{streamRaf=0;const b=$('#chatmsgs'),el=b&&$('.msg.ai:last-child .body',b);if(!el)return;const near=b.scrollHeight-b.scrollTop-b.clientHeight<80;el.innerHTML=aiBody(m);if(near)b.scrollTop=b.scrollHeight})}
function squash(raw){return parseAI(raw).text.replace(/\u0000F(\d+)\u0000/g,'[fichier mis à jour]').replace(/\u0000D(\d+)\u0000/g,'[fichier supprimé]').replace(/\u0000A(\d+)\u0000/g,'[sous-agent]').replace(/\u0000P[^\u0000]*\u0000/g,'')}
function addTask(t){const o={id:uid(),t,st:'run',ts:Date.now()};S.tasks.push(o);if(S.tasks.length>50)S.tasks.shift();return o}
function setBusy(b){S.busy=b;const btn=$('#csend');if(btn){btn.dataset.act=b?'chatStop':'chatSend';btn.innerHTML=b?ico('stop')+' Arrêter':ico('send')+' Envoyer'}updateStatus()}
async function commitAtts(p,atts){for(const a of atts){if(a.t==='bin'&&!a.path){a.path=putAsset(p,'assets',a);delete a.d}}}
function setPhase(am,t){am.phase=t;S.phase=t;updateStatus();paintStream(am)}
function logOut(t,l='info'){S.out.push({t,l,ts:Date.now()});if(S.out.length>300)S.out.shift();if(ST.layout.bottom&&S.bt==='out'&&S.view==='workspace')bump()}
async function runAI(text,opt={}){const p=S.project;if(!p||S.busy)return false;const k=ST.active;if(!provOK(k)){toast("Aucun modèle d'IA configuré pour ce fournisseur. Ouvre les paramètres.",'err');return false}
 let full=opt.full,atts=[];
 if(!opt.retry){atts=S.att.splice(0);await commitAtts(p,atts);full=text;for(const a of atts)full+=a.t==='text'?`\n\n[Fichier joint : ${a.name}]\n${a.c}`:`\n\n[Ressource importée dans le projet : ${a.path}]`;p.chat.push({role:'user',text,full,atts:atts.map(a=>a.name),ts:Date.now()});renderAtts()}
 const am={role:'ai',raw:'',streaming:true,phase:'Préparation du contexte du projet',ts:Date.now(),model:ST.p[k].model+' ('+PROV[k].name+')'};p.chat.push(am);renderChat(true);
 const idx=p.chat.indexOf(am);const ctx=projCtx(p,ST.ctx);const task=addTask(text.slice(0,60));
 if(ctx.omitted){task.msg=ctx.omitted+' fichier(s) omis du contexte (limite de caractères)';logOut(task.msg,'warn')}
 const msgs=normalizeMsgs(p.chat.slice(0,idx).slice(-14).filter(m=>m.role==='user'||(m.role==='ai'&&m.raw&&!m.error)).map(m=>m.role==='user'?{role:'user',content:m.full||m.text}:{role:'assistant',content:squash(m.raw)}));
 S.ctl=new AbortController();setBusy(true);setPhase(am,'Attente de la réponse du modèle');logOut('Requête envoyée : '+am.model);
 let failed=null,first=true;
 try{for await(const ch of streamChatResilient(k,(ST.hp&&ST.hp.system?ST.hp.system+'\n\n':'')+sysPrompt(p)+'\n\n'+ctx.text,msgs,S.ctl.signal)){if(first){first=false;setPhase(am,'Génération en cours')}am.raw+=ch;paintStream(am)}}catch(e){failed=e}
 am.streaming=false;setBusy(false);S.ctl=null;
 if(failed){const aborted=failed.name==='AbortError';task.st=aborted?'cancel':'err';const fe=friendlyErrorRich(failed,k);task.msg=aborted?'':fe;if(!aborted){am.error=fe;logOut(fe,'err')}else logOut('Génération interrompue par l\'utilisateur','warn');am.note='Aucune modification appliquée.'}
 else if(!am.raw.trim()){task.st='err';am.error='Réponse vide du modèle.';logOut(am.error,'err')}
 else{setPhase(am,'Application des modifications');const P=parseAI(am.raw);am.agents=P.agents;const r=await applyParsed(am,P,text);task.st='ok';task.msg=r;logOut(r);
  if(am.changes&&am.changes.length){setPhase(am,'Vérification automatique');const bad=computeProblems(p).filter(x=>x.s==='err'&&x.f!=='exécution');am.verify={bad:bad.map(x=>(x.f?x.f+' : ':'')+x.t)};logOut(bad.length?bad.length+' problème(s) détecté(s) après modification':'Vérification automatique : aucun problème détecté',bad.length?'warn':'info')}
  if(P.agents.length){setPhase(am,'Délégation aux sous-agents');logOut(P.agents.length+' sous-agent(s) lancé(s).');await runAgents(am,P.agents);renderSide(true);renderTabs();renderEditor()}}
 am.phase='';S.phase='';
 if(S.project===p){p.chat=p.chat.filter(m=>!(m===am&&!am.raw&&!am.error&&!am.note));touch();renderChat();renderSide(true);renderTabs();renderEditor();updateTop();updateStatus();updateBadge();if(ST.layout.bottom)renderBottom()}else DB.put(p).catch(()=>{});
 return !failed}
async function applyParsed(am,P,prompt){const p=S.project,changes=[];let skipped=0;
 for(const f of P.files){const path=cleanPath(f.path);if(!path){skipped++;continue}const ex=p.files[path];if(ex&&ex.t==='bin'){skipped++;continue}const before=ex?ex.c:null;if(before===f.content)continue;changes.push({path,before,after:f.content})}
 const dels=[];for(const d of P.dels){const path=cleanPath(d);if(path&&p.files[path]&&p.files[path].t==='text')dels.push(path)}
 if(dels.length&&!ST.sec.allowAIDelete){am.note=(am.note?am.note+' ':'')+'Suppression de fichiers par l\'IA désactivée dans les paramètres : '+dels.length+' demande(s) ignorée(s).';dels.length=0}
 if(dels.length){const ok=await modal({title:"L'IA demande de supprimer des fichiers",html:'<p>Fichiers concernés :</p><ul>'+dels.map(d=>`<li><code>${esc(d)}</code></li>`).join('')+"</ul><p class=\"dim\">Tu pourras annuler via l'historique.</p>",ok:'Supprimer',cancel:'Refuser',danger:true});if(ok)for(const d of dels)changes.push({path:d,before:p.files[d].c,after:null});else am.note='Suppression refusée.'}
 for(const c of changes){const d=diffLines(c.before,c.after);c.add=d.filter(x=>x.t==='+').length;c.del=d.filter(x=>x.t==='-').length;c.isNew=c.before===null;c.deleted=c.after===null;if(c.after===null)delete p.files[c.path];else p.files[c.path]={t:'text',c:c.after};if(c.after===null){S.tabs=S.tabs.filter(t=>t!==c.path);if(S.active===c.path)S.active=S.tabs[0]||null}}
 if(changes.length){const h={id:uid(),t:Date.now(),prompt,changes:changes.map(c=>({path:c.path,before:c.before,after:c.after}))};p.history.push(h);if(p.history.length>40)p.history.shift();am.hid=h.id;am.changes=changes.map(c=>({path:c.path,add:c.add,del:c.del,isNew:c.isNew,deleted:c.deleted}));for(const c of changes)if(c.after!==null&&!S.tabs.includes(c.path)&&S.tabs.length<8)S.tabs.push(c.path);if(!S.active)S.active=S.tabs[0]||null;if(S.view==='workspace')setTimeout(runGame,50)}
 if(P.partial)am.note=(am.note?am.note+' ':'')+`Réponse tronquée : le fichier « ${P.partial} » est incomplet et a été ignoré (augmente la limite de tokens dans les paramètres).`;
 if(skipped)am.note=(am.note?am.note+' ':'')+skipped+' fichier(s) ignoré(s) (chemin invalide ou fichier binaire).';
 am.needs=P.needs.map(n=>({...n,state:''}));
 return changes.length+' fichier(s) modifié(s)'+(am.needs.length?', '+am.needs.length+' ressource(s) demandée(s)':'')}
// Sous-agents : exécution RÉELLE. Chaque agent délégué par l'IA principale devient
// un appel modèle distinct (même fournisseur) avec un prompt de rôle spécialisé ;
// ses <file> sont appliqués au projet via applyParsed. L'avancement s'affiche en
// direct dans le message parent (chips), sans interface séparée. Exécution séquentielle
// pour éviter que deux agents n'écrivent le même fichier en parallèle.
const AGENT_ROLE_PROMPT={code:'Tu es un sous-agent DÉVELOPPEUR. Tu écris et modifies du code de jeu (JS/CSS/HTML) sur le projet existant. Réponds au même format de fichiers que l\'assistant principal : <file path="...">contenu complet</file>. Ne modifie que le nécessaire, respecte l\'architecture existante.',
 design:'Tu es un sous-agent CONCEPTION DE JEU. Tu proposes et implémentes des mécaniques, règles et équilibrage. Quand tu modifies des fichiers, utilise le format <file path="...">contenu complet</file>. Reste cohérent avec le genre du projet.',
 world:'Tu es un sous-agent MONDE & SCÈNES. Tu organises la scène et le niveau. Le projet utilise scene.json (injecté sous window.SCENE) : ajoute/modifie les objets dedans avec des ids uniques et fais-les utiliser par game.js. Utilise le format <file path="...">contenu complet</file>.',
 art:'Tu es un sous-agent GRAPHISME & RESSOURCES. Tu prépares les besoins visuels et sonores. Tu ne génères PAS de binaires : pour une ressource manquante, écris <need_resource .../> avec des specs précises, et code une solution de repli (forme dessinée en code). Tu peux créer des fichiers texte (CSS, SVG) si utile.',
 test:'Tu es un sous-agent TEST & DÉBOGAGE. Tu analyses le code et les journaux, trouves les bugs et proposes des corrections sous forme <file path="...">contenu complet</file>. Ne casse pas ce qui fonctionne.',
 doc:'Tu es un sous-agent DOCUMENTATION. Tu rédiges la documentation du projet en Markdown (README.md, commentaires). Utilise <file path="chemin.md">contenu</file>.'};
async function runAgents(am,agents){const p=S.project,k=ST.active;
 if(!agents.length)return;if(!provOK(k)){am.note=(am.note?am.note+' ':'')+'Sous-agents ignorés : aucun modèle configuré.';return}
 for(const a of agents){a._st='run';S.phase='Sous-agent : '+(AGENT_LABEL[a.role]||a.role);updateStatus();paintStream(am);
  const ctl=new AbortController();const prevCtl=S.ctl;S.ctl=ctl;const t=addTask('Agent '+(AGENT_LABEL[a.role]||a.role)+' : '+a.title);
  const ctx=projCtx(p,ST.ctx);const rolePrompt=AGENT_ROLE_PROMPT[a.role]||AGENT_ROLE_PROMPT.code;
  let raw='',failed=null;
  try{for await(const ch of streamChatResilient(k,rolePrompt+'\n\n'+ctx.text,[{role:'user',content:a.brief}],ctl.signal))raw+=ch}
  catch(e){failed=e}
  S.ctl=prevCtl;
  if(failed){const aborted=failed.name==='AbortError';a._st=aborted?'cancel':'err';t.st=aborted?'cancel':'err';if(!aborted){t.msg=friendlyErrorRich(failed,k);logOut('Sous-agent « '+a.title+' » : '+t.msg,'err')}
   if(aborted){for(const rest of agents){if(rest._st!=='done'&&rest._st!=='err'&&rest!==a)rest._st='cancel'}break}}
  else{const P=parseAI(raw);const r=await applyParsed(am,P,'[sous-agent '+(AGENT_LABEL[a.role]||a.role)+'] '+a.title);a._st='done';t.st='ok';t.msg=r;logOut('Sous-agent « '+a.title+' » : '+r);am.agents=P.agents.length?am.agents.concat(P.agents):am.agents}
  paintStream(am)}
 S.phase='';am.phase=''}
async function revertEntry(id){const p=S.project,h=p.history.find(x=>x.id===id);if(!h)return;const r=await modal({title:'Annuler ces modifications',html:`<p>Restaurer ${h.changes.length} fichier(s) tel(s) qu'avant cette demande ? Les modifications faites ensuite sur ces fichiers (par toi ou par l'IA) seront perdues pour ces fichiers. Cette annulation sera elle-même enregistrée dans l'historique.</p><ul>${h.changes.map(c=>`<li><code>${esc(c.path)}</code></li>`).join('')}</ul>`,ok:'Restaurer'});if(!r)return;
 const rev=[];for(const c of h.changes){const cur=p.files[c.path];rev.push({path:c.path,before:cur&&cur.t==='text'?cur.c:null,after:c.before});if(c.before===null)delete p.files[c.path];else p.files[c.path]={t:'text',c:c.before}}
 p.history.push({id:uid(),t:Date.now(),prompt:'Annulation : '+h.prompt.slice(0,50),changes:rev});S.tabs=S.tabs.filter(t=>p.files[t]);if(!p.files[S.active])S.active=S.tabs[0]||null;touch();renderTabs();renderEditor();renderSide();renderChat(false);setTimeout(runGame,50);toast('Modifications annulées.')}
function diffLines(a,b){const A=a==null?[]:a.split('\n'),B=b==null?[]:b.split('\n'),n=A.length,m=B.length;if(n*m>3e6)return[...A.map(s=>({t:'-',s})),...B.map(s=>({t:'+',s}))];
 let s=0;while(s<n&&s<m&&A[s]===B[s])s++;let e=0;while(e<n-s&&e<m-s&&A[n-1-e]===B[m-1-e])e++;
 const a2=A.slice(s,n-e),b2=B.slice(s,m-e),N=a2.length,M=b2.length,L=Array.from({length:N+1},()=>new Uint16Array(M+1));
 for(let i=N-1;i>=0;i--)for(let j=M-1;j>=0;j--)L[i][j]=a2[i]===b2[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const out=A.slice(0,s).map(x=>({t:' ',s:x}));let i=0,j=0;
 while(i<N&&j<M){if(a2[i]===b2[j]){out.push({t:' ',s:a2[i]});i++;j++}else if(L[i+1][j]>=L[i][j+1])out.push({t:'-',s:a2[i++]});else out.push({t:'+',s:b2[j++]})}
 while(i<N)out.push({t:'-',s:a2[i++]});while(j<M)out.push({t:'+',s:b2[j++]});return out.concat(A.slice(n-e).map(x=>({t:' ',s:x})))}
function diffHTML(d){const keep=new Array(d.length).fill(false);d.forEach((x,i)=>{if(x.t!==' ')for(let k=Math.max(0,i-3);k<=Math.min(d.length-1,i+3);k++)keep[k]=true});let o='',gap=0;d.forEach((x,i)=>{if(keep[i]){if(gap){o+=`<div class="g">… ${gap} ligne(s) inchangée(s) …</div>`;gap=0}o+=`<div class="${x.t==='+'?'p':x.t==='-'?'m':''}">${x.t==='+'?'+ ':x.t==='-'?'− ':'  '}${esc(x.s)}</div>`}else gap++});if(gap)o+=`<div class="g">… ${gap} ligne(s) inchangée(s) …</div>`;return o||'<div class="g">Aucune différence.</div>'}
async function showDiff(hid,ci){const h=S.project.history.find(x=>x.id===hid);if(!h)return;const list=ci!==undefined?[h.changes[ci]]:h.changes;await modal({title:'Différences',wide:true,noCancel:true,ok:'Fermer',html:list.map(c=>`<p><code>${esc(c.path)}</code></p><div class="diff">${diffHTML(diffLines(c.before,c.after))}</div>`).join('')})}
async function needFulfill(mi,ni,files){const p=S.project,m=p.chat[mi],n=m?.needs?.[ni];if(!n||n.state)return;const f=files[0];let a;try{a=await readFile(f)}catch(e){toast(e.message,'err');return}
 const probs=await validateAsset(a,n._f||[]);if(probs.length){const r=await modal({title:'Fichier à vérifier',html:'<ul>'+probs.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul><p>Importer quand même ?</p>',ok:'Importer quand même',cancel:'Annuler',danger:true});if(!r)return}
 const e=ext(a.name);const path=putAsset(p,'assets',a,n.name?n.name+'.'+e:a.name);await finishNeed(p,mi,ni,path)}
async function finishNeed(p,mi,ni,path){const n=p.chat[mi].needs[ni];n.state='done';n.file=path;touch();renderChat(false);renderSide(true);const label=(TYPES[n.type]||['Ressource'])[0]+(n.name?' « '+n.name+' »':'');if(S.busy){toast('Ressource enregistrée. Envoie un message pour reprendre le travail.')}else runAI(`J'ai fourni la ressource demandée (${label}) : ${path}. Reprends le travail en l'utilisant.`)}

/* ===== 16-pieces-jointes.js ===== */
/* ============ pièces jointes ============ */
async function addAtts(files){for(const f of files){try{S.att.push(await readFile(f))}catch(e){toast(e.message,'err')}}renderAtts()}
function renderAtts(){const h=S.att.map((a,i)=>`<span class="att">${esc(a.name)}<button class="ib" data-act="rmAtt" data-i="${i}" style="width:18px;height:18px">${ico('x')}</button></span>`).join('');['#hatts','#catts'].forEach(s=>{const e=$(s);if(e)e.innerHTML=h})}
function pickFiles(cb,{accept='',multiple=true}={}){const i=$('#finp');i.value='';i.accept=accept;i.multiple=multiple;i.onchange=()=>{const fs=[...i.files];i.value='';if(fs.length)cb(fs)};i.click()}

/* ===== 17-boites-de-dialogue-notifications-menus.js ===== */
/* ============ boîtes de dialogue, notifications, menus ============ */
function modal({title,html='',fields=[],ok='OK',cancel='Annuler',wide=false,danger=false,noCancel=false}){return new Promise(res=>{const o=document.createElement('div');o.className='ovl';
 o.innerHTML=`<div class="dlg${wide?' wide':''}" role="dialog" aria-modal="true"><div class="dh">${esc(title)}</div><div class="db">${html}${fields.map(f=>`<label class="fl"><span>${esc(f.label)}</span>${f.type==='select'?`<select class="inp" name="${f.k}">${f.opts.map(([v,t])=>`<option value="${esc(v)}"${v===f.value?' selected':''}>${esc(t)}</option>`).join('')}</select>`:`<input class="inp" name="${f.k}" value="${esc(f.value||'')}">`}</label>`).join('')}</div><div class="df">${noCancel?'':`<button class="btn" data-m="0">${esc(cancel)}</button>`}<button class="btn pri${danger?' dng':''}" data-m="1">${esc(ok)}</button></div></div>`;
 const done=v=>{o.remove();removeEventListener('keydown',kd,true);res(v)};const val=()=>{const r={};$$('[name]',o).forEach(i=>r[i.name]=i.value);return r};
 const kd=e=>{if(e.key==='Escape'){e.stopPropagation();done(null)}else if(e.key==='Enter'&&e.target.tagName==='INPUT'&&o.contains(e.target)){e.preventDefault();done(val())}};
 o.onclick=e=>{const b=e.target.closest('[data-m]');if(b)done(b.dataset.m==='1'?val():null);else if(e.target===o)done(null)};
 addEventListener('keydown',kd,true);document.body.appendChild(o);const fi=o.querySelector('input,select');if(fi){fi.focus();if(fi.select)fi.select()}else o.querySelector('[data-m="1"]').focus()})}
function toast(msg,kind='info'){const w=$('#toasts'),t=document.createElement('div');t.className='toast '+kind;t.innerHTML=`<span>${esc(msg)}</span><button aria-label="Fermer">×</button>`;t.querySelector('button').onclick=()=>t.remove();w.appendChild(t);if(kind!=='err')setTimeout(()=>t.remove(),3800)}
function closeCtx(){$('#ctx')?.remove()}
function ctxMenu(x,y,items){closeCtx();const m=document.createElement('div');m.className='dd ctx';m.id='ctx';items.forEach(([t,f,dng])=>{const b=document.createElement('button');b.textContent=t;if(dng)b.className='dng';b.onclick=()=>{closeCtx();f()};m.appendChild(b)});document.body.appendChild(m);m.style.left=Math.min(x,innerWidth-m.offsetWidth-6)+'px';m.style.top=Math.min(y,innerHeight-m.offsetHeight-6)+'px'}
const CMD={
 save:{t:'Enregistrer',k:'Ctrl+S',f:async()=>{await flushSave();if(S.save==='ok')toast('Projet enregistré.')}},
 run:{t:'Lancer le jeu',k:'Ctrl+Entrée',f:runGame},reload:{t:"Recharger l'aperçu",f:runGame},stop:{t:"Arrêter l'exécution",f:stopGame},
 newFile:{t:'Nouveau fichier…',f:createFile},newProject:{t:'Nouveau projet…',f:createProjectFromDialog},openFolder:{t:'Ouvrir le dossier local…',f:()=>{if(window.electronAPI?.fs){window.electronAPI.fs.openInExplorer(S.project?.diskPath)}else{toast('Disponible dans le logiciel de bureau.','warn')}}},exportHtml:{t:'Exporter le jeu (HTML autonome)',f:exportHtml},closeProject:{t:'Fermer le projet',f:closeProject},
 goHome:{t:"Aller à l'accueil",f:()=>nav('home')},goProjects:{t:'Aller aux projets',f:()=>nav('projects')},goSettings:{t:'Ouvrir les paramètres',f:()=>nav('settings')},goAssets:{t:'Ouvrir les ressources',f:()=>nav('assets')},
 toggleChat:{t:'Afficher / masquer le chat IA',k:'Ctrl+Alt+B',f:()=>{ST.layout.chat=!ST.layout.chat;applyLayout();saveSettings();renderActivity()}},
 toggleSide:{t:'Afficher / masquer le panneau droit',k:'Ctrl+B',f:()=>{ST.layout.side=!ST.layout.side;applyLayout();saveSettings();renderActivity()}},
 toggleBottom:{t:'Afficher / masquer le panneau bas',k:'Ctrl+J',f:()=>{ST.layout.bottom=!ST.layout.bottom;applyLayout();saveSettings();if(ST.layout.bottom)renderBottom()}},
 modeCode:{t:'Vue : code seul',f:()=>setMode('code')},modeSplit:{t:'Vue : code et aperçu',f:()=>setMode('split')},modePreview:{t:'Vue : aperçu seul',f:()=>setMode('preview')},pvFull:{t:"Plein écran de l'aperçu",k:'F11',f:()=>pvFullscreen()},
 theme:{t:'Basculer thème clair / sombre',f:toggleTheme},resetLayout:{t:'Rétablir la disposition par défaut',f:()=>{ST.layout=JSON.parse(JSON.stringify(DEF.layout));saveSettings();if(S.view==='workspace')render();toast('Disposition rétablie.')}},
 search:{t:'Rechercher dans le projet',k:'Ctrl+Maj+F',f:()=>sideTab('search')},quickOpen:{t:'Ouvrir un fichier…',k:'Ctrl+P',f:()=>palette('file')},palette:{t:'Palette de commandes',k:'Ctrl+K',f:()=>palette('cmd')},find:{t:'Rechercher dans le fichier',k:'Ctrl+F',f:()=>{const fb=$('#findbar');if(!fb)return;fb.hidden=false;const q=$('#fq');const ta=$('#ta');const sel=ta&&ta.value.slice(ta.selectionStart,ta.selectionEnd);if(sel&&!sel.includes('\n'))q.value=sel;q.focus();q.select();findNext(0)}}};
const WSONLY=new Set(['save','run','reload','stop','newFile','openFolder','exportHtml','closeProject','toggleChat','toggleSide','toggleBottom','modeCode','modeSplit','modePreview','pvFull','search','quickOpen','find','resetLayout']);
const MENUS=[['Fichier',['newProject','newFile','save','openFolder','exportHtml','closeProject']],['Affichage',['toggleChat','toggleSide','toggleBottom','modeCode','modeSplit','modePreview','pvFull','theme','resetLayout','palette']],['Exécuter',['run','reload','pvFull','stop']],['Aller à',['quickOpen','search','goHome','goProjects','goAssets','goSettings']]];
function closeMenus(){$$('.mi.open').forEach(m=>{m.classList.remove('open');$('.dd',m)?.remove()})}
function palette(mode){$('#pal')?.remove();const o=document.createElement('div');o.className='ovl';o.id='pal';o.innerHTML='<div class="dlg"><input id="pq" placeholder="'+(mode==='file'?'Nom du fichier…':'Tape une commande…')+'" autocomplete="off"><div id="pallist"></div></div>';document.body.appendChild(o);
 const all=mode==='file'?Object.keys(S.project?.files||{}).map(p=>({t:p,f:()=>openFile(p)})):Object.entries(CMD).filter(([id])=>S.view==='workspace'||!WSONLY.has(id)).map(([,c])=>c);let items=[],sel=0;
 const draw=()=>{const q=$('#pq').value.toLowerCase();items=all.filter(c=>c.t.toLowerCase().includes(q)).slice(0,60);sel=Math.min(sel,Math.max(0,items.length-1));$('#pallist').innerHTML=items.map((c,i)=>`<div class="${i===sel?'on':''}" data-i="${i}"><span>${esc(c.t)}</span><span class="k">${c.k||''}</span></div>`).join('')||'<div class="dim">Aucun résultat</div>'};
 const close=()=>o.remove(),run=i=>{const c=items[i];close();if(c)c.f()};
 o.onclick=e=>{const r=e.target.closest('[data-i]');if(r)run(+r.dataset.i);else if(e.target===o)close()};
 $('#pq').oninput=()=>{sel=0;draw()};$('#pq').onkeydown=e=>{if(e.key==='Escape')close();else if(e.key==='Enter')run(sel);else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(items.length-1,sel+1);draw()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);draw()}};draw();$('#pq').focus()}

/* ===== 18-theme-et-disposition.js ===== */
/* ============ thème et disposition ============ */
function toggleTheme(){ST.theme=ST.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=ST.theme;saveSettings();updateStatus();if(S.view==='settings')renderSettings($('#content'))}
function setMode(m){ST.layout.mode=m;applyLayout();saveSettings();renderVModes()}
function renderVModes(){const v=$('#vmodes');if(!v)return;v.innerHTML=[['code','Code seul','code'],['split','Code et aperçu','split'],['preview','Aperçu seul','play']].map(([m,t,i])=>`<button class="ib${ST.layout.mode===m?' on':''}" data-act="cmd" data-c="mode${m[0].toUpperCase()+m.slice(1)}" title="${t}">${ico(i)}</button>`).join('')}
// Vrai plein écran : l'aperçu occupe tout l'écran par-dessus l'interface (API native).
// Repli sur le mode « aperçu seul » si le navigateur/OS refuse le plein écran.
function pvFullscreen(on){
  const el=$('#pvpane')||$('#pvframe');
  const fsEl=document.fullscreenElement||document.webkitFullscreenElement;
  if(on===undefined)on=!fsEl;
  try{
    if(on){
      const req=el.requestFullscreen||el.webkitRequestFullscreen;
      if(!req){setMode('preview');toast('Plein écran indisponible ici — aperçu seul activé.','warn');return}
      Promise.resolve(req.call(el)).catch(()=>{setMode('preview')});
    }else if(fsEl){
      const ex=document.exitFullscreen||document.webkitExitFullscreen;
      if(ex)Promise.resolve(ex.call(document)).catch(()=>{});
    }
  }catch(_){ if(on)setMode('preview'); }
  paintPvFS();
}
// Met à jour l'état visuel du bouton plein écran selon l'état réel du document.
function paintPvFS(){const b=$('#pvfs');if(!b)return;const on=!!(document.fullscreenElement||document.webkitFullscreenElement);b.classList.toggle('on',on);b.title=on?'Quitter le plein écran (Échap)':'Plein écran de l\'aperçu (F11)'}
addEventListener('fullscreenchange',paintPvFS);
addEventListener('webkitfullscreenchange',paintPvFS);

function applyLayout(){const w=$('#ws');if(!w)return;const L=ST.layout;w.style.setProperty('--chatW',L.chatW+'px');w.style.setProperty('--sideW',L.sideW+'px');w.style.setProperty('--bottomH',L.bottomH+'px');
 $('#chatp').hidden=!L.chat;$('[data-r=chat]').hidden=!L.chat;$('#sidep').hidden=!L.side;$('[data-r=side]').hidden=!L.side;$('#bottomp').hidden=!L.bottom;$('[data-r=bottom]').hidden=!L.bottom;
 $('#edpane').hidden=L.mode==='preview';$('#pvpane').hidden=L.mode==='code';$('[data-r=split]').hidden=L.mode!=='split';$('#edpane').style.flexGrow=L.mode==='split'?L.split:1;$('#pvpane').style.flexGrow=L.mode==='split'?1-L.split:1;renderVModes()}
addEventListener('pointerdown',e=>{const r=e.target.closest&&e.target.closest('.rz');if(!r)return;e.preventDefault();const k=r.dataset.r,L=ST.layout,sx=e.clientX,sy=e.clientY,o={...L};document.body.classList.add('drag');
 const mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(k==='chat')L.chatW=clamp(o.chatW+dx,240,720);if(k==='side')L.sideW=clamp(o.sideW-dx,200,620);if(k==='bottom')L.bottomH=clamp(o.bottomH-dy,80,520);if(k==='split'){const wr=$('#workarea').getBoundingClientRect();L.split=clamp((ev.clientX-wr.left)/wr.width,.15,.85)}applyLayout()};
 const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);document.body.classList.remove('drag');saveSettings()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});

/* ===== 19-vues.js ===== */
/* ============ vues ============ */
function modelSelect(id){const ks=Object.keys(PROV).filter(provOK);return `<select class="inp msel" id="${id}" title="Modèle d'IA">${ks.length?ks.map(k=>`<option value="${k}"${k===ST.active?' selected':''}>${esc(ST.p[k].model)} (${esc(PROV[k].name)})</option>`).join(''):'<option value="">Aucun modèle configuré</option>'}</select>`}
function nav(v){if(v==='workspace'&&!S.project)return;if(S.view==='workspace')captureEd();S.view=v;render()}
function render(){renderActivity();const c=$('#content');({home:renderHome,projects:renderProjects,assets:renderAssets,settings:renderSettings,workspace:buildWorkspace})[S.view](c);updateStatus()}
function renderActivity(){const a=$('#activity'),ws=S.view==='workspace';a.className=ws?'':'lnav';
 if(!ws){const nv=(v,t,i)=>`<button class="nv${S.view===v?' on':''}" data-act="nav" data-v="${v}">${ico(i)}<span>${t}</span></button>`;
  a.innerHTML=`<div class="lbrand">Studio</div>${nv('home','Accueil','home')}${nv('projects','Projets','folder')}${nv('assets','Ressources','image')}<div class="sp"></div>${S.project?`<button class="nv" data-act="nav" data-v="workspace" title="Retourner au studio">${ico('code')}<span>Retour au studio<small>${esc(S.project.name)}</small></span></button>`:''}${nv('settings','Paramètres','settings')}`;return}
 const L=ST.layout;const side=(t,title,i)=>`<button class="ab${L.side&&S.rt===t?' on':''}" title="${title}" aria-label="${title}" data-act="sideBtn" data-t="${t}">${ico(i)}</button>`;
 a.innerHTML=`<button class="ab" title="Accueil (quitter le studio)" aria-label="Accueil" data-act="nav" data-v="home">${ico('home')}</button><div class="asep"></div>${side('files','Explorateur','files')}${side('scene','Scène et propriétés','layers')}${side('assets','Ressources','image')}${side('search','Recherche','search')}${side('history','Historique des modifications','history')}<div class="asep"></div><button class="ab${L.chat?' on':''}" title="Chat avec l'IA" aria-label="Chat avec l'IA" data-act="cmd" data-c="toggleChat">${ico('chat')}</button><div class="sp"></div><button class="ab" title="Paramètres" aria-label="Paramètres" data-act="nav" data-v="settings">${ico('settings')}</button>`}
function sideTab(t){S.rt=t;ST.layout.side=true;applyLayout();renderSide();renderActivity();if(t==='search')setTimeout(()=>$('#gq')?.focus(),30)}
function composerHTML(){return `<div class="comp" data-drop="home"><textarea id="hprompt" placeholder="Décris le jeu que tu souhaites créer…">${esc(S.hp)}</textarea><div id="hatts" class="atts"></div><div class="ctools"><button class="btn sm" data-act="attach" title="Joindre des fichiers de départ">${ico('clip')} Joindre</button><div class="seg"><button data-act="kind" data-k="2d" class="${S.kind==='2d'?'on':''}">2D</button><button data-act="kind" data-k="3d" class="${S.kind==='3d'?'on':''}">3D</button></div><div class="sp"></div>${modelSelect('hmodel')}<button class="btn pri" data-act="homeSend">${ico('send')} Créer le jeu</button></div></div>${S.kind==='3d'?'<div class="dim" style="margin-top:8px;font-size:12px">En 3D, Three.js est chargé depuis Internet dans l\'aperçu.</div>':''}`}
function bindComposer(){const hp=$('#hprompt');if(!hp)return;hp.oninput=()=>S.hp=hp.value;hp.onkeydown=e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();homeSend()}};renderAtts()}
function drawCreate(){const b=$('#hbox');if(!b)return;if(S.creating){const c=S.creating;b.innerHTML=`<div class="steps">${c.steps.map(s=>`<div class="step ${s.st}"><span class="sy">${s.st==='ok'?'✓':s.st==='err'?'✗':s.st==='run'?'●':'○'}</span><span>${esc(s.t)}${s.msg?`<div style="color:var(--danger)">${esc(s.msg)}</div>`:''}</span></div>`).join('')}</div>${c.err?'<div style="margin-top:12px"><button class="btn" data-act="createBack">Modifier la demande</button></div>':''}`}else{b.innerHTML=composerHTML();bindComposer()}}
function renderHome(c){const ok=Object.keys(PROV).some(provOK);
 c.innerHTML=`<div class="page"><div class="home"><h1>Que veux-tu créer ?</h1><div class="dim">Décris ton jeu avec tes mots. Un vrai projet est créé, puis l'IA se met au travail dans le studio.</div><div id="hbox"></div>${ok?'':'<div class="warnbox">Aucun modèle d\'IA n\'est configuré. <a href="#" data-act="nav" data-v="settings">Ouvre les paramètres</a> pour ajouter Ollama ou une clé API.</div>'}</div></div>`;drawCreate()}
async function homeSend(){if(S.creating)return;const txt=S.hp.trim();
 const names=['Analyse de la demande',"Vérification du modèle d'IA",'Création du projet','Initialisation des fichiers',"Ouverture du studio"];
 const cr=S.creating={steps:names.map(t=>({t,st:'wait'})),err:null};drawCreate();
 const step=async(i,fn)=>{cr.steps[i].st='run';drawCreate();try{const r=await fn();cr.steps[i].st='ok';drawCreate();return r}catch(e){cr.steps[i].st='err';cr.steps[i].msg=e.message;cr.err=e.message;drawCreate();throw e}};
 try{let p;
  await step(0,async()=>{if(!txt)throw new Error("Décris d'abord le jeu que tu veux créer.");if(txt.length<5)throw new Error('La demande est trop courte pour être exploitée.')});
  await step(1,async()=>{let k=ST.active;if(!provOK(k)){const alt=Object.keys(PROV).find(provOK);if(!alt)throw new Error("Aucun modèle d'IA n'est configuré pour le fournisseur actif. Ouvre les paramètres.");ST.active=k=alt;saveSettings()}if(k==='ollama'){const ac=new AbortController(),to=setTimeout(()=>ac.abort(),6000);try{const r=await jf(ST.p.ollama.base.replace(/\/$/,'')+'/api/tags',{signal:ac.signal});const names=(r.models||[]).map(m=>m.name);if(!names.includes(ST.p.ollama.model)&&!names.includes(ST.p.ollama.model+':latest'))throw new Error(`Le modèle « ${ST.p.ollama.model} » n'est pas installé dans Ollama.`)}catch(e){throw e.message.startsWith('Le modèle')?e:new Error(friendlyError(e,'ollama'))}finally{clearTimeout(to)}}});
  await step(2,async()=>{p=newProject(nameFrom(txt),S.kind,txt);await DB.put(p)});
  await step(3,async()=>{const q=(await DB.all()).find(x=>x.id===p.id);if(!q||!q.files['index.html'])throw new Error('Le projet a été créé mais ses fichiers sont illisibles.')});
  await step(4,async()=>{S.hp='';await openProject(p)});S.creating=null;
  runAI(txt)}catch(e){}}
async function renderProjects(c){await refreshProjects();c.innerHTML=`<div class="page"><div class="wrap"><div class="ph"><h2>Projets</h2><div class="sp"></div><input class="inp" id="psearch" placeholder="Rechercher un projet" value="${esc(S.pf)}"><button class="btn" data-act="pImport">${ico('dl')} Importer</button><button class="btn pri" data-act="newProj">${ico('plus')} Nouveau projet</button></div><div class="dim" style="margin:-6px 0 16px">Les projets sont stockés dans ce navigateur. Exporte-les en JSON pour en garder une copie.</div><div id="plist"></div></div></div>`;const ps=$('#psearch');ps.oninput=()=>{S.pf=ps.value;drawProjects()};drawProjects()}
function drawProjects(){const l=$('#plist');if(!l)return;const q=S.pf.toLowerCase(),L=PROJ.filter(p=>p.name.toLowerCase().includes(q));l.innerHTML=L.length?`<div class="prow dim" style="cursor:default;background:none"><span>Nom</span><span>Type</span><span>Modifié</span><span>Fichiers</span><span style="width:110px"></span></div>`+L.map(p=>`<div class="prow" data-act="pOpen" data-id="${p.id}"><span class="nm">${esc(p.name)}<div class="dim" style="font-weight:400;font-size:12px">${p.id===ST.last?'Dernier projet utilisé':'&nbsp;'}</div></span><span>${p.type==='3d'?'3D':'2D'}</span><span>${fmtDate(p.updated)}</span><span>${Object.keys(p.files).length}</span><span class="ac"><button class="ib" data-act="pRename" data-id="${p.id}" title="Renommer">${ico('edit')}</button><button class="ib" data-act="pDup" data-id="${p.id}" title="Dupliquer">${ico('copy')}</button><button class="ib" data-act="pExport" data-id="${p.id}" title="Exporter en JSON">${ico('dl')}</button><button class="ib" data-act="pDel" data-id="${p.id}" title="Supprimer">${ico('trash')}</button></span></div>`).join(''):`<div class="empty">${PROJ.length?'Aucun projet ne correspond à cette recherche.':'Aucun projet pour le moment. Décris un jeu depuis l\'accueil, ou crée un projet vide.'}</div>`}
async function renderAssets(c){await refreshProjects();if(!S.asel||!PROJ.find(p=>p.id===S.asel))S.asel=S.project?.id||PROJ[0]?.id||null;c.innerHTML=`<div class="page"><div class="wrap"><div class="ph"><h2>Ressources</h2><div class="sp"></div>${PROJ.length?`<select class="inp" id="asel">${PROJ.map(p=>`<option value="${p.id}"${p.id===S.asel?' selected':''}>${esc(p.name)}</option>`).join('')}</select><button class="btn pri" data-act="importAssets">${ico('plus')} Importer</button>`:''}</div><div class="dim" style="margin-bottom:14px">Les ressources appartiennent à un projet. Il n'y a pas de bibliothèque en ligne dans cette version : importe tes propres fichiers.</div><div data-drop="assetspage" id="agrid">${PROJ.length?'':'<div class="empty">Crée d\'abord un projet.</div>'}</div></div></div>`;const sel=$('#asel');if(sel){sel.onchange=()=>{S.asel=sel.value;drawAssets()};drawAssets()}}
function drawAssets(){const p=PROJ.find(x=>x.id===S.asel),g=$('#agrid');if(g&&p)g.innerHTML=assetsHTML(p,false)}
const CATS=[['general','Général'],['ia','Intelligence artificielle'],['editor','Éditeur'],['engines','Moteurs'],['projects','Projets'],['privacy','Confidentialité et sécurité']];
function setIA(){const card=k=>{const x=ST.p[k];const f=(l,fld,type='text',ph='')=>`<div class="row"><label>${l}</label><input class="inp" type="${type}" data-prov="${k}" data-f="${fld}" value="${esc(x[fld]||'')}" placeholder="${ph}" autocomplete="off" spellcheck="false"${fld==='model'?` list="dl-${k}"`:''}></div>`;
  const hint={ollama:"Ollama doit tourner sur ta machine. Pour autoriser cette page, démarre-le avec la variable OLLAMA_ORIGINS=* puis redémarre-le.",openai:"Fonctionne avec OpenAI et tout service compatible (adresse de base modifiable). Le service doit autoriser les appels depuis un navigateur (CORS).",anthropic:"Les appels partent directement de ton navigateur vers l'API Anthropic.",gemini:"Les appels partent directement de ton navigateur vers l'API Gemini."}[k];
  return `<div class="card"><h3>${PROV[k].name}${k===ST.active?' <span class="chip">actif</span>':''}</h3><div class="dim" style="margin-bottom:10px;font-size:12px">${hint}</div>${k==='ollama'||k==='openai'||k==='lmstudio'?f('Adresse de base','base','text',k==='lmstudio'?'http://localhost:1234/v1':'http://localhost:11434'):''}${k!=='ollama'?f('Clé API','key','password','Colle ta clé ici'):''}${f('Modèle','model','text','nom du modèle (teste la connexion pour voir la liste)')}<datalist id="dl-${k}">${(S.tests[k]?.models||[]).map(m=>`<option value="${esc(m)}">`).join('')}</datalist><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="test" data-k="${k}">Tester la connexion</button>${k!==ST.active?`<button class="btn" data-act="useProv" data-k="${k}">Utiliser ce fournisseur</button>`:''}${k!=='ollama'&&x.key?`<button class="btn dng" data-act="delKey" data-k="${k}">Supprimer la clé</button>`:''}</div><div id="st-${k}"></div><div class="mlist" id="ml-${k}"></div></div>`};
 return `<h2>Intelligence artificielle</h2><div class="dim" style="margin:6px 0 16px">Choisis un fournisseur, saisis ta clé, teste la connexion, puis sélectionne un modèle. Le fournisseur actif sert pour les nouveaux projets et pour le chat.</div>${Object.keys(PROV).map(card).join('')}<div class="card"><h3>Limites d'envoi à l'IA</h3><div class="row"><label>Contexte (caractères)</label><input class="inp" type="number" min="2000" step="1000" data-g="ctx" value="${ST.ctx}"></div><div class="row"><label>Tokens de sortie max</label><input class="inp" type="number" min="512" step="512" data-g="maxTok" value="${ST.maxTok}"></div><div class="row"><label>Ollama : num_ctx</label><input class="inp" type="number" min="1024" step="1024" data-g="numCtx" value="${ST.numCtx}"></div><div class="dim" style="font-size:12px">Sur une machine modeste, garde un contexte court : plus le projet est gros, plus un modèle local est lent.</div></div>${ST.dev?`<div class="card"><h3>Mode développeur</h3><label style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" data-s="dev"${ST.dev?' checked':''}> Activer le mode développeur</label><div class="dim" style="font-size:12px;margin-bottom:10px">Hyperparamètres envoyés au modèle. Laisse vide pour utiliser le réglage du fournisseur. Ces valeurs s'appliquent selon ce que l'API prend en charge.</div><div class="row"><label>Température</label><input class="inp" type="number" step="0.1" min="0" max="2" data-g="hp.temperature" value="${ST.hp.temperature??''}"></div><div class="row"><label>Top-p</label><input class="inp" type="number" step="0.05" min="0" max="1" data-g="hp.topP" value="${ST.hp.topP??''}"></div><div class="row"><label>Frequency penalty</label><input class="inp" type="number" step="0.1" min="-2" max="2" data-g="hp.freqPenalty" value="${ST.hp.freqPenalty??''}"></div><div class="row"><label>Presence penalty</label><input class="inp" type="number" step="0.1" min="-2" max="2" data-g="hp.presPenalty" value="${ST.hp.presPenalty??''}"></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" data-act="devLogs">Voir les logs HTTP (latence, tokens)</button></div><div id="dev-last" class="dim" style="font-size:11.5px;margin-top:8px"></div></div>`:`<div class="card"><h3>Mode développeur</h3><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-s="dev"${ST.dev?' checked':''}> Activer le mode développeur (prompts bruts, logs HTTP, hyperparamètres, endpoints personnalisés)</label></div>`}${enginesCard()}`}
function setGeneral(){return `<h2>Général</h2><div class="card" style="margin-top:14px"><h3>Thème</h3><div class="seg"><button data-act="themeSet" data-t="light" class="${ST.theme==='light'?'on':''}">Clair</button><button data-act="themeSet" data-t="dark" class="${ST.theme==='dark'?'on':''}">Sombre</button></div></div><div class="card"><h3>Au démarrage</h3><div class="dim">Le logiciel s'ouvre sur l'accueil. Le dernier projet utilisé est signalé dans la liste des projets.</div></div><div class="card"><h3>Raccourcis clavier</h3><table class="kt">${Object.values(CMD).filter(x=>x.k).map(x=>`<tr><td>${x.t}</td><td><span class="kbd">${x.k}</span></td></tr>`).join('')}</table></div><button class="btn" data-act="cmd" data-c="resetLayout">Rétablir la disposition par défaut</button>`}
function setEditor(){return `<h2>Éditeur</h2><div class="card" style="margin-top:14px"><div class="row"><label>Taille de police</label><input class="inp" type="number" min="10" max="24" data-e="fs" value="${ST.editor.fs}"></div><div class="row"><label>Largeur d'indentation</label><input class="inp" type="number" min="1" max="8" data-e="tab" value="${ST.editor.tab}"></div><div class="row"><label>Retour à la ligne</label><label style="display:flex;gap:8px;align-items:center;justify-self:start"><input type="checkbox" data-act="edWrap"${ST.editor.wrap?' checked':''}> Couper les longues lignes</label></div><div class="dim" style="font-size:12px">Avec le retour à la ligne, les longues lignes de code s'enroulent au lieu de dépasser horizontalement ; les numéros de ligne suivent. La police de code est « Cascadia Code », « JetBrains Mono » ou la police monospace du système.</div></div><div class="card"><h3>Fonctions de l'éditeur</h3><div class="dim">Coloration (JS, CSS, HTML, JSON), numéros de ligne, indentation automatique, recherche et remplacement (Ctrl+F), annulation et rétablissement, enregistrement automatique, détection des erreurs de syntaxe JS et des JSON invalides dans le panneau Problèmes. Pas d'autocomplétion ni de navigation vers les définitions dans cette version.</div></div>`}
function setEngines(){const isDesk=!!window.electronAPI?.isDesktop;return `<h2>Moteurs</h2><div class="card" style="margin-top:14px"><h3>HTML5 : Canvas 2D et Three.js 3D</h3><div class="stt ok" style="margin:0 0 6px">Intégré et actif</div><div class="dim">Le jeu s'exécute dans l'aperçu du studio. Les projets 2D utilisent Canvas, les projets 3D utilisent Three.js (chargé depuis Internet). La scène est décrite dans <code>scene.json</code>, exposée au jeu sous <code>window.SCENE</code>, et pilote le panneau Scène du studio.</div></div><div class="card"><h3>Godot Engine 4</h3><div class="stt ${isDesk?'ok':'warn'}" style="margin:0 0 6px">${isDesk?'Intégration desktop active':'Disponible en mode desktop'}</div><div class="dim">GameCraft Studio génère l'architecture native Godot 4 (<code>project.godot</code>, scripts <code>.gd</code>, scènes <code>.tscn</code>). Sur cette version de bureau, vous pouvez lancer directement le jeu avec votre exécutable Godot local et suivre les journaux en direct dans la console.</div>${isDesk?`<div style="margin-top:10px;display:flex;gap:8px"><button class="btn sm" data-act="detectGodot">Vérifier l'exécutable Godot</button><button class="btn sm" data-act="openProjDir">Ouvrir le dossier des projets</button></div><div id="godot-status" style="margin-top:8px;font-size:12px"></div>`:''}</div>`}
function setProjects(){return `<h2>Projets</h2><div class="card" style="margin-top:14px"><h3>Stockage</h3><div class="dim">Les projets (fichiers, conversation, historique des modifications) sont enregistrés dans IndexedDB, dans ce navigateur. Ils ne sont pas envoyés sur un serveur. Efface les données du site et ils disparaissent : utilise l'export JSON depuis la page Projets pour garder une copie.</div></div><div class="card"><h3>Sauvegarde</h3><div class="dim">Enregistrement automatique 0,5 s après chaque modification, indicateur dans la barre d'état. Les modifications de l'IA sont conservées dans l'historique et peuvent être annulées.</div></div>`}
function setPrivacy(){return `<h2>Confidentialité et sécurité</h2><div class="card" style="margin-top:14px"><h3>Permissions de l'IA</h3><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-s="allowAIDelete"${ST.sec.allowAIDelete?' checked':''}> Autoriser l'IA à demander la suppression de fichiers (une confirmation est toujours demandée)</label><div class="dim" style="margin-top:8px">L'IA ne peut écrire que dans les fichiers du projet ouvert. Elle n'a accès ni au disque, ni à un terminal.</div></div><div class="card"><h3>Vie privée — mes données (RGPD)</h3><div class="dim" style="margin-bottom:10px">Vos projets et conversations restent sur cet appareil. Vous pouvez à tout moment tout exporter ou tout supprimer définitivement.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="exportJSON">Exporter mes données (JSON)</button><button class="btn" data-act="exportCSV">Exporter les conversations (CSV)</button><button class="btn dng" data-act="purgeAll">Supprimer définitivement toutes mes données</button></div><div class="dim" style="margin-top:8px;font-size:12px">Aucune télémétrie ni rapport de plantage n'est envoyé sans votre consentement explicite. Aucun secret n'apparaît dans les exports.</div></div><div class="card"><h3>Clés API</h3><div class="dim">Stockage : <b id="secure-backend">${secureBackendLabel()}</b>. ${hasSecure()?'Elles sont chiffrées via le coffre-fort de votre système (DPAPI / Keychain / kwallet) et ne quittent jamais cet appareil.':'Sur cette version web, elles restent dans le stockage local du navigateur, sans coffre-fort système.'} Elles ne sont écrites ni dans les fichiers des projets, ni dans les exports, et sont masquées dans les messages d'erreur.</div></div>`}
function renderSettings(c){const keep=c.querySelector('.setbody')?.scrollTop||0;const body={general:setGeneral,ia:setIA,editor:setEditor,engines:setEngines,projects:setProjects,privacy:setPrivacy}[S.scat]();
 c.innerHTML=`<div class="page" style="overflow:hidden"><div class="setw"><nav class="setnav"><h2 style="padding:0 10px 12px">Paramètres</h2>${CATS.map(([k,l])=>`<button class="nv${k===S.scat?' on':''}" data-act="scat" data-k="${k}"><span>${l}</span></button>`).join('')}</nav><div class="setbody">${body}</div></div></div>`;c.querySelector('.setbody').scrollTop=keep;Object.keys(PROV).forEach(renderTestUI)}
function buildWorkspace(c){const menus=MENUS.map(([n],i)=>`<div class="mi"><button data-act="menu" data-i="${i}">${n}</button></div>`).join('');
 c.innerHTML=`<div id="ws"><div id="menubar">${menus}<span class="mname" id="pname"></span><span class="dim" id="sname" style="margin-left:10px"></span><div class="sp"></div><button class="ib" data-act="undo" title="Annuler (Ctrl+Z)">${ico('undo')}</button><button class="ib" data-act="redo" title="Rétablir (Ctrl+Maj+Z)">${ico('redo')}</button><button class="btn sm" data-act="cmd" data-c="save" title="Enregistrer (Ctrl+S)">Enregistrer</button><span class="engine" id="eng"></span><button class="btn sm pri" data-act="cmd" data-c="run" title="Lancer (Ctrl+Entrée)">${ico('play')} Lancer</button><button class="btn sm" data-act="cmd" data-c="stop">${ico('stop')} Arrêter</button></div>
 <div id="wsbody"><div id="chatp"><div class="ph2"><span>Assistant IA</span><div class="sp"></div>${modelSelect('cmodel')}</div><div id="chatmsgs" data-drop="chat"></div><div class="cin" data-drop="chat"><div id="catts" class="atts" style="padding:0"></div><textarea id="cin" placeholder="Demande une modification… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"></textarea><div class="cb"><button class="btn sm" data-act="attach" title="Joindre des fichiers">${ico('clip')}</button><div class="sp"></div><button class="btn pri" id="csend" data-act="chatSend">${ico('send')} Envoyer</button></div></div></div><div class="rz v" data-r="chat"></div>
 <div id="center"><div id="tabrow"><div id="tabs"></div><div id="vmodes"></div></div><div id="workarea"><div id="edpane"></div><div class="rz v" data-r="split"></div><div id="pvpane"><div class="pvbar"><span>Aperçu</span><span class="dim" id="pvstatus">Pas encore lancé</span><div class="sp"></div><button class="ib" data-act="cmd" data-c="reload" title="Lancer ou recharger">${ico('refresh')}</button><button class="ib" id="pvfs" data-act="cmd" data-c="pvFull" title="Plein écran de l'aperçu (F11)">${ico('fs')}</button><button class="ib" data-act="cmd" data-c="stop" title="Arrêter">${ico('stop')}</button></div><iframe id="pvframe" title="Aperçu du jeu" sandbox="allow-scripts allow-pointer-lock allow-modals allow-forms" allow="autoplay; fullscreen; gamepad"></iframe></div></div><div class="rz h" data-r="bottom"></div><div id="bottomp"></div></div>
 <div class="rz v" data-r="side"></div><div id="sidep"><div class="sh" id="shbar"></div><div id="sidebody"></div></div></div></div>`;
 $('#pname').textContent=S.project.name;$('#eng').textContent=S.project.type==='godot'?'Godot Engine 4 (GDScript)':S.project.type==='3d'?'HTML5, Three.js (3D)':'HTML5, Canvas (2D)';updateTop();applyLayout();renderChat(true);renderTabs();renderEditor();renderSide();if(ST.layout.bottom)renderBottom();renderAtts();
 const ci=$('#cin');ci.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();A.chatSend()}};setBusy(S.busy);setTimeout(runGame,60)}
function updateTop(){const s=$('#sname');if(!s||!S.project)return;const g=getScene(S.project);s.textContent=g?'Scène : scene.json':'Aucune scène'}
function updateStatus(){const s=$('#status');if(!s)return;const p=S.project;const sv=S.save==='ok'?'<span class="ok">Enregistré</span>':S.save==='dirty'?'<span>Enregistrement…</span>':`<span class="err">Échec de l'enregistrement : ${esc(S.saveMsg)}</span>`;const k=ST.active;s.innerHTML=`<span>${p?esc(p.name):'Aucun projet ouvert'}</span>${p?sv:''}${S.busy?`<span class="busy">IA : ${esc(S.phase||'au travail')}…</span>`:''}<div class="sp"></div><span>${provOK(k)?esc(ST.p[k].model+' ('+PROV[k].name+')'):'Aucun modèle configuré'}</span><span class="ai-badge" title="Contenu généré par intelligence artificielle"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></svg> IA</span><button data-act="cmd" data-c="theme" title="Changer de thème">${ST.theme==='dark'?'Thème sombre':'Thème clair'}</button>`}

/* ===== 20-actions.js ===== */
/* ============ actions (délégation d'événements) ============ */
const A={
 exportJSON:()=>exportUserData('json'),exportCSV:()=>exportUserData('csv'),purgeAll:()=>purgeAllData(),
 devLogs:async()=>{if(!DEV||!DEV.log.length){const el=$('#dev-last');if(el)el.textContent='Aucun appel pour le moment. Envoie un message à l\'IA puis reviens.';return}const l=DEV.last||DEV.log[DEV.log.length-1];const cost=l.kind==='ok'&&estCost?estCost(l.prov,l.inTok,l.outTok):null;await modal({title:'Dernier appel IA (mode dev)',wide:true,noCancel:true,ok:'Fermer',html:`<div class="dim" style="margin-bottom:8px">Fournisseur <b>${esc(l.prov)}</b>${l.inTok!=null?` · entrée ≈ <b>${l.inTok}</b> tokens`:''}${l.outTok!=null?` · sortie ≈ <b>${l.outTok}</b> tokens`:''}${l.ms!=null?` · latence <b>${l.ms} ms</b>`:''}${cost!=null?` · coût estimé <b>$${cost.toFixed(5)}</b>`:''}</div><div class="diff">${esc(JSON.stringify(l,null,1))}</div>`})},
 nav:el=>nav(el.dataset.v),cmd:el=>{closeMenus();CMD[el.dataset.c]?.f()},
 menu:el=>{const mi=el.parentElement,was=mi.classList.contains('open');closeMenus();if(was)return;mi.classList.add('open');const dd=document.createElement('div');dd.className='dd';dd.innerHTML=MENUS[+el.dataset.i][1].map(id=>`<button data-act="cmd" data-c="${id}"><span>${esc(CMD[id].t)}</span><span class="k">${CMD[id].k||''}</span></button>`).join('');mi.appendChild(dd)},
 sideBtn:el=>{const t=el.dataset.t;if(S.view==='workspace'&&ST.layout.side&&S.rt===t){CMD.toggleSide.f();return}sideTab(t)},
 tab:el=>{if(S.active===el.dataset.p)return;captureEd();S.active=el.dataset.p;renderTabs();renderEditor();renderSide(true);saveSoon()},closeTab:el=>closeTab(el.dataset.p),
 openFile:el=>openFile(el.dataset.p),toggle:el=>{const p=el.dataset.p;S.collapsed.has(p)?S.collapsed.delete(p):S.collapsed.add(p);renderSide()},
 gotoRes:el=>openFile(el.dataset.p,+el.dataset.l),newFile:createFile,importHere:()=>pickFiles(f=>importFiles(f,'assets')),
 bt:el=>{S.bt=el.dataset.t;renderBottom()},clearLogs:()=>{S.logs=[];S.rtErr=[];renderBottom()},
 kind:el=>{S.kind=el.dataset.k;const h=$('#hprompt');if(h)S.hp=h.value;renderHome($('#content'))},example:el=>{S.hp=el.dataset.t;renderHome($('#content'));$('#hprompt').focus()},
 attach:()=>pickFiles(addAtts),rmAtt:el=>{S.att.splice(+el.dataset.i,1);renderAtts()},
 homeSend:()=>homeSend(),
 chatSend:()=>{const t=$('#cin');const v=t.value.trim();if(!v){return}if(S.busy)return;t.value='';runAI(v)},chatStop:()=>S.ctl?.abort(),
 retry:el=>{const p=S.project,i=+el.dataset.i;const um=[...p.chat.slice(0,i)].reverse().find(m=>m.role==='user');if(!um)return;p.chat.splice(i,1);runAI(um.text,{retry:true,full:um.full})},
 diff:el=>showDiff(el.dataset.h,el.dataset.i!==undefined?+el.dataset.i:undefined),revert:el=>revertEntry(el.dataset.h),
 needImport:el=>{const mi=+el.dataset.m,ni=+el.dataset.n;pickFiles(f=>needFulfill(mi,ni,f),{multiple:false})},
 needSkip:el=>{const n=S.project.chat[+el.dataset.m].needs[+el.dataset.n];n.state='skipped';touch();renderChat(false)},
 needPick:async el=>{if(!el.value)return;await finishNeed(S.project,+el.dataset.m,+el.dataset.n,el.value)},
 findClose:()=>{const fb=$('#findbar');if(fb)fb.hidden=true;$('#ta')?.focus()},findNav:el=>findNext(+el.dataset.d),
 replOne:()=>{const ta=$('#ta'),q=$('#fq').value,r=$('#fr').value;if(!ta||!q)return;if(ta.value.slice(ta.selectionStart,ta.selectionEnd).toLowerCase()!==q.toLowerCase())findNext(1);if(ta.value.slice(ta.selectionStart,ta.selectionEnd).toLowerCase()===q.toLowerCase()){ta.focus();document.execCommand&&document.execCommand('insertText',false,r)||(ta.setRangeText(r,ta.selectionStart,ta.selectionEnd,'end'),ta.dispatchEvent(new Event('input')));findNext(1)}},
 replAll:()=>{const ta=$('#ta'),q=$('#fq').value,r=$('#fr').value;if(!ta||!q)return;const re=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');const n=(ta.value.match(re)||[]).length;ta.value=ta.value.replace(re,()=>r);ta.dispatchEvent(new Event('input'));toast(n+' remplacement(s).')},
 pOpen:async el=>{const p=PROJ.find(x=>x.id===el.dataset.id);if(p)openProject(p)},
 pRename:async el=>{const p=PROJ.find(x=>x.id===el.dataset.id);const r=await modal({title:'Renommer le projet',fields:[{k:'n',label:'Nom',value:p.name}],ok:'Renommer'});if(!r||!r.n.trim())return;p.name=r.n.trim();p.updated=Date.now();await DB.put(p);if(S.project?.id===p.id)S.project.name=p.name;renderProjects($('#content'))},
 pDup:async el=>{const p=PROJ.find(x=>x.id===el.dataset.id);const c=JSON.parse(JSON.stringify(p));c.id=uid();c.name=p.name+' (copie)';c.created=c.updated=Date.now();await DB.put(c);toast('Projet dupliqué.');renderProjects($('#content'))},
 pDel:async el=>{const p=PROJ.find(x=>x.id===el.dataset.id);const r=await modal({title:'Supprimer le projet',html:`<p>Supprimer définitivement <b>${esc(p.name)}</b> et tous ses fichiers ? Cette action est irréversible.</p>`,ok:'Supprimer',danger:true});if(!r)return;await DB.del(p.id);if(S.project?.id===p.id)S.project=null;renderProjects($('#content'));renderActivity()},
 newProj:createProjectFromDialog,
 importAssets:()=>{const pid=S.view==='assets'?S.asel:S.project?.id;if(!pid)return;pickFiles(async fs=>{await importToProject(pid,fs)})},
 copyPath:el=>{navigator.clipboard?.writeText(el.dataset.p).then(()=>toast('Chemin copié.'),()=>toast(el.dataset.p))},
 delAsset:async el=>{const p=S.view==='assets'?PROJ.find(x=>x.id===S.asel):S.project;const path=el.dataset.p;const r=await modal({title:'Supprimer la ressource',html:`<p>Supprimer <code>${esc(path)}</code> ?</p>`,ok:'Supprimer',danger:true});if(!r)return;delete p.files[path];await DB.put(p);if(S.view==='assets')drawAssets();else{touch();renderSide()}},
 test:el=>testProvider(el.dataset.k),useProv:el=>{ST.active=el.dataset.k;saveSettings();renderSettings($('#content'));updateStatus()},
 pickModel:el=>{const k=el.dataset.k;ST.p[k].model=el.dataset.m;ST.active=k;saveSettings();renderSettings($('#content'));renderTestUI(k);updateStatus()},
 themeSet:el=>{ST.theme=el.dataset.t;document.documentElement.dataset.theme=ST.theme;saveSettings();renderSettings($('#content'));updateStatus()},
 edWrap:()=>{ST.editor.wrap=!ST.editor.wrap;saveSettings();renderEditor();renderSettings($('#content'))}};
Object.assign(A,{
 scat:el=>{S.scat=el.dataset.k;renderSettings($('#content'))},
 delKey:el=>{ST.p[el.dataset.k].key='';saveSettings();renderSettings($('#content'));updateStatus();toast('Clé supprimée.')},
 createBack:()=>{S.creating=null;drawCreate()},
 undo:()=>{const t=$('#ta');if(t){t.focus();document.execCommand('undo')}},redo:()=>{const t=$('#ta');if(t){t.focus();document.execCommand('redo')}},
 sceneCreate:()=>{S.project.files['scene.json']={t:'text',c:JSON.stringify(defaultScene(S.project.type),null,2)+'\n'};touch();renderSide();updateTop();toast('scene.json créé. Le code du jeu doit lire window.SCENE pour l\'utiliser.')},
 objSel:el=>{S.sel=el.dataset.id;const g=getScene(S.project);if(g&&g.d){$('#olist').innerHTML=olistHTML(g.d);$('#insp').innerHTML=inspHTML(g.d)}},
 objAdd:el=>{const g=getScene(S.project);if(!g||!g.d)return;const r=el.getBoundingClientRect(),is3=S.project.type==='3d';const opts=is3?['box','sphere','plane']:['rect','circle'];
  ctxMenu(r.left,r.bottom+2,opts.map(t=>[OTYPES[t][0],()=>{const n=g.d.objects.filter(o=>o.type===t).length+1;const o=is3?{id:uid(),name:OTYPES[t][0]+' '+n,type:t,position:[0,t==='plane'?0:0.5,0],rotation:[t==='plane'?-90:0,0,0],scale:[1,1,1],color:'#8a8a99',role:''}:t==='circle'?{id:uid(),name:'Cercle '+n,type:t,x:200,y:200,r:14,color:'#f5c542',role:''}:{id:uid(),name:'Rectangle '+n,type:t,x:200,y:200,w:60,h:20,color:'#3d3d46',role:''};g.d.objects.push(o);S.sel=o.id;writeScene(g.d);renderSide()}]))},
 objDup:()=>{const g=getScene(S.project);if(!g||!g.d||!S.sel)return;const o=g.d.objects.find(x=>x.id===S.sel);if(!o)return;const c=JSON.parse(JSON.stringify(o));c.id=uid();c.name=(o.name||'Objet')+' (copie)';if(c.x!==undefined){c.x+=20;c.y+=20}if(c.position)c.position[0]+=1;g.d.objects.push(c);S.sel=c.id;writeScene(g.d);renderSide()},
 objDel:async()=>{const g=getScene(S.project);if(!g||!g.d||!S.sel)return;const o=g.d.objects.find(x=>x.id===S.sel);if(!o)return;const r=await modal({title:"Supprimer l'objet",html:`<p>Supprimer <b>${esc(o.name||o.id)}</b> de la scène ?</p>`,ok:'Supprimer',danger:true});if(!r)return;g.d.objects=g.d.objects.filter(x=>x.id!==S.sel);S.sel=null;writeScene(g.d);renderSide()},
 pExport:el=>{const p=PROJ.find(x=>x.id===el.dataset.id);if(!p)return;const b=new Blob([JSON.stringify({studioProject:1,...p},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=safeName(p.name)+'.studio.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Projet exporté (sans clé API).')},
   pImport:()=>pickFiles(async fs=>{for(const f of fs){try{const j=JSON.parse(await f.text());if(!j||!j.studioProject||typeof j.files!=='object'||typeof j.name!=='string')throw new Error('format de projet non reconnu');for(const [k,v] of Object.entries(j.files)){if(!cleanPath(k)||!v||(v.t!=='text'&&v.t!=='bin'))throw new Error('fichier invalide dans le projet : '+k)}delete j.studioProject;j.id=uid();j.name=j.name+' (importé)';j.updated=Date.now();j.chat=j.chat||[];j.history=j.history||[];j.type=j.type==='3d'?'3d':j.type==='godot'?'godot':'2d';await DB.put(j);toast('Projet importé : '+j.name)}catch(e){toast('Import impossible ('+f.name+') : '+e.message,'err')}}renderProjects($('#content'))},{accept:'.json',multiple:true}),
  fixProbs:el=>{const m=S.project.chat[+el.dataset.i];if(m&&m.verify)runAI('Corrige ces problèmes détectés automatiquement :\n- '+m.verify.bad.join('\n- '))},
 fixErrors:()=>{const l=computeProblems(S.project).filter(x=>x.s==='err').map(x=>(x.f?x.f+' : ':'')+x.t);if(l.length)runAI('Voici les erreurs détectées dans le projet. Analyse-les et corrige-les :\n- '+l.join('\n- '))},
  detectGodot:async()=>{
    if(!window.electronAPI?.engine){toast('Fonction réservée au client desktop.','warn');return}
    const r=await window.electronAPI.engine.detectGodot();
    const el=$('#godot-status');
    if(r.available){
      if(el)el.innerHTML=`<span class="ok">✓ Godot 4 détecté : <code>${esc(r.path)}</code></span>`;
      toast('Godot 4 détecté avec succès.');
    }else{
      if(el)el.innerHTML=`<span class="err">✗ Exécutable Godot non trouvé automatiquement.</span><br><span class="dim">Placez godot.exe dans C:\\Program Files\\Godot\\ ou ajoutez-le au PATH.</span>`;
      toast('Godot 4 non détecté.','warn');
    }
  },
  openProjDir:()=>{
    if(window.electronAPI?.fs)window.electronAPI.fs.openInExplorer();
    else toast('Disponible dans le logiciel de bureau.','warn');
  }});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.sc!==undefined)sceneEdit(t)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.s){const k=t.dataset.s;if(k in (ST.sec||{}))ST.sec[k]=t.checked;else ST[k]=t.checked;saveSettings();if(k==='dev')render()}else if(t.dataset&&t.dataset.sc!==undefined&&t.tagName==='SELECT')sceneEdit(t)});
function applyEditorVars(){const r=document.documentElement.style;r.setProperty('--edfs',ST.editor.fs+'px');r.setProperty('--edlh',(ST.editor.fs+7)+'px')}
async function importToProject(pid,fs){const p=S.project?.id===pid?S.project:PROJ.find(x=>x.id===pid);if(!p)return;let n=0;for(const f of fs){try{putAsset(p,'assets',await readFile(f));n++}catch(e){toast(e.message,'err')}}if(n){await DB.put(p);toast(n+' ressource(s) importée(s).')}if(S.view==='assets')drawAssets();else{renderSide();updateBadge()}}
document.addEventListener('click',e=>{if(!e.target.closest('.mi'))closeMenus();if(!e.target.closest('#ctx'))closeCtx();const a=e.target.closest('[data-act]');if(!a||a.tagName==='SELECT'||a.tagName==='OPTION')return;if(a.tagName==='A')e.preventDefault();const f=A[a.dataset.act];if(f)f(a,e)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.act==='needPick')A.needPick(t);else if(t.classList.contains('msel')){if(t.value){ST.active=t.value;saveSettings();updateStatus()}}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.prov){ST.p[t.dataset.prov][t.dataset.f]=t.value.trim();saveSettings();updateStatus()}else if(t.dataset.g){const path=t.dataset.g,raw=t.value.trim();let v=raw===''?null:parseFloat(raw);if(v===null||Number.isFinite(v)){setSettingPath(ST,path,v);saveSettings()}}else if(t.dataset&&t.dataset.e){const v=parseInt(t.value,10);if(v>0){ST.editor[t.dataset.e]=clamp(v,t.dataset.e==='fs'?10:1,t.dataset.e==='fs'?24:8);saveSettings();applyEditorVars()}}});
document.addEventListener('contextmenu',e=>{if(S.view!=='workspace')return;const r=e.target.closest('.row[data-path],.row[data-dir]');if(!r&&!e.target.closest('[data-drop=files]'))return;e.preventDefault();const path=r?.dataset.path;if(path)ctxMenu(e.clientX,e.clientY,[['Ouvrir',()=>openFile(path)],['Renommer…',()=>renameFile(path)],['Copier le chemin',()=>navigator.clipboard?.writeText(path)],['Supprimer…',()=>deleteFile(path),true]]);else ctxMenu(e.clientX,e.clientY,[['Nouveau fichier…',createFile],['Importer des fichiers…',()=>A.importHere()]])});
const DROP={home:fs=>addAtts(fs),chat:fs=>addAtts(fs),files:fs=>importFiles(fs,'assets'),assetspage:fs=>importToProject(S.asel,fs),need:(fs,z)=>needFulfill(+z.dataset.m,+z.dataset.n,fs)};
addEventListener('dragover',e=>{e.preventDefault();const z=e.target.closest&&e.target.closest('[data-drop]');if(z)z.classList.add('over')});
addEventListener('dragleave',()=>$$('.over').forEach(x=>x.classList.remove('over')));
addEventListener('drop',e=>{e.preventDefault();$$('.over').forEach(x=>x.classList.remove('over'));const z=e.target.closest&&e.target.closest('[data-drop]');if(z&&e.dataTransfer?.files?.length)DROP[z.dataset.drop]([...e.dataTransfer.files],z)});
addEventListener('keydown',e=>{const c=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
 if(c&&k==='s'){e.preventDefault();if(S.project)CMD.save.f()}
 else if(c&&(k==='k'||(e.shiftKey&&k==='p'))){e.preventDefault();palette('cmd')}
 else if(c&&k==='p'&&S.project&&S.view==='workspace'){e.preventDefault();palette('file')}
 else if(c&&e.shiftKey&&k==='f'&&S.view==='workspace'){e.preventDefault();sideTab('search')}
 else if(c&&k==='f'&&S.view==='workspace'&&e.target.id==='ta'){e.preventDefault();CMD.find.f()}
 else if(c&&k==='enter'&&S.view==='workspace'){e.preventDefault();runGame()}
 else if(c&&e.altKey&&k==='b'&&S.view==='workspace'){e.preventDefault();CMD.toggleChat.f()}
 else if(c&&k==='b'&&S.view==='workspace'&&!e.altKey){e.preventDefault();CMD.toggleSide.f()}
 else if(c&&k==='j'&&S.view==='workspace'){e.preventDefault();CMD.toggleBottom.f()}
  else if(e.key==='F11'&&S.view==='workspace'){e.preventDefault();pvFullscreen()}
  else if(e.key==='Escape'&&(document.fullscreenElement||document.webkitFullscreenElement)){pvFullscreen(false)}
 else if(e.key==='Escape'){closeMenus();closeCtx()}});
addEventListener('beforeunload',e=>{if(S.save==='dirty'){flushSave();e.preventDefault();e.returnValue=''}});
addEventListener('error',e=>{try{toast('Erreur interne : '+e.message,'err')}catch{}});
addEventListener('unhandledrejection',e=>{try{toast('Erreur : '+(e.reason?.message||e.reason),'err')}catch{}});
/* démarrage */
applyEditorVars();
if(window.electronAPI?.isDesktop){
  const tb=$('#dsk-titlebar');if(tb)tb.hidden=false;
  $('#dsk-min')?.addEventListener('click',()=>window.electronAPI.window.minimize());
  $('#dsk-max')?.addEventListener('click',async()=>{
    const isM=await window.electronAPI.window.maximize();
    const b=$('#dsk-max');if(b)b.innerHTML=isM?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="1.5" y="1.5" width="7" height="7"/><rect x="3.5" y="0.5" width="6" height="6"/></svg>':'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="9" height="9"/></svg>';
  });
  $('#dsk-close')?.addEventListener('click',()=>window.electronAPI.window.close());
  window.electronAPI.window.onMaximizeChange(isM=>{
    const b=$('#dsk-max');if(b)b.innerHTML=isM?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="1.5" y="1.5" width="7" height="7"/><rect x="3.5" y="0.5" width="6" height="6"/></svg>':'<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="9" height="9"/></svg>';
  });
  window.electronAPI.engine?.onEngineLog(data=>{
    S.logs.push({l:data.l==='err'?'error':data.l||'log',t:data.t});
    if(S.logs.length>500)S.logs.shift();
    bump();
  });
}
(async()=>{if(!window.indexedDB){toast("Ce navigateur ne permet pas de stocker les projets (IndexedDB indisponible).",'err')}render()})();

/* ===== 21-ia-avance.js ===== */
/* ============ IA : résilience, estimation de tokens, mode développeur ============ */

// --- Estimation de tokens (approximation standard ~4 caractères / token) ---
// tiktoken est une lib Python ; ici on estime côté client pour l'affichage.
const estTokens = s => Math.max(1, Math.ceil(String(s ?? '').length / 4));

function estTotalTokens(system, msgs) {
  let n = estTokens(system);
  for (const m of msgs) n += estTokens(m.content) + 4; // +4 de surcoût par message
  return n;
}

// --- Coût approximatif (USD) par million de tokens, à titre indicatif ---
const PRICING = {
  openai: { in: 2.5, out: 10 },      // ex. gpt-4o-mini (indicatif)
  anthropic: { in: 3, out: 15 },     // ex. haiku (indicatif)
  gemini: { in: 0.5, out: 1.5 }
};
function estCost(k, inTok, outTok) {
  const p = PRICING[k];
  if (!p) return null;
  return (inTok * p.in + outTok * p.out) / 1e6;
}

// --- Journal du mode développeur (mémoire + persistance légère) ---
const DEV = { on: false, log: [], last: null };
function devLog(entry) {
  if (typeof ST === 'undefined' || !ST.dev) return;
  entry.t = Date.now();
  DEV.log.push(entry);
  if (DEV.log.length > 300) DEV.log.shift();
  DEV.last = entry;
}
function devClear() { DEV.log = []; DEV.last = null; }

// --- Réessai avec backoff exponentiel + gigue aléatoire ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

// On ne réessaie PAS sur : annulation utilisateur, erreur client 4xx
// (clé invalide, quota, modèle absent) — seul le serveur/timeout/rate-limit l'est.
function isRetryable(e) {
  if (!e) return false;
  if (e.name === 'AbortError') return false;
  if (e instanceof HttpErr) {
    const s = e.status;
    return s >= 500 || s === 408 || s === 429;
  }
  // TypeError = échec réseau (fetch) → réessayable
  return true;
}

// Lit les hyperparamètres réglables (null = laisser le défaut du fournisseur).
function readHyperParams(k) {
  const hp = (ST.hp && typeof ST.hp === 'object') ? ST.hp : {};
  const num = v => (v === '' || v === null || v === undefined || isNaN(+v)) ? null : +v;
  return {
    temperature: num(hp.temperature),
    topP: num(hp.topP),
    freqPenalty: num(hp.freqPenalty),
    presPenalty: num(hp.presPenalty)
  };
}

// Enveloppe résiliente autour de streamChat (défini dans 14-fournisseurs).
// Même contrat : générateur async qui yield des fragments de texte.
// Ajoute : réessai/backoff, journalisation dev, estimation de tokens.
async function* streamChatResilient(k, system, msgs, signal, opts = {}) {
  const maxTry = (opts.tries != null ? opts.tries : 3);
  const hp = readHyperParams(k);
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const inTok = estTotalTokens(system, msgs);
  devLog({ kind: 'req', prov: k, inTok, system, msgs: msgs.map(m => ({ role: m.role, len: m.content.length })), hp });

  let outTok = 0, lastErr = null;
  for (let attempt = 1; attempt <= maxTry; attempt++) {
    try {
      for await (const ch of streamChat(k, system, msgs, signal, hp)) {
        outTok += estTokens(ch);
        yield ch;
      }
      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      devLog({ kind: 'ok', prov: k, attempt, inTok, outTok, ms });
      return;
    } catch (e) {
      lastErr = e;
      if (!isRetryable(e) || attempt >= maxTry || (signal && signal.aborted)) break;
      const wait = Math.min(30000, 500 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 300);
      devLog({ kind: 'retry', prov: k, attempt, wait, err: String((e && e.message) || e) });
      if (typeof setPhase === 'function' && typeof S !== 'undefined' && S.project && S.project.chat.length) {
        try { setPhase({ phase: 'Nouvelle tentative dans ' + Math.round(wait / 1000) + ' s…' }); } catch (_) {}
      }
      await sleep(wait);
    }
  }
  devLog({ kind: 'fail', prov: k, err: String((lastErr && lastErr.message) || lastErr) });
  throw lastErr;
}

// Message d'erreur enrichi : 401/403/429 explicites + proposition de pause sur 429.
function friendlyErrorRich(e, k) {
  if (e && e.name === 'AbortError') return 'Interrompu.';
  if (e instanceof HttpErr) {
    const n = (PROV[k] || { name: k }).name;
    if (e.status === 401 || e.status === 403) return `${n} : clé API invalide ou expirée (${e.status}). Mets à jour la clé dans les paramètres.`;
    if (e.status === 429) return `${n} : limite de requêtes atteinte (429). Attends quelques instants avant de réessayer.`;
    if (e.status === 503) return `${n} : le modèle est momentanément surchargé (503). L'application a déjà réessayé automatiquement. Patiente une minute puis renvoie ta demande, ou choisis un autre modèle dans les paramètres.`;
    if (e.status >= 500) return `${n} : le serveur du fournisseur est indisponible (${e.status}). Réessaie dans un instant.`;
  }
  return friendlyError(e, k);
}

/* ===== 22-securite-rgpd.js ===== */
/* ============ sécurité des clés, RGPD, indicateur IA ============ */

// ---- 1. Chiffrement des clés API au repos (coffre-fort de l'OS en desktop) ----
// En application de bureau, les clés ne sont JAMAIS écrites en clair dans
// studio.settings : on les retire du blob et on les stocke chiffrées à part
// (studio.keys) via safeStorage (DPAPI / Keychain / kwallet). En mode web,
// persistSettings rend 0 et saveSettings retombe sur le stockage local direct.
const hasSecure = () => !!(window.electronAPI && window.electronAPI.secure);

window.persistSettings = (state) => {
  const secure = hasSecure();
  if (!secure) return 0; // pas de coffre disponible -> stockage local (comportement d'origine)
  try {
    const clone = JSON.parse(JSON.stringify(state));
    const plain = {};
    for (const k of Object.keys(clone.p || {})) {
      if (clone.p[k] && clone.p[k].key) { plain[k] = clone.p[k].key; clone.p[k].key = ''; }
    }
    localStorage.setItem('studio.settings', JSON.stringify(clone));
    // Chiffre les clés en arrière-plan et les range dans studio.keys.
    (async () => {
      const enc = {};
      for (const k of Object.keys(plain)) {
        const r = await window.electronAPI.secure.encrypt(plain[k]);
        if (r && r.ok) enc[k] = r.value;
      }
      if (Object.keys(enc).length) localStorage.setItem('studio.keys', JSON.stringify(enc));
    })();
    return 1;
  } catch (e) {
    return 0;
  }
};

// Au démarrage (desktop), recharge les clés déchiffrées dans la config courante.
(function reloadSecureKeys() {  if (!hasSecure()) return;
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('studio.keys') || '{}'); } catch { return; }
  (async () => {
    for (const k of Object.keys(stored)) {
      if (ST.p[k]) {
        const r = await window.electronAPI.secure.decrypt(stored[k]);
        if (r && r.ok && r.value) ST.p[k].key = r.value;
      }
    }
  })();
})();

function secureBackendLabel() {
  if (!hasSecure()) return 'Stockage local du navigateur';
  if (window._secureBackendLabel) return window._secureBackendLabel;
  window._secureBackendLabel = 'Chiffrement au repos';
  window.electronAPI.secure.backend().then(b => {
    window._secureBackendLabel = 'Coffre-fort : ' + ((b && b.label) || 'chiffrement au repos');
    const el = document.getElementById('secure-backend');
    if (el) el.textContent = window._secureBackendLabel;
  }).catch(() => {});
  return window._secureBackendLabel;
}

// ---- 2. RGPD : export des données et suppression définitive ----
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function csvCell(v) {
  const s = String(v == null ? '' : v).replace(/"/g, '""');
  return '"' + s + '"';
}

// Exporte conversations (et projets) au format JSON ou CSV.
function exportUserData(format) {
  format = format || 'json';
  const settings = JSON.parse(JSON.stringify(ST));
  if (settings.p) for (const k of Object.keys(settings.p)) if (settings.p[k]) delete settings.p[k].key;
  const finish = (projects) => {
    const payload = { exportedAt: new Date().toISOString(), app: 'GameCraft Studio', settings, projects };
    if (format === 'csv') {
      const rows = [['projet', 'role', 'horodatage', 'contenu']];
      for (const p of projects) {
        for (const m of (p.chat || [])) {
          rows.push([p.name || p.id, m.role, m.ts ? new Date(m.ts).toISOString() : '', m.raw || m.text || m.full || '']);
        }
      }
      const csv = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
      downloadText('gamecraft-export.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
    } else {
      downloadText('gamecraft-export.json', JSON.stringify(payload, null, 2));
    }
    toast('Export généré (' + format.toUpperCase() + ').');
  };
  if (DB && DB.all) DB.all().then(finish).catch(() => finish([]));
  else finish([]);
}

// Supprime définitivement tout l'historique local (projets, réglages, clés).
async function purgeAllData() {
  const r = await modal({
    title: 'Supprimer toutes mes données',
    html: '<p>Cette action est <b>définitive</b> et supprime :</p><ul><li>tous vos projets et conversations,</li><li>vos préférences,</li><li>vos clés API enregistrées.</li></ul><p>Elle ne peut pas être annulée. Continuer ?</p>',
    ok: 'Supprimer définitivement', danger: true
  });
  if (!r) return;
  try {
    if (DB && DB.all) {
      const all = await DB.all();
      for (const p of all) if (DB.del) await DB.del(p.id);
    }
  } catch {}
  try { localStorage.removeItem('studio.settings'); localStorage.removeItem('studio.keys'); } catch {}
  toast("Données supprimées. L'application va redémarrer.", 'info');
  setTimeout(() => location.reload(), 1200);
}

/* ===== 23-moteurs.js ===== */
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
