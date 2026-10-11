'use strict';
/* ============ coloration syntaxique ============ */
const RX={js:/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|do|class|new|this|import|export|from|async|await|switch|case|break|continue|of|in|typeof|instanceof|true|false|null|undefined|extends|super|try|catch|finally|throw|default|static|void|delete)\b|\b(\d+(?:\.\d+)?)\b/g,
 css:/(\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#[0-9a-fA-F]{3,8}\b)|(-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b)/g,
 html:/(<!-{2}[\s\S]*?-{2}>)|(<\/?[a-zA-Z][^>]*>)/g,
 json:/("(?:[^"\\\n]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g};
const CL={js:['c','s','k','n'],css:['c','s','k','n'],html:['c','t'],json:['s','k','n']};
const langOf=p=>({js:'js',mjs:'js',css:'css',html:'html',htm:'html',json:'json'})[ext(p)];
function hl(t,lang){const rx=RX[lang];if(!rx||t.length>400000)return esc(t)+'\n';const cl=CL[lang];let o='',last=0,m;rx.lastIndex=0;while((m=rx.exec(t))){if(m[0]===''){rx.lastIndex++;continue}o+=esc(t.slice(last,m.index));let gi=1;while(m[gi]===undefined)gi++;o+=`<span class="tk-${cl[gi-1]}">${esc(m[0])}</span>`;last=m.index+m[0].length}return o+esc(t.slice(last))+'\n'}
