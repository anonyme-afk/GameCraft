// electron/lib/agent-planner.js
// Orchestrateur d'agents — logique PURE et testable (aucune dépendance Electron).
// C'est la couche de coordination du cahier des charges (§3-4) : graphe de
// tâches à états réels, dépendances, concurrence limitée, détection de conflits
// de fichiers (deux agents ne touchent jamais le même fichier en parallèle),
// annulation et reprise. Les agents eux-mêmes (appels au modèle) restent dans
// le processus principal ; ce module décide QUOI lancer et QUAND.

let counter = 0;
function uid(prefix) {
  counter += 1;
  return `${prefix || 't'}${Date.now().toString(36)}${counter.toString(36)}`;
}

// États réels d'une tâche (jamais simulés).
const STATE = {
  PENDING: 'pending',     // créée, attend ses dépendances
  READY: 'ready',         // dépendances satisfaites, peut démarrer
  RUNNING: 'running',     // en cours
  DONE: 'done',           // terminée avec succès
  FAILED: 'failed',       // échouée, relançable
  BLOCKED: 'blocked',     // une dépendance a échoué / a été annulée
  CANCELLED: 'cancelled'  // annulée par l'utilisateur
};

// Crée une tâche. `files` = liste des chemins que l'agent va modifier
// (sert à la détection de conflits). `deps` = ids des tâches dont elle dépend.
function createTask({ title, role, files, deps, payload }) {
  if (!title || typeof title !== 'string') {
    throw new Error('createTask: "title" est requis');
  }
  return {
    id: uid('task'),
    title,
    role: role || 'generic',
    files: Array.isArray(files) ? files.slice() : [],
    deps: Array.isArray(deps) ? deps.slice() : [],
    payload: payload === undefined ? null : payload,
    state: STATE.PENDING,
    result: null,
    error: null
  };
}

// Ajoute une tâche au plan et la renvoie.
function addTask(plan, task) {
  plan.tasks.push(task);
  return task;
}

// Renvoie une tâche par son id, ou null.
function getTask(plan, id) {
  return plan.tasks.find(t => t.id === id) || null;
}

// Valide le graphe : dépendances inconnues et cycles. Renvoie un tableau
// d'erreurs (vide = plan valide). Détection de cycle par DFS 3 couleurs.
function validatePlan(plan) {
  const errors = [];
  const ids = new Set(plan.tasks.map(t => t.id));

  for (const t of plan.tasks) {
    for (const d of t.deps) {
      if (!ids.has(d)) {
        errors.push(`Tâche « ${t.title} » dépend d'un id inconnu : ${d}`);
      }
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(plan.tasks.map(t => [t.id, WHITE]));
  const visit = (id, stack) => {
    color.set(id, GRAY);
    const t = getTask(plan, id);
    if (!t) return;
    for (const d of t.deps) {
      if (!ids.has(d)) continue;
      if (color.get(d) === GRAY) {
        errors.push(`Cycle détecté : ${[...stack, id, d].join(' -> ')}`);
      } else if (color.get(d) === WHITE) {
        visit(d, [...stack, id]);
      }
    }
    color.set(id, BLACK);
  };
  for (const t of plan.tasks) {
    if (color.get(t.id) === WHITE) visit(t.id, []);
  }

  return errors;
}

// Crée un plan vide.
function createPlan(name) {
  return { id: uid('plan'), name: name || 'Plan', tasks: [] };
}

// Tâches "prêtes" : toutes leurs dépendances sont DONE, et elles-mêmes encore
// PENDING/READY (jamais déjà RUNNING/DONE/FAILED/CANCELLED/BLOCKED).
function readyTasks(plan) {
  const byId = new Map(plan.tasks.map(t => [t.id, t]));
  return plan.tasks.filter(t => {
    if (t.state !== STATE.PENDING && t.state !== STATE.READY) return false;
    return t.deps.every(d => {
      const dep = byId.get(d);
      return !!dep && dep.state === STATE.DONE;
    });
  });
}

// Conflits de fichiers : deux tâches qui partagent un chemin ne doivent jamais
// tourner en parallèle (elles écriraient le même fichier). Renvoie
// un tableau { file, tasks:[ids] } pour chaque fichier partagé.
function detectFileConflicts(tasks) {
  const byFile = new Map();
  for (const t of tasks) {
    for (const f of t.files) {
      if (!byFile.has(f)) byFile.set(f, []);
      byFile.get(f).push(t.id);
    }
  }
  const conflicts = [];
  for (const [file, ids] of byFile) {
    if (ids.length > 1) conflicts.push({ file, tasks: ids.slice() });
  }
  return conflicts;
}

// Sélectionne, parmi les tâches prêtes, celles démarrables MAINTENANT sans
// dépasser maxConcurrency ET sans conflit de fichier avec ce qui tourne déjà.
// Ne marque rien : utilise claimTasks() ensuite.
function selectStartable(plan, maxConcurrency) {
  const running = plan.tasks.filter(t => t.state === STATE.RUNNING);
  let slots = Math.max(0, (maxConcurrency || 1) - running.length);
  const claimedFiles = new Set();
  for (const t of running) for (const f of t.files) claimedFiles.add(f);
  const startable = [];
  for (const t of readyTasks(plan)) {
    if (slots <= 0) break;
    if (t.files.some(f => claimedFiles.has(f))) continue; // conflit → on saute
    startable.push(t);
    for (const f of t.files) claimedFiles.add(f);
    slots -= 1;
  }
  return startable;
}

// Passe les tâches sélectionnées de PENDING/READY à RUNNING.
function claimTasks(tasks) {
  for (const t of tasks) {
    if (t.state === STATE.PENDING || t.state === STATE.READY) t.state = STATE.RUNNING;
  }
  return tasks;
}

function markDone(task, result) {
  task.state = STATE.DONE;
  task.result = result === undefined ? null : result;
  task.error = null;
  return task;
}

function markFailed(task, error) {
  task.state = STATE.FAILED;
  task.error = error ? String(error) : 'erreur inconnue';
  return task;
}

function markCancelled(task) {
  task.state = STATE.CANCELLED;
  return task;
}

// Propage BLOCKED : toute tâche encore PENDING/READY dont une dépendance est
// FAILED ou CANCELLED devient BLOCKED (transitivement). Renvoie les ids bloqués.
function propagateBlocked(plan) {
  const bad = new Set(
    plan.tasks.filter(t => t.state === STATE.FAILED || t.state === STATE.CANCELLED).map(t => t.id)
  );
  const blocked = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of plan.tasks) {
      if (t.state !== STATE.PENDING && t.state !== STATE.READY) continue;
      if (t.deps.some(d => bad.has(d))) {
        t.state = STATE.BLOCKED;
        blocked.push(t.id);
        bad.add(t.id);
        changed = true;
      }
    }
  }
  return blocked;
}

// Le plan est-il terminé ? (rien de PENDING/READY/RUNNING restant)
function isFinished(plan) {
  return plan.tasks.every(t =>
    t.state === STATE.DONE ||
    t.state === STATE.FAILED ||
    t.state === STATE.CANCELLED ||
    t.state === STATE.BLOCKED
  );
}

// Compteurs par état pour l'UI (tous les états, même à 0).
function stats(plan) {
  const out = {
    total: plan.tasks.length,
    pending: 0, ready: 0, running: 0, done: 0, failed: 0, blocked: 0, cancelled: 0
  };
  for (const t of plan.tasks) out[t.state] = (out[t.state] || 0) + 1;
  return out;
}

// Relance une tâche FAILED (retour en READY). Refuse si elle n'est pas en échec.
function retryTask(plan, id) {
  const t = getTask(plan, id);
  if (!t) throw new Error(`retryTask: tâche inconnue ${id}`);
  if (t.state !== STATE.FAILED) {
    throw new Error(`retryTask: la tâche « ${t.title} » n'est pas en échec (état: ${t.state})`);
  }
  t.state = STATE.READY;
  t.error = null;
  return t;
}

module.exports = {
  STATE,
  uid,
  createPlan,
  createTask,
  addTask,
  getTask,
  validatePlan,
  readyTasks,
  detectFileConflicts,
  selectStartable,
  claimTasks,
  markDone,
  markFailed,
  markCancelled,
  propagateBlocked,
  isFinished,
  stats,
  retryTask
};
