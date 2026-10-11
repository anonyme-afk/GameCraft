'use strict';
/* ============ IA : résilience, estimation de tokens, mode développeur ============ */

// --- Estimation de tokens (approximation standard ~4 caractères / token) ---
// tiktoken est une lib Python ; ici on estime côté client pour l'affichage.
const estTokens = s => Math.max(1, Math.ceil(String(s ?? '').length / 4));

function estTotalTokens(system, msgs) {
  let n = estTokens(system);
  for (const m of msgs) n += estTokens(m.content) + 4; // +4 de surcoût par message
  return n;
}

// --- Coût approximatif (USD) par million de tokens, à titre indicatif ---
const PRICING = {
  openai: { in: 2.5, out: 10 },      // ex. gpt-4o-mini (indicatif)
  anthropic: { in: 3, out: 15 },     // ex. haiku (indicatif)
  gemini: { in: 0.5, out: 1.5 }
};
function estCost(k, inTok, outTok) {
  const p = PRICING[k];
  if (!p) return null;
  return (inTok * p.in + outTok * p.out) / 1e6;
}

// --- Journal du mode développeur (mémoire + persistance légère) ---
const DEV = { on: false, log: [], last: null };
function devLog(entry) {
  if (typeof ST === 'undefined' || !ST.dev) return;
  entry.t = Date.now();
  DEV.log.push(entry);
  if (DEV.log.length > 300) DEV.log.shift();
  DEV.last = entry;
}
function devClear() { DEV.log = []; DEV.last = null; }

// --- Réessai avec backoff exponentiel + gigue aléatoire ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

// On ne réessaie PAS sur : annulation utilisateur, erreur client 4xx
// (clé invalide, quota, modèle absent) — seul le serveur/timeout/rate-limit l'est.
function isRetryable(e) {
  if (!e) return false;
  if (e.name === 'AbortError') return false;
  if (e instanceof HttpErr) {
    const s = e.status;
    return s >= 500 || s === 408 || s === 429;
  }
  // TypeError = échec réseau (fetch) → réessayable
  return true;
}

// Lit les hyperparamètres réglables (null = laisser le défaut du fournisseur).
function readHyperParams(k) {
  const hp = (ST.hp && typeof ST.hp === 'object') ? ST.hp : {};
  const num = v => (v === '' || v === null || v === undefined || isNaN(+v)) ? null : +v;
  return {
    temperature: num(hp.temperature),
    topP: num(hp.topP),
    freqPenalty: num(hp.freqPenalty),
    presPenalty: num(hp.presPenalty)
  };
}

// Enveloppe résiliente autour de streamChat (défini dans 14-fournisseurs).
// Même contrat : générateur async qui yield des fragments de texte.
// Ajoute : réessai/backoff, journalisation dev, estimation de tokens.
async function* streamChatResilient(k, system, msgs, signal, opts = {}) {
  const maxTry = (opts.tries != null ? opts.tries : 3);
  const hp = readHyperParams(k);
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const inTok = estTotalTokens(system, msgs);
  devLog({ kind: 'req', prov: k, inTok, system, msgs: msgs.map(m => ({ role: m.role, len: m.content.length })), hp });

  let outTok = 0, lastErr = null;
  for (let attempt = 1; attempt <= maxTry; attempt++) {
    try {
      for await (const ch of streamChat(k, system, msgs, signal, hp)) {
        outTok += estTokens(ch);
        yield ch;
      }
      const ms = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      devLog({ kind: 'ok', prov: k, attempt, inTok, outTok, ms });
      return;
    } catch (e) {
      lastErr = e;
      if (!isRetryable(e) || attempt >= maxTry || (signal && signal.aborted)) break;
      const wait = Math.min(30000, 500 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 300);
      devLog({ kind: 'retry', prov: k, attempt, wait, err: String((e && e.message) || e) });
      if (typeof setPhase === 'function' && typeof S !== 'undefined' && S.project && S.project.chat.length) {
        try { setPhase({ phase: 'Nouvelle tentative dans ' + Math.round(wait / 1000) + ' s…' }); } catch (_) {}
      }
      await sleep(wait);
    }
  }
  devLog({ kind: 'fail', prov: k, err: String((lastErr && lastErr.message) || lastErr) });
  throw lastErr;
}

// Message d'erreur enrichi : 401/403/429 explicites + proposition de pause sur 429.
function friendlyErrorRich(e, k) {
  if (e && e.name === 'AbortError') return 'Interrompu.';
  if (e instanceof HttpErr) {
    const n = (PROV[k] || { name: k }).name;
    if (e.status === 401 || e.status === 403) return `${n} : clé API invalide ou expirée (${e.status}). Mets à jour la clé dans les paramètres.`;
    if (e.status === 429) return `${n} : limite de requêtes atteinte (429). Attends quelques instants avant de réessayer.`;
  }
  return friendlyError(e, k);
}
