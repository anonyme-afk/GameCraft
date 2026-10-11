'use strict';
/* ============ pièces jointes ============ */
async function addAtts(files){for(const f of files){try{S.att.push(await readFile(f))}catch(e){toast(e.message,'err')}}renderAtts()}
function renderAtts(){const h=S.att.map((a,i)=>`<span class="att">${esc(a.name)}<button class="ib" data-act="rmAtt" data-i="${i}" style="width:18px;height:18px">${ico('x')}</button></span>`).join('');['#hatts','#catts'].forEach(s=>{const e=$(s);if(e)e.innerHTML=h})}
function pickFiles(cb,{accept='',multiple=true}={}){const i=$('#finp');i.value='';i.accept=accept;i.multiple=multiple;i.onchange=()=>{const fs=[...i.files];i.value='';if(fs.length)cb(fs)};i.click()}
