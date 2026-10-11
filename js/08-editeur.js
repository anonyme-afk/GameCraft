'use strict';
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
