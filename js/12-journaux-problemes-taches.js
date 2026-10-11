'use strict';
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
