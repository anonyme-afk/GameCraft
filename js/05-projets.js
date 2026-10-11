'use strict';
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
async function createProjectFromDialog(){const r=await modal({title:'Nouveau projet',fields:[{k:'name',label:'Nom du projet',value:'Mon jeu'},{k:'kind',label:'Type',type:'select',value:'2d',opts:[['2d','2D (Canvas)'],['3d','3D (Three.js)'],['godot','Godot Engine 4 (GDScript)']]}],ok:'Créer'});if(!r||!r.name.trim())return;const p=newProject(r.name.trim(),r.kind);try{await DB.put(p);if(window.electronAPI?.fs){await window.electronAPI.fs.saveProjectToDisk(p)}}catch(e){toast('Création impossible : '+e.message,'err');return}await refreshProjects();openProject(p)}
