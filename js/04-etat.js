'use strict';
/* ============ état ============ */
const S={view:'home',project:null,out:[],phase:'',sel:null,creating:null,scat:'general',tabs:[],active:null,rt:'files',bt:'console',busy:false,ctl:null,unsaved:new Set(),logs:[],rtErr:[],tasks:[],save:'ok',saveMsg:'',att:[],kind:'2d',collapsed:new Set(),tests:{},pos:{},q:'',hp:'',asel:null,pf:'',list:[]};
let PROJ=[];
async function refreshProjects(){try{PROJ=(await DB.all()).sort((a,b)=>b.updated-a.updated)}catch(e){PROJ=[];toast('Lecture des projets impossible : '+e.message,'err')}}
const flushSave=async()=>{const p=S.project;if(!p)return;p.updated=Date.now();p.ui={tabs:[...S.tabs],active:S.active};try{await DB.put(p);if(window.electronAPI?.fs){await window.electronAPI.fs.saveProjectToDisk(p)}S.unsaved.clear();S.save='ok';$$('.tab.mod').forEach(t=>t.classList.remove('mod'))}catch(e){S.save='err';S.saveMsg=e.message;toast("Échec de l'enregistrement : "+e.message,'err')}updateStatus()};
const saveSoon=debounce(flushSave,500);
const touch=()=>{S.save='dirty';updateStatus();saveSoon()};
