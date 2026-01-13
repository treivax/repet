# ✅ TODO Phase 0 : POC Piper-WASM

**Objectif** : Valider la faisabilité technique de Piper-WASM  
**Durée estimée** : 1 jour  
**Statut** : 🔴 À faire

---

## 📋 Préparation

### Avant de commencer

- [ ] Charger le contexte projet dans la session
  - [ ] `.github/prompts/common.md`
  - [ ] `docs/ARCHITECTURE.md`
  - [ ] `docs/TTS_ARCHITECTURE_PROPOSAL.md`
  - [ ] `PROJECT_STATUS.md`
  - [ ] `plan/PIPER_WASM_ACTION_PLAN.md`

- [ ] Vérifier la branche active
  ```bash
  git branch --show-current  # Doit afficher : piper-wasm
  ```

- [ ] Vérifier que l'environnement fonctionne
  ```bash
  npm install
  npm run type-check
  npm run dev
  ```

---

## 🔍 Tâche 1 : Recherche Piper-WASM

### Objectif
Identifier la librairie officielle et comprendre son utilisation.

### Actions

- [ ] Rechercher "Piper TTS WASM" sur GitHub
- [ ] Identifier le repository officiel (vraisemblablement `rhasspy/piper`)
- [ ] Vérifier s'il existe une version WASM publiée
- [ ] Lire la documentation d'intégration
- [ ] Noter les URLs importantes :
  - [ ] Repository GitHub : `___________________________`
  - [ ] NPM package (si existe) : `___________________________`
  - [ ] Documentation : `___________________________`
  - [ ] CDN (si existe) : `___________________________`

### Livrables
- [ ] URLs documentées ci-dessus
- [ ] Compréhension du fonctionnement de base

---

## 🎙️ Tâche 2 : Identifier les Modèles Vocaux Français

### Objectif
Trouver les modèles vocaux français de qualité disponibles pour Piper.

### Actions

- [ ] Chercher le repository des modèles Piper
- [ ] Identifier les modèles français (`fr_FR-*`)
- [ ] Pour chaque modèle, noter :
  - Nom / ID
  - Qualité (low/medium/high)
  - Genre (male/female/neutral)
  - Taille du fichier
  - URL de téléchargement

### Modèles Identifiés

**Modèle 1** :
- Nom : `___________________________`
- Qualité : `___________________________`
- Genre : `___________________________`
- Taille : `___________________________`
- URL : `___________________________`

**Modèle 2** :
- Nom : `___________________________`
- Qualité : `___________________________`
- Genre : `___________________________`
- Taille : `___________________________`
- URL : `___________________________`

**Modèle 3** (si disponible) :
- Nom : `___________________________`
- Qualité : `___________________________`
- Genre : `___________________________`
- Taille : `___________________________`
- URL : `___________________________`

### Livrables
- [ ] Au moins 2 modèles français identifiés
- [ ] Tailles acceptables (< 50 MB idéalement)

---

## 🧪 Tâche 3 : Créer le POC

### Objectif
Tester la génération audio de base avec Piper-WASM.

### Actions

- [ ] Créer `repet/poc-piper.html`
- [ ] Charger Piper-WASM (CDN ou bundle local)
- [ ] Charger un modèle vocal français
- [ ] Générer de l'audio pour un texte simple
- [ ] Jouer l'audio dans la page
- [ ] Mesurer le temps de chargement du modèle
- [ ] Mesurer le temps de génération audio
- [ ] Tester avec différents textes (court, moyen, long)

### Code POC (template)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>POC Piper-WASM</title>
</head>
<body>
  <h1>POC Piper-WASM</h1>
  
  <div>
    <label>Texte à synthétiser :</label>
    <textarea id="text" rows="3" cols="50">
Bonjour, ceci est un test de synthèse vocale avec Piper.
    </textarea>
  </div>
  
  <button id="generate">Générer Audio</button>
  <button id="play">Jouer</button>
  
  <div id="status"></div>
  <audio id="audio" controls></audio>
  
  <script>
    // TODO: Charger Piper-WASM
    // TODO: Charger le modèle
    // TODO: Générer l'audio
    // TODO: Jouer l'audio
  </script>
</body>
</html>
```

### Métriques à Mesurer

- [ ] Temps de chargement Piper module : `_____ ms`
- [ ] Temps de téléchargement modèle : `_____ ms`
- [ ] Temps de génération audio (phrase courte ~10 mots) : `_____ ms`
- [ ] Temps de génération audio (phrase moyenne ~30 mots) : `_____ ms`
- [ ] Temps de génération audio (phrase longue ~100 mots) : `_____ ms`
- [ ] Qualité audio perçue : `⭐ _ / 5`

### Validation POC

- [ ] Audio généré avec succès
- [ ] Audio jouable dans le navigateur
- [ ] Qualité audio acceptable (compréhensible, naturel)
- [ ] Temps de génération acceptable (< 3s pour 30 mots)
- [ ] Pas d'erreurs console
- [ ] Fonctionne dans Chrome
- [ ] Fonctionne dans Firefox (bonus)

---

## 📝 Tâche 4 : Documenter les Résultats

### Objectif
Créer le document de résultats du POC.

### Actions

- [ ] Créer `repet/plan/PIPER_WASM_POC_RESULTS.md`
- [ ] Documenter les résultats (voir template ci-dessous)
- [ ] Inclure les métriques mesurées
- [ ] Noter les limitations découvertes
- [ ] Recommander Go/No-Go pour Phase 1

### Template PIPER_WASM_POC_RESULTS.md

```markdown
# 🧪 Résultats POC Piper-WASM

**Date** : 2025-XX-XX
**Durée** : X heures
**Statut** : ✅ Réussi / ❌ Échec

## 📊 Résultats

### Librairie Identifiée
- **Repository** : [URL]
- **Version** : X.X.X
- **Package NPM** : Oui/Non
- **CDN disponible** : Oui/Non

### Modèles Vocaux Français
- Modèle 1 : [nom] (qualité, genre, taille)
- Modèle 2 : [nom] (qualité, genre, taille)

### Métriques de Performance
- Chargement module : X ms
- Téléchargement modèle : X ms
- Génération audio (10 mots) : X ms
- Génération audio (30 mots) : X ms
- Génération audio (100 mots) : X ms

### Qualité Audio
⭐⭐⭐⭐⭐ (X/5)

Description : [...]

## 🚧 Limitations Découvertes
- [Limitation 1]
- [Limitation 2]

## ✅ Validation Technique
- [x] Audio généré
- [x] Qualité acceptable
- [x] Performance acceptable

## 🎯 Recommandation

**GO / NO-GO** : [Choix]

Justification : [...]

## 📎 Fichiers
- POC : `poc-piper.html`
```

### Livrables
- [ ] `PIPER_WASM_POC_RESULTS.md` créé et complet
- [ ] Décision Go/No-Go documentée
- [ ] `poc-piper.html` fonctionnel

---

## 🎯 Critères de Validation Phase 0

### Minimum Viable (Go)
- [ ] Piper-WASM chargé avec succès
- [ ] Au moins 1 modèle français fonctionne
- [ ] Audio généré et jouable
- [ ] Qualité audio >= 3/5
- [ ] Génération audio < 5s pour 30 mots

### Nice to Have
- [ ] 2+ modèles français
- [ ] Génération audio < 2s pour 30 mots
- [ ] Support navigateurs multiples
- [ ] Taille modèle < 20 MB

---

## 📤 Livraison Phase 0

### Fichiers à Créer
- [ ] `poc-piper.html` (POC fonctionnel)
- [ ] `plan/PIPER_WASM_POC_RESULTS.md` (résultats documentés)

### Commit
```bash
git add poc-piper.html plan/PIPER_WASM_POC_RESULTS.md
git commit -m "feat(poc): Valide faisabilité Piper-WASM avec POC

- POC fonctionnel avec génération audio
- Modèles français identifiés
- Métriques de performance mesurées
- Recommandation : [GO/NO-GO]

Refs: Phase 0 plan Piper-WASM"
```

---

## ⏭️ Après Phase 0

### Si GO (POC Réussi)
➡️ Passer à **Phase 1 : Architecture de Base**
- Lire `plan/PIPER_WASM_ACTION_PLAN.md` section Phase 1
- Créer `plan/TODO_PHASE_1.md`

### Si NO-GO (POC Échoué)
➡️ Réévaluer l'approche
- Documenter les raisons d'échec
- Explorer des alternatives (Google Cloud TTS, autre solution)
- Discuter avec l'équipe

---

## 📞 Aide

### Si Blocage
1. Consulter `plan/PIPER_WASM_QUICK_REFERENCE.md`
2. Vérifier la documentation officielle Piper
3. Chercher des exemples d'intégration WASM
4. Tester dans un navigateur différent

### Ressources Utiles
- MDN WebAssembly : https://developer.mozilla.org/en-US/docs/WebAssembly
- MDN Web Audio API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

---

**Bonne chance ! 🚀**