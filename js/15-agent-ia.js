'use strict';
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
 if(changes.length){const h={id:uid(),t:Date.now(),prompt,changes:changes.map(c=>({path:c.path,before:c.before,after:c.after}))};p.history.push(h);if(p.history.length>40)p.history.shift();am.hid=h.id;am.changes=changes.map(c=>({path:c.path,add:c.add,del:c.del,isNew:c.isNew,deleted:c.deleted}));for(const c of changes)if(c.after!==null&&!S.tabs.includes(c.path)&&changes.length<=3)S.tabs.push(c.path);if(!S.active)S.active=S.tabs[0]||null;if(S.view==='workspace')setTimeout(runGame,50)}
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
