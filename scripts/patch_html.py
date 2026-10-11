with open('studio.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix pImport corrupted line
target_pimport = """  pImport:()=>pickFiles(async fs=>{for(const f of fs){try{const j=JSON.parse(await f.text());if(!j||!j.studioProject||typeof j.files!=='object'||  fixProbs:el=>{const m=S.project.chat[+el.dataset.i];if(m&&m.verify)runAI('Corrige ces problèmes détectés automatiquement :\\n- '+m.verify.bad.join('\\n- '))},"""
repl_pimport = """  pImport:()=>pickFiles(async fs=>{for(const f of fs){try{const j=JSON.parse(await f.text());if(!j||!j.studioProject||typeof j.files!=='object'||typeof j.name!=='string')throw new Error('format de projet non reconnu');for(const [k,v] of Object.entries(j.files)){if(!cleanPath(k)||!v||(v.t!=='text'&&v.t!=='bin'))throw new Error('fichier invalide dans le projet : '+k)}delete j.studioProject;j.id=uid();j.name=j.name+' (importé)';j.updated=Date.now();j.chat=j.chat||[];j.history=j.history||[];j.type=j.type==='3d'?'3d':j.type==='godot'?'godot':'2d';await DB.put(j);toast('Projet importé : '+j.name)}catch(e){toast('Import impossible ('+f.name+') : '+e.message,'err')}}renderProjects($('#content'))},{accept:'.json',multiple:true}),
  fixProbs:el=>{const m=S.project.chat[+el.dataset.i];if(m&&m.verify)runAI('Corrige ces problèmes détectés automatiquement :\\n- '+m.verify.bad.join('\\n- '))},"""

if target_pimport in content:
    content = content.replace(target_pimport, repl_pimport)
    print("Fixed pImport successfully")
else:
    print("target_pimport not found directly, trying lenient replace")
    idx = content.find("pImport:()=>pickFiles")
    idx_end = content.find("fixErrors:", idx)
    if idx >= 0 and idx_end >= 0:
        content = content[:idx] + repl_pimport + "\n " + content[idx_end:]
        print("Lenient replace for pImport succeeded")

# 2. Fix the duplicated tail after onEngineLog
marker = "window.electronAPI.engine?.onEngineLog(data=>{"
idx_m = content.find(marker)
if idx_m >= 0:
    # Find the end of this block
    close_brace = content.find("}\n(async()=>", idx_m)
    if close_brace >= 0:
        correct_tail = """}
(async()=>{if(!window.indexedDB){toast("Ce navigateur ne permet pas de stocker les projets (IndexedDB indisponible).",'err')}render()})();
</script>
</body>
</html>
"""
        content = content[:close_brace] + correct_tail
        print("Fixed tail successfully")

with open('studio.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("studio.html updated.")
