'use strict';
/* ============ onglets ============ */
function renderTabs(){const t=$('#tabs');if(!t)return;t.innerHTML=S.tabs.map(p=>`<div class="tab${p===S.active?' on':''}${S.unsaved.has(p)?' mod':''}" data-act="tab" data-p="${esc(p)}" title="${esc(p)}">${esc(p.split('/').pop())}<span class="dot"></span><button class="ib" data-act="closeTab" data-p="${esc(p)}" title="Fermer">${ico('x')}</button></div>`).join('')}
