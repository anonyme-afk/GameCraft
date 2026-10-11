'use strict';
/* ============ thème et disposition ============ */
function toggleTheme(){ST.theme=ST.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=ST.theme;saveSettings();updateStatus();if(S.view==='settings')renderSettings($('#content'))}
function setMode(m){ST.layout.mode=m;applyLayout();saveSettings();renderVModes()}
function renderVModes(){const v=$('#vmodes');if(!v)return;v.innerHTML=[['code','Code seul','code'],['split','Code et aperçu','split'],['preview','Aperçu seul','play']].map(([m,t,i])=>`<button class="ib${ST.layout.mode===m?' on':''}" data-act="cmd" data-c="mode${m[0].toUpperCase()+m.slice(1)}" title="${t}">${ico(i)}</button>`).join('')}
function applyLayout(){const w=$('#ws');if(!w)return;const L=ST.layout;w.style.setProperty('--chatW',L.chatW+'px');w.style.setProperty('--sideW',L.sideW+'px');w.style.setProperty('--bottomH',L.bottomH+'px');
 $('#chatp').hidden=!L.chat;$('[data-r=chat]').hidden=!L.chat;$('#sidep').hidden=!L.side;$('[data-r=side]').hidden=!L.side;$('#bottomp').hidden=!L.bottom;$('[data-r=bottom]').hidden=!L.bottom;
 $('#edpane').hidden=L.mode==='preview';$('#pvpane').hidden=L.mode==='code';$('[data-r=split]').hidden=L.mode!=='split';$('#edpane').style.flexGrow=L.mode==='split'?L.split:1;$('#pvpane').style.flexGrow=L.mode==='split'?1-L.split:1;renderVModes()}
addEventListener('pointerdown',e=>{const r=e.target.closest&&e.target.closest('.rz');if(!r)return;e.preventDefault();const k=r.dataset.r,L=ST.layout,sx=e.clientX,sy=e.clientY,o={...L};document.body.classList.add('drag');
 const mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(k==='chat')L.chatW=clamp(o.chatW+dx,240,720);if(k==='side')L.sideW=clamp(o.sideW-dx,200,620);if(k==='bottom')L.bottomH=clamp(o.bottomH-dy,80,520);if(k==='split'){const wr=$('#workarea').getBoundingClientRect();L.split=clamp((ev.clientX-wr.left)/wr.width,.15,.85)}applyLayout()};
 const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);document.body.classList.remove('drag');saveSettings()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
