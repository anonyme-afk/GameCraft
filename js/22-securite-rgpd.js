'use strict';
/* ============ sécurité des clés, RGPD, indicateur IA ============ */

// ---- 1. Chiffrement des clés API au repos (coffre-fort de l'OS en desktop) ----
// En application de bureau, les clés ne sont JAMAIS écrites en clair dans
// studio.settings : on les retire du blob et on les stocke chiffrées à part
// (studio.keys) via safeStorage (DPAPI / Keychain / kwallet). En mode web,
// persistSettings rend 0 et saveSettings retombe sur le stockage local direct.
const hasSecure = () => !!(window.electronAPI && window.electronAPI.secure);

window.persistSettings = (state) => {
  const secure = hasSecure();
  if (!secure) return 0; // pas de coffre disponible -> stockage local (comportement d'origine)
  try {
    const clone = JSON.parse(JSON.stringify(state));
    const plain = {};
    for (const k of Object.keys(clone.p || {})) {
      if (clone.p[k] && clone.p[k].key) { plain[k] = clone.p[k].key; clone.p[k].key = ''; }
    }
    localStorage.setItem('studio.settings', JSON.stringify(clone));
    // Chiffre les clés en arrière-plan et les range dans studio.keys.
    (async () => {
      const enc = {};
      for (const k of Object.keys(plain)) {
        const r = await window.electronAPI.secure.encrypt(plain[k]);
        if (r && r.ok) enc[k] = r.value;
      }
      if (Object.keys(enc).length) localStorage.setItem('studio.keys', JSON.stringify(enc));
    })();
    return 1;
  } catch (e) {
    return 0;
  }
};

// Au démarrage (desktop), recharge les clés déchiffrées dans la config courante.
(function reloadSecureKeys() {  if (!hasSecure()) return;
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem('studio.keys') || '{}'); } catch { return; }
  (async () => {
    for (const k of Object.keys(stored)) {
      if (ST.p[k]) {
        const r = await window.electronAPI.secure.decrypt(stored[k]);
        if (r && r.ok && r.value) ST.p[k].key = r.value;
      }
    }
  })();
})();

function secureBackendLabel() {
  if (!hasSecure()) return 'Stockage local du navigateur';
  if (window._secureBackendLabel) return window._secureBackendLabel;
  window._secureBackendLabel = 'Chiffrement au repos';
  window.electronAPI.secure.backend().then(b => {
    window._secureBackendLabel = 'Coffre-fort : ' + ((b && b.label) || 'chiffrement au repos');
    const el = document.getElementById('secure-backend');
    if (el) el.textContent = window._secureBackendLabel;
  }).catch(() => {});
  return window._secureBackendLabel;
}

// ---- 2. RGPD : export des données et suppression définitive ----
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function csvCell(v) {
  const s = String(v == null ? '' : v).replace(/"/g, '""');
  return '"' + s + '"';
}

// Exporte conversations (et projets) au format JSON ou CSV.
function exportUserData(format) {
  format = format || 'json';
  const settings = JSON.parse(JSON.stringify(ST));
  if (settings.p) for (const k of Object.keys(settings.p)) if (settings.p[k]) delete settings.p[k].key;
  const finish = (projects) => {
    const payload = { exportedAt: new Date().toISOString(), app: 'GameCraft Studio', settings, projects };
    if (format === 'csv') {
      const rows = [['projet', 'role', 'horodatage', 'contenu']];
      for (const p of projects) {
        for (const m of (p.chat || [])) {
          rows.push([p.name || p.id, m.role, m.ts ? new Date(m.ts).toISOString() : '', m.raw || m.text || m.full || '']);
        }
      }
      const csv = rows.map(r => r.map(csvCell).join(',')).join('\r\n');
      downloadText('gamecraft-export.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
    } else {
      downloadText('gamecraft-export.json', JSON.stringify(payload, null, 2));
    }
    toast('Export généré (' + format.toUpperCase() + ').');
  };
  if (DB && DB.all) DB.all().then(finish).catch(() => finish([]));
  else finish([]);
}

// Supprime définitivement tout l'historique local (projets, réglages, clés).
async function purgeAllData() {
  const r = await modal({
    title: 'Supprimer toutes mes données',
    html: '<p>Cette action est <b>définitive</b> et supprime :</p><ul><li>tous vos projets et conversations,</li><li>vos préférences,</li><li>vos clés API enregistrées.</li></ul><p>Elle ne peut pas être annulée. Continuer ?</p>',
    ok: 'Supprimer définitivement', danger: true
  });
  if (!r) return;
  try {
    if (DB && DB.all) {
      const all = await DB.all();
      for (const p of all) if (DB.del) await DB.del(p.id);
    }
  } catch {}
  try { localStorage.removeItem('studio.settings'); localStorage.removeItem('studio.keys'); } catch {}
  toast("Données supprimées. L'application va redémarrer.", 'info');
  setTimeout(() => location.reload(), 1200);
}
