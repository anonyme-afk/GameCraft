# 🎮 GameCraft Studio

Studio professionnel de création de jeux vidéo assistée par IA. Application de
bureau (Electron) qui fonctionne aussi comme simple page web. Décris un jeu en
français, l'IA génère les fichiers du projet, l'aperçu s'exécute immédiatement.

## ✨ Fonctionnalités

- **Plusieurs fournisseurs d'IA** : Ollama (local), OpenAI, Anthropic, Gemini,
  LM Studio et tout endpoint compatible OpenAI. Streaming en temps réel.
- **Résilience** : réessai automatique (backoff exponentiel), messages clairs
  pour les erreurs 401 / 403 / 404 / 429.
- **Compteur de tokens** : estimation de la consommation avant et après envoi.
- **Sous-agents spécialisés** : l'IA principale délègue à des agents
  programmation / conception / monde / graphisme / test / documentation.
- **Moteurs de jeux** : aperçu HTML5/Canvas/WebGL/Three.js intégré, et export
  vers Godot 4 si installé.
- **Mode développeur** : inspection des prompts bruts, logs HTTP (latence,
  tokens), hyperparamètres (température, top-p, penalties), endpoints
  personnalisés.
- **Vie privée** : clés API chiffrées au repos (coffre-fort de l'OS), aucune
  télémétrie, export RGPD et suppression de l'historique en un clic.

## 🚀 Démarrage rapide

```bash
npm install
npm start            # lance l'app Electron en développement
```

Pour l'utiliser comme simple page web, ouvrez `studio.html` dans un navigateur.

## 📦 Construire l'application de bureau

```bash
npm run dist         # installeur + portable pour l'OS courant
```

Produit les livrables dans `release/` :
- **Windows** : `GameCraft Studio Setup.exe` (installeur) + `.exe` portable
- **Linux** : `.AppImage` + `.deb`
- **macOS** : `.dmg`

La compilation multi-OS est automatisée via GitHub Actions (`.github/workflows/build.yml`).

## 🔒 Sécurité & vie privée

- Les clés API ne quittent jamais votre machine (appels client → API direct).
- En application de bureau, elles sont chiffrées via le coffre-fort du système
  (`safeStorage` d'Electron : Keychain / DPAPI / kwalallet). Sinon, stockage
  local chiffré AES-256.
- Aucune donnée n'est envoyée à un serveur GameCraft. En mode 100 % local
  (Ollama / LM Studio), aucun log ni prompt ne sort de votre machine.

Voir [Documents légaux](docs/legal.md).

## 📁 Structure du projet

```
studio.html      Coquille HTML (charge styles.css + app.js)
styles.css       Feuille de style unique
app.js           Bundle généré — NE PAS éditer à la main
js/              Sources lisibles, une section par fichier (éditez ici)
  scripts/bundle.js   Regénère app.js depuis js/
electron/        Processus principal + préchargement (pont sécurisé)
tests/           Tests unitaires (node --test)
docs/            Documents légaux
```

Après toute modification dans `js/`, régénérez le bundle :

```bash
node scripts/bundle.js
```

## 🧪 Tests

```bash
npm test
```

## 📄 Licence

MIT — voir [LICENSE](LICENSE).
