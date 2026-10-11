'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const secrets = require('../electron/lib/secrets');

test('aesEncrypt/aesDecrypt fait un aller-retour fidèle', () => {
  const plain = 'sk-ma-cle-ultra-secrete-123456';
  const enc = secrets.aesEncrypt(plain);
  assert.notStrictEqual(enc, plain);
  assert.ok(enc.length > plain.length);
  assert.strictEqual(secrets.aesDecrypt(enc), plain);
});

test('aesEncrypt produit un sel différent à chaque appel (non déterministe)', () => {
  const a = secrets.aesEncrypt('meme-valeur');
  const b = secrets.aesEncrypt('meme-valeur');
  assert.notStrictEqual(a, b);
  assert.strictEqual(secrets.aesDecrypt(a), 'meme-valeur');
  assert.strictEqual(secrets.aesDecrypt(b), 'meme-valeur');
});

test('aesDecrypt rejette une donnée corrompue', () => {
  assert.throws(() => secrets.aesDecrypt(Buffer.from('trop-court').toString('base64')));
});

test('encrypt/decrypt fait un aller-retour (native ou repli AES)', () => {
  const plain = 'cle-api-de-test';
  const stored = secrets.encrypt(plain);
  assert.ok(stored.startsWith('native:') || stored.startsWith('aes:'), 'préfixe de méthode attendu');
  assert.strictEqual(secrets.decrypt(stored), plain);
});

test('decrypt reste tolérant sur une ancienne valeur en clair (migration)', () => {
  assert.strictEqual(secrets.decrypt('valeur-historique-en-clair'), 'valeur-historique-en-clair');
});

test('backend() renvoie un mode connu', () => {
  const b = secrets.backend();
  assert.ok(['native', 'aes'].includes(b.mode));
  assert.ok(typeof b.label === 'string' && b.label.length > 0);
});
