// tests/agent-planner.test.js
// Tests de l'orchestrateur d'agents (logique pure, sans Electron).
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../electron/lib/agent-planner');

// ---------- createTask / createPlan ----------
test('createTask remplit les champs par défaut', () => {
  const t = P.createTask({ title: 'Écrire game.js' });
  assert.equal(t.title, 'Écrire game.js');
  assert.equal(t.role, 'generic');
  assert.deepEqual(t.files, []);
  assert.deepEqual(t.deps, []);
  assert.equal(t.state, P.STATE.PENDING);
  assert.equal(t.result, null);
  assert.equal(t.error, null);
  assert.ok(t.id.startsWith('task'));
});

test('createTask refuse un titre vide', () => {
  assert.throws(() => P.createTask({}), /title/);
});

test('createTask copie les tableaux files/deps (pas de référence partagée)', () => {
  const files = ['game.js'];
  const t = P.createTask({ title: 'x', files, deps: [] });
  files.push('autre.js');
  assert.deepEqual(t.files, ['game.js']);
});

test('uid génère des identifiants uniques', () => {
  const a = P.uid('t');
  const b = P.uid('t');
  assert.notEqual(a, b);
});

// ---------- validatePlan : dépendances inconnues ----------
test('validatePlan signale une dépendance à un id inconnu', () => {
  const plan = P.createPlan('p');
  P.addTask(plan, P.createTask({ title: 'A', deps: ['inexistant'] }));
  const errors = P.validatePlan(plan);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /id inconnu/);
});

// ---------- validatePlan : cycles ----------
test('validatePlan détecte un cycle A->B->A', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  const b = P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  a.deps.push(b.id); // ferme le cycle
  const errors = P.validatePlan(plan);
  assert.ok(errors.some(e => /Cycle/.test(e)));
});

test('validatePlan accepte un graphe acyclique valide', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  assert.deepEqual(P.validatePlan(plan), []);
});


// ---------- readyTasks : respect des dépendances ----------
test('readyTasks ne renvoie une tâche que si ses dépendances sont DONE', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  assert.deepEqual(P.readyTasks(plan).map(t => t.title), ['A']);
  P.markDone(a, 'ok');
  assert.deepEqual(P.readyTasks(plan).map(t => t.title), ['B']);
});

// ---------- detectFileConflicts ----------
test('detectFileConflicts repère un fichier partagé', () => {
  const a = P.createTask({ title: 'A', files: ['game.js'] });
  const b = P.createTask({ title: 'B', files: ['game.js'] });
  const c = P.createTask({ title: 'C', files: ['style.css'] });
  const conflicts = P.detectFileConflicts([a, b, c]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].file, 'game.js');
  assert.deepEqual(conflicts[0].tasks.slice().sort(), [a.id, b.id].sort());
});

test('detectFileConflicts ne renvoie rien sans chevauchement', () => {
  const a = P.createTask({ title: 'A', files: ['a.js'] });
  const b = P.createTask({ title: 'B', files: ['b.js'] });
  assert.deepEqual(P.detectFileConflicts([a, b]), []);
});

// ---------- selectStartable : concurrence + conflits ----------
test('selectStartable respecte maxConcurrency', () => {
  const plan = P.createPlan('p');
  P.addTask(plan, P.createTask({ title: 'A', files: ['a.js'] }));
  P.addTask(plan, P.createTask({ title: 'B', files: ['b.js'] }));
  P.addTask(plan, P.createTask({ title: 'C', files: ['c.js'] }));
  assert.equal(P.selectStartable(plan, 2).length, 2);
});

test('selectStartable ne démarre jamais deux tâches sur le même fichier', () => {
  const plan = P.createPlan('p');
  P.addTask(plan, P.createTask({ title: 'A', files: ['part.js'] }));
  P.addTask(plan, P.createTask({ title: 'B', files: ['part.js'] }));
  assert.equal(P.selectStartable(plan, 3).length, 1);
});

test('selectStartable tient compte des tâches déjà RUNNING', () => {
  const plan = P.createPlan('p');
  const running = P.addTask(plan, P.createTask({ title: 'RUN', files: ['busy.js'] }));
  running.state = P.STATE.RUNNING;
  P.addTask(plan, P.createTask({ title: 'Conflit', files: ['busy.js'] }));
  P.addTask(plan, P.createTask({ title: 'Libre', files: ['free.js'] }));
  assert.deepEqual(P.selectStartable(plan, 2).map(t => t.title), ['Libre']);
});

// ---------- claimTasks / markDone / markFailed ----------
test('claimTasks passe les tâches en RUNNING', () => {
  const a = P.createTask({ title: 'A' });
  P.claimTasks([a]);
  assert.equal(a.state, P.STATE.RUNNING);
});

test('markDone enregistre le résultat et nettoie l\'erreur', () => {
  const t = P.createTask({ title: 'A' });
  t.error = 'ancienne';
  P.markDone(t, { ok: 1 });
  assert.equal(t.state, P.STATE.DONE);
  assert.deepEqual(t.result, { ok: 1 });
  assert.equal(t.error, null);
});

test('markFailed stocke le message d\'erreur', () => {
  const t = P.createTask({ title: 'A' });
  P.markFailed(t, new Error('boom'));
  assert.equal(t.state, P.STATE.FAILED);
  assert.equal(t.error, 'Error: boom');
});

// ---------- propagateBlocked (transitivité) ----------
test('propagateBlocked bloque les dépendants, transitivement', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  const b = P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  P.addTask(plan, P.createTask({ title: 'C', deps: [b.id] }));
  P.markFailed(a, 'KO');
  const blocked = P.propagateBlocked(plan);
  assert.equal(b.state, P.STATE.BLOCKED);
  assert.equal(blocked.length, 2); // B et C
});

test('propagateBlocked ne touche pas une tâche sans dépendance en échec', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  P.markDone(a);
  const b = P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  assert.deepEqual(P.propagateBlocked(plan), []);
  assert.equal(b.state, P.STATE.PENDING);
});

// ---------- isFinished / stats ----------
test('isFinished est vrai quand tout atteint un état terminal', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  const b = P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  P.markDone(a);
  P.markFailed(b, 'x');
  P.propagateBlocked(plan);
  assert.ok(P.isFinished(plan));
});

test('isFinished est faux tant qu\'une tâche est PENDING', () => {
  const plan = P.createPlan('p');
  P.addTask(plan, P.createTask({ title: 'A' }));
  assert.equal(P.isFinished(plan), false);
});

test('stats compte chaque état', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  P.addTask(plan, P.createTask({ title: 'B', deps: [a.id] }));
  P.markDone(a);
  const s = P.stats(plan);
  assert.equal(s.total, 2);
  assert.equal(s.done, 1);
  assert.equal(s.pending, 1);
});

// ---------- retryTask / markCancelled ----------
test('retryTask remet une tâche FAILED en READY', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  P.markFailed(a, 'x');
  P.retryTask(plan, a.id);
  assert.equal(a.state, P.STATE.READY);
  assert.equal(a.error, null);
});

test('retryTask refuse une tâche qui n\'est pas en échec', () => {
  const plan = P.createPlan('p');
  const a = P.addTask(plan, P.createTask({ title: 'A' }));
  assert.throws(() => P.retryTask(plan, a.id), /pas en échec/);
});

test('markCancelled annule une tâche', () => {
  const t = P.createTask({ title: 'A' });
  P.markCancelled(t);
  assert.equal(t.state, P.STATE.CANCELLED);
});
