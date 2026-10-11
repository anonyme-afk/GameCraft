'use strict';
/* ============ stockage des projets (IndexedDB) ============ */
const DB={_d:null,open(){return this._d||(this._d=new Promise((res,rej)=>{const r=indexedDB.open('studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
 async tx(mode,fn){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('projects',mode);const q=fn(t.objectStore('projects'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
 all(){return this.tx('readonly',s=>s.getAll())},put(p){return this.tx('readwrite',s=>s.put(p))},del(id){return this.tx('readwrite',s=>s.delete(id))}};
