'use strict';
/* ============ paramètres ============ */
const DEF={theme:'dark',active:'ollama',ctx:40000,maxTok:8192,numCtx:8192,editor:{fs:13,tab:2,wrap:false},sec:{allowAIDelete:true},last:'',
 layout:{chatW:360,sideW:270,bottomH:190,split:.5,chat:true,side:true,bottom:false,mode:'split'},
 hp:{temperature:null,topP:null,freqPenalty:null,presPenalty:null,system:''},
 dev:false,tel:false,
 p:{ollama:{base:'http://localhost:11434',model:''},openai:{base:'https://api.openai.com/v1',key:'',model:''},lmstudio:{base:'http://localhost:1234/v1',key:'',model:''},anthropic:{key:'',model:''},gemini:{key:'',model:''}}};
const PROV={ollama:{name:'Ollama (local)'},openai:{name:'OpenAI / compatible'},lmstudio:{name:'LM Studio (local)'},anthropic:{name:'Anthropic'},gemini:{name:'Google Gemini'}};
function merge(a,b){const o={...a};for(const k in b){o[k]=(a&&a[k]&&typeof a[k]==='object'&&b[k]&&typeof b[k]==='object')?merge(a[k],b[k]):b[k]}return o}
let ST;try{ST=merge(JSON.parse(JSON.stringify(DEF)),JSON.parse(localStorage.getItem('studio.settings')||'{}'))}catch{ST=JSON.parse(JSON.stringify(DEF))}
const saveSettings=()=>{try{(window.persistSettings?window.persistSettings(ST):0)||localStorage.setItem('studio.settings',JSON.stringify(ST))}catch(e){toast("Impossible d'enregistrer les paramètres : "+e.message,'err')}};
const provOK=k=>{const c=ST.p[k];return !!c.model&&(k==='ollama'||k==='lmstudio'?!!c.base:!!c.key&&(k!=='openai'||!!c.base))};
document.documentElement.dataset.theme=ST.theme;
