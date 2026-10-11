'use strict';
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
