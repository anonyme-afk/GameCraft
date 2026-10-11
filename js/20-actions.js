'use strict';
/* ============ actions (délégation d'événements) ============ */
const A={
 exportJSON:()=>exportUserData('json'),exportCSV:()=>exportUserData('csv'),purgeAll:()=>purgeAllData(),
 devLogs:async()=>{if(!DEV||!DEV.log.length){const el=$('#dev-last');if(el)el.textContent='Aucun appel pour le moment. Envoie un message à l\'IA puis reviens.';return}const l=DEV.last||DEV.log[DEV.log.length-1];const cost=l.kind==='ok'&&estCost?estCost(l.prov,l.inTok,l.outTok):null;await modal({title:'Dernier appel IA (mode dev)',wide:true,noCancel:true,ok:'Fermer',html:`<div class="dim" style="margin-bottom:8px">Fournisseur <b>${esc(l.prov)}</b>${l.inTok!=null?` · entrée ≈ <b>${l.inTok}</b> tokens`:''}${l.outTok!=null?` · sortie ≈ <b>${l.outTok}</b> tokens`:''}${l.ms!=null?` · latence <b>${l.ms} ms</b>`:''}${cost!=null?` · coût estimé <b>$${cost.toFixed(5)}</b>`:''}</div><div class="diff">${esc(JSON.stringify(l,null,1))}</div>`})},
 nav:el=>nav(el.dataset.v),cmd:el=>{closeMenus();CMD[el.dataset.c]?.f()},
 menu:el=>{const mi=el.parentElement,was=mi.classList.contains('open');closeMenus();if(was)return;mi.classList.add('open');const dd=document.createElement('div');dd.className='dd';dd.innerHTML=MENUS[+el.dataset.i][1].map(id=>`<button data-act="cmd" data-c="${id}"><span>${esc(CMD[id].t)}</span><span class="k">${CMD[id].k||''}</span></button>`).join('');mi.appendChild(dd)},
 sideBtn:el=>{const t=el.dataset.t;if(S.view==='workspace'&&ST.layout.side&&S.rt===t&&el.closest('#activity')){CMD.toggleSide.f();return}sideTab(t)},
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
 pickModel:el=>{ST.p[el.dataset.k].model=el.dataset.m;saveSettings();renderSettings($('#content'));renderTestUI(el.dataset.k);updateStatus()},
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
