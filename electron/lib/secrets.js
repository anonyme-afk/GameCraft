'use strict';
/* Coffre-fort local pour les clés API.
   En application de bureau, on s'appuie sur safeStorage d'Electron, qui
   délègue au coffre-fort NATIF du système :
     - Windows : DPAPI (Credential Manager / chiffrement lié au compte user)
     - macOS   : Keychain
     - Linux   : kwallet / libsecret
   À défaut (safeStorage indisponible, ex. vieille plateforme), on retombe sur
   un chiffrement AES-256-GCM local avec une clé dérivée (PBKDF2) et un sel
   aléatoire — mieux que du texte clair, sans prétendre à la robustesse d'un
   coffre système. Aucune clé n'est jamais envoyée sur un réseau. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let safeStorage = null;
try {
  // safeStorage n'est dispo que dans le processus principal Electron.
  safeStorage = require('electron').safeStorage || null;
} catch {
  safeStorage = null;
}

const ALGO = 'aes-256-gcm';
const SALT_LEN = 16;
const IV_LEN = 12;

// Dérive une clé de 32 octets à partir d'une graine locale fixe.
function deriveKey(salt) {
  return crypto.pbkdf2Sync('gamecraft-local-secret-v1', salt, 100000, 32, 'sha512');
}

function aesEncrypt(plain) {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(salt);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format : salt | iv | tag | ciphertext  (tout en base64)
  return Buffer.concat([salt, iv, tag, enc]).toString('base64');
}

function aesDecrypt(b64) {
  const raw = Buffer.from(String(b64), 'base64');
  if (raw.length < SALT_LEN + IV_LEN + 16) throw new Error('donnée corrompue');
  const salt = raw.subarray(0, SALT_LEN);
  const iv = raw.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = raw.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + 16);
  const enc = raw.subarray(SALT_LEN + IV_LEN + 16);
  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function isNativeAvailable() {
  try { return !!(safeStorage && safeStorage.isEncryptionAvailable()); }
  catch { return false; }
}

// Chiffre une valeur. Retourne un préfixe indiquant la méthode, pour que le
// déchiffrement sache comment procéder :
//   "native:" + base64   -> coffre-fort OS (safeStorage)
//   "aes:" + base64      -> repli AES-256-GCM local
function encrypt(plain) {
  if (isNativeAvailable()) return 'native:' + safeStorage.encryptString(String(plain)).toString('base64');
  return 'aes:' + aesEncrypt(plain);
}

function decrypt(stored) {
  const s = String(stored || '');
  if (s.startsWith('native:')) return safeStorage.decryptString(Buffer.from(s.slice(7), 'base64'));
  if (s.startsWith('aes:')) return aesDecrypt(s.slice(4));
  // valeur historique en clair : on la renvoie telle quelle (migration douce)
  return s;
}

function backend() {
  if (isNativeAvailable()) {
    const p = process.platform;
    const name = p === 'win32' ? 'DPAPI (Windows)' : p === 'darwin' ? 'Keychain (macOS)' : 'kwallet/libsecret (Linux)';
    return { mode: 'native', label: name };
  }
  return { mode: 'aes', label: 'AES-256-GCM (local)' };
}

module.exports = { encrypt, decrypt, isNativeAvailable, backend, aesEncrypt, aesDecrypt };
