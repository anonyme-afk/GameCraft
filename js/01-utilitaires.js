'use strict';
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

IC.undo='<path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3"/>';IC.redo='<path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3"/>';IC.image='<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2"/><path d="M3 18l6-5 4 3 3-2 5 4"/>';IC.layers='<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>';
