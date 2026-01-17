# Phase 6 : Guide de Test Manuel - Fonctionnalité Notes

**Date** : 2024-01-XX  
**Version** : 0.2.3  
**Branche** : `new_annotations`  

---

## 🎯 Objectif

Ce guide pratique vous accompagne pas-à-pas pour tester manuellement la fonctionnalité **Notes/Annotations** implémentée dans les Phases 1-5.

---

## 🚀 Préparation

### 1. Vérifier l'environnement

```bash
# Vérifier la branche
git branch --show-current
# Résultat attendu: new_annotations

# Vérifier statut propre
git status
# Résultat attendu: working tree clean

# Installer dépendances (si nécessaire)
npm install
```

### 2. Lancer l'application en mode développement

```bash
npm run dev
```

**Résultat attendu** :
- Serveur démarre sur `http://localhost:5173` (ou port similaire)
- Pas d'erreur dans la console terminal
- Application s'ouvre dans le navigateur

### 3. Ouvrir les outils développeur

- **Chrome/Edge** : `F12` ou `Ctrl+Shift+I` / `Cmd+Option+I`
- **Firefox** : `F12` ou `Ctrl+Shift+I` / `Cmd+Option+I`
- **Safari** : `Cmd+Option+I`

**Onglets à surveiller** :
- **Console** : pour erreurs JavaScript
- **Application** > **IndexedDB** > **repetDB** : pour vérifier stockage notes
- **React DevTools** (si installé) : pour profiler performance

---

## 📝 Tests Fonctionnels - Checklist Interactive

### ✅ Test 1 : Chargement Initial

**Objectif** : Vérifier que l'app se charge sans erreur avec le nouveau code Notes.

- [ ] **1.1** Page d'accueil affichée correctement
- [ ] **1.2** Console navigateur : 0 erreur (warnings OK)
- [ ] **1.3** Sélectionner une pièce de théâtre existante
- [ ] **1.4** Écran de lecture s'ouvre normalement
- [ ] **1.5** Texte de la pièce affiché (titres, actes, répliques visibles)

**Si échec** : Vérifier build, dépendances, console pour stack trace.

---

### ✅ Test 2 : Création de Notes par Long-Press

**Objectif** : Valider la création de notes sur tous les types d'éléments.

#### 2.1 Note sur Titre de Pièce (PRESENTATION)

- [ ] **2.1.1** Maintenir appui long (1 seconde) sur le titre de la pièce
- [ ] **2.1.2** Une note jaune apparaît à côté du titre
- [ ] **2.1.3** Note est vide et maximisée (textarea visible)
- [ ] **2.1.4** Focus automatique dans textarea
- [ ] **2.1.5** Vérifier IndexedDB :
  - Ouvrir DevTools > Application > IndexedDB > `repetDB` > `notes`
  - Une entrée avec `attachedToType: "presentation"`, `attachedToIndex: 0`

**Note** : Sur mobile, maintenir doigt 1 seconde. Sur desktop, maintenir clic souris 1 seconde.

#### 2.2 Note sur Acte/Scène (STRUCTURE)

- [ ] **2.2.1** Long-press sur un en-tête d'acte (ex: "ACTE I")
- [ ] **2.2.2** Note créée et affichée
- [ ] **2.2.3** `attachedToType: "structure"` dans IndexedDB
- [ ] **2.2.4** Long-press sur un en-tête de scène (ex: "SCÈNE 1")
- [ ] **2.2.5** Note créée pour la scène
- [ ] **2.2.6** Deux notes distinctes visibles (acte + scène)

#### 2.3 Note sur Didascalie (STAGE_DIRECTION)

- [ ] **2.3.1** Long-press sur une didascalie (texte en italique, ex: *(Entre le roi)*)
- [ ] **2.3.2** Note créée et positionnée près de la didascalie
- [ ] **2.3.3** `attachedToType: "stage_direction"` dans IndexedDB

#### 2.4 Note sur Réplique (LINE)

- [ ] **2.4.1** Long-press sur le nom d'un personnage (ex: "HAMLET")
- [ ] **2.4.2** Note créée
- [ ] **2.4.3** `attachedToType: "line"` dans IndexedDB
- [ ] **2.4.4** Long-press sur le texte d'une autre réplique
- [ ] **2.4.5** Note créée pour cette réplique

#### 2.5 Comportement de Création

- [ ] **2.5.1** Essayer long-press sur un élément déjà annoté → Aucun effet (pas de doublon)
- [ ] **2.5.2** Essayer clic rapide (<1s) sur élément → Pas de note créée
- [ ] **2.5.3** Déplacer souris/doigt pendant long-press → Annulation (pas de note)
- [ ] **2.5.4** Total : Au moins 5 notes créées sur types différents

---

### ✅ Test 3 : Édition de Notes

**Objectif** : Valider l'édition et l'auto-save.

#### 3.1 Saisie de Texte

- [ ] **3.1.1** Cliquer dans textarea d'une note vide
- [ ] **3.1.2** Taper du texte (ex: "Ceci est une note de test")
- [ ] **3.1.3** Texte affiché en temps réel
- [ ] **3.1.4** Appuyer sur `Enter` → Nouvelle ligne créée (multiligne OK)
- [ ] **3.1.5** Taper caractères spéciaux : `é`, `à`, `ç`, `œ`, émojis 😊
- [ ] **3.1.6** Tous les caractères affichés correctement

#### 3.2 Auto-Save (Debounce 500ms)

- [ ] **3.2.1** Taper du texte rapidement
- [ ] **3.2.2** Arrêter de taper, attendre 500ms (0.5 seconde)
- [ ] **3.2.3** Vérifier IndexedDB :
  - Actualiser la vue IndexedDB dans DevTools
  - Le champ `content` de la note contient le nouveau texte
- [ ] **3.2.4** Pas d'indicateur de sauvegarde visible (silencieux)

#### 3.3 Save on Blur

- [ ] **3.3.1** Éditer une note (taper texte)
- [ ] **3.3.2** Immédiatement après, cliquer ailleurs (en dehors de la note)
- [ ] **3.3.3** Vérifier IndexedDB → contenu sauvegardé immédiatement (sans attendre 500ms)

#### 3.4 Persistance après Rechargement

- [ ] **3.4.1** Créer une note avec texte "TEST PERSISTENCE"
- [ ] **3.4.2** Recharger la page (`F5`)
- [ ] **3.4.3** Note toujours visible avec le bon texte
- [ ] **3.4.4** Fermer onglet navigateur, rouvrir même pièce
- [ ] **3.4.5** Note toujours présente (persistance IndexedDB OK)

#### 3.5 Limite de Caractères

- [ ] **3.5.1** Taper un long texte (>1000 caractères)
- [ ] **3.5.2** Scroll interne dans textarea fonctionne
- [ ] **3.5.3** Essayer dépasser 5000 caractères → Bloqué (maxLength)
- [ ] **3.5.4** Compteur de caractères affiché (si implémenté)

---

### ✅ Test 4 : Minimisation et Maximisation

**Objectif** : Valider le toggle d'affichage des notes.

#### 4.1 Minimisation Individuelle

- [ ] **4.1.1** Créer une note avec du texte
- [ ] **4.1.2** Cliquer sur le bouton minimiser (icône `-` ou similaire)
- [ ] **4.1.3** Note se réduit → Seule icône 🗒️ visible (jaune)
- [ ] **4.1.4** Textarea caché
- [ ] **4.1.5** Recharger page → Note reste minimisée (état persisté)

#### 4.2 Maximisation Individuelle

- [ ] **4.2.1** Cliquer sur l'icône 🗒️ d'une note minimisée
- [ ] **4.2.2** Note s'agrandit → Textarea et contenu visibles
- [ ] **4.2.3** Éditable immédiatement
- [ ] **4.2.4** Recharger page → Note reste maximisée

#### 4.3 Menu Global "Afficher/Masquer Toutes les Notes"

- [ ] **4.3.1** Créer 3+ notes (mélange maximisées/minimisées)
- [ ] **4.3.2** Localiser bouton menu "Masquer toutes les notes" (header/toolbar)
- [ ] **4.3.3** Cliquer → Toutes les notes se minimisent (icônes seulement)
- [ ] **4.3.4** Libellé bouton change en "Afficher toutes les notes"
- [ ] **4.3.5** Cliquer à nouveau → Toutes les notes s'agrandissent
- [ ] **4.3.6** Libellé change en "Masquer toutes les notes"

#### 4.4 Transition Fluide

- [ ] **4.4.1** Toggle rapide min/max → Pas de lag visible
- [ ] **4.4.2** Animation smooth (si implémentée)
- [ ] **4.4.3** Pas de flash ou artefact visuel

---

### ✅ Test 5 : Suppression de Notes

**Objectif** : Valider la suppression avec confirmation.

#### 5.1 Dialog de Confirmation

- [ ] **5.1.1** Cliquer sur bouton suppression (×) d'une note
- [ ] **5.1.2** Dialog modal s'ouvre au centre de l'écran
- [ ] **5.1.3** Overlay semi-transparent bloque arrière-plan
- [ ] **5.1.4** Message clair : "Voulez-vous vraiment supprimer cette note ?"
- [ ] **5.1.5** Deux boutons : "Annuler" et "Supprimer"
- [ ] **5.1.6** Focus automatique sur bouton "Annuler" (sécurité)

#### 5.2 Annulation

- [ ] **5.2.1** Cliquer "Annuler"
- [ ] **5.2.2** Dialog se ferme
- [ ] **5.2.3** Note toujours visible (non supprimée)
- [ ] **5.2.4** Contenu intact
- [ ] **5.2.5** IndexedDB : entrée toujours présente

#### 5.3 Confirmation Suppression

- [ ] **5.3.1** Cliquer bouton × sur une autre note
- [ ] **5.3.2** Dialog s'ouvre
- [ ] **5.3.3** Cliquer "Supprimer"
- [ ] **5.3.4** Note disparaît immédiatement de l'UI
- [ ] **5.3.5** IndexedDB : entrée supprimée (actualiser vue)
- [ ] **5.3.6** Recharger page → Note ne revient pas

#### 5.4 Accessibilité Clavier

- [ ] **5.4.1** Ouvrir dialog de suppression
- [ ] **5.4.2** Appuyer sur `ESC` → Dialog se ferme (annulation)
- [ ] **5.4.3** Note conservée
- [ ] **5.4.4** Rouvrir dialog
- [ ] **5.4.5** Appuyer sur `Tab` → Focus se déplace entre boutons
- [ ] **5.4.6** `Enter` sur "Annuler" → Annulation
- [ ] **5.4.7** `Enter` sur "Supprimer" → Suppression

---

### ✅ Test 6 : Export PDF avec Notes

**Objectif** : Vérifier que les notes sont incluses dans le PDF exporté.

#### 6.1 Préparation

- [ ] **6.1.1** Créer 3 notes **maximisées** avec du contenu (ex: "Note 1", "Note 2", "Note 3")
- [ ] **6.1.2** Créer 2 notes **minimisées** avec du contenu
- [ ] **6.1.3** Créer 1 note **maximisée** mais **vide** (pas de texte)

#### 6.2 Génération PDF

- [ ] **6.2.1** Localiser bouton "Exporter en PDF" (menu)
- [ ] **6.2.2** Cliquer sur export
- [ ] **6.2.3** PDF généré et téléchargé (fichier `.pdf`)
- [ ] **6.2.4** Ouvrir le PDF avec un lecteur PDF

#### 6.3 Vérification Contenu PDF

- [ ] **6.3.1** Les 3 notes **maximisées** avec contenu sont présentes dans le PDF
- [ ] **6.3.2** Notes positionnées près des éléments attachés (après répliques, etc.)
- [ ] **6.3.3** Fond jaune pastel visible (#FFF9C4 ou similaire)
- [ ] **6.3.4** Bordure jaune autour des notes
- [ ] **6.3.5** Texte en italique gris
- [ ] **6.3.6** Texte lisible (pas de débordement)

#### 6.4 Exclusions

- [ ] **6.4.1** Les 2 notes **minimisées** ne sont PAS dans le PDF (comportement attendu)
- [ ] **6.4.2** La note **maximisée vide** n'est PAS dans le PDF (logique `content.trim()`)

#### 6.5 Pagination

- [ ] **6.5.1** Créer une note très longue (500+ mots)
- [ ] **6.5.2** Exporter PDF
- [ ] **6.5.3** Note longue répartie sur plusieurs pages (pas de coupure brutale)
- [ ] **6.5.4** Marges et espacement corrects

---

### ✅ Test 7 : Thèmes Clair et Sombre

**Objectif** : Vérifier l'affichage dans les deux thèmes.

#### 7.1 Thème Clair

- [ ] **7.1.1** Activer thème clair (bouton thème ou settings)
- [ ] **7.1.2** Notes jaunes visibles et contrastées
- [ ] **7.1.3** Texte lisible (gris foncé sur jaune)
- [ ] **7.1.4** Bordures visibles
- [ ] **7.1.5** Icônes boutons (×, −) claires

#### 7.2 Thème Sombre

- [ ] **7.2.1** Activer thème sombre
- [ ] **7.2.2** Notes jaunes toujours visibles (pas trop éblouissant)
- [ ] **7.2.3** Texte contrasté
- [ ] **7.2.4** Bordures adaptées (si besoin)
- [ ] **7.2.5** Accessibilité WCAG AA respectée (ratio contraste ≥4.5:1)

#### 7.3 Switch Dynamique

- [ ] **7.3.1** Basculer thème clair → sombre → clair
- [ ] **7.3.2** Notes s'adaptent en temps réel
- [ ] **7.3.3** Pas de flash visuel
- [ ] **7.3.4** État notes préservé (contenu, min/max)

---

### ✅ Test 8 : Responsive et Multi-Plateforme

**Objectif** : Tester sur différentes tailles d'écran et devices.

#### 8.1 Mobile (Smartphone < 768px)

**Méthode** : DevTools responsive mode ou device réel

- [ ] **8.1.1** Long-press tactile fonctionne (maintenir doigt 1s)
- [ ] **8.1.2** Note créée sans conflit avec scroll de la page
- [ ] **8.1.3** Textarea éditable au clavier virtuel
- [ ] **8.1.4** Clavier ne cache pas la note (viewport ajusté)
- [ ] **8.1.5** Boutons (×, −) assez grands (min 44x44px) pour le doigt
- [ ] **8.1.6** Scroll interne note fonctionne (texte long)
- [ ] **8.1.7** Menu global accessible (hamburger ou similaire)

#### 8.2 Tablet (768px - 1024px)

- [ ] **8.2.1** Layout adapté (notes pas trop larges)
- [ ] **8.2.2** Touch et souris fonctionnent (si tablette hybride)
- [ ] **8.2.3** Orientation portrait/paysage → notes s'adaptent

#### 8.3 Desktop (> 1024px)

- [ ] **8.3.1** Hover souris sur boutons fonctionne (si styles hover)
- [ ] **8.3.2** Long-press souris (maintenir clic) crée note
- [ ] **8.3.3** Notes positionnées correctement dans layout large
- [ ] **8.3.4** Scroll page n'interfère pas avec notes

#### 8.4 Navigateurs

Tester sur au moins 2 navigateurs :

- [ ] **8.4.1** Chrome/Chromium (dernière version)
- [ ] **8.4.2** Firefox (dernière version)
- [ ] **8.4.3** Safari (macOS/iOS) - optionnel
- [ ] **8.4.4** Edge (Chromium) - optionnel

---

### ✅ Test 9 : Performance

**Objectif** : Vérifier fluidité avec plusieurs notes.

#### 9.1 Charge Normale (< 10 notes)

- [ ] **9.1.1** Créer 5 notes
- [ ] **9.1.2** Éditer rapidement (taper dans toutes les notes)
- [ ] **9.1.3** Pas de lag visible
- [ ] **9.1.4** Auto-save debounce fluide

#### 9.2 Charge Élevée (20+ notes)

- [ ] **9.2.1** Créer 20-25 notes sur différents éléments
- [ ] **9.2.2** Scroll page → Fluide (60fps)
- [ ] **9.2.3** Toggle global min/max → Réponse <500ms
- [ ] **9.2.4** Édition note → Pas de lag

#### 9.3 Profiling React (Optionnel)

**Si React DevTools Profiler installé** :

- [ ] **9.3.1** Ouvrir React DevTools > Profiler
- [ ] **9.3.2** Enregistrer session
- [ ] **9.3.3** Créer note, éditer, toggle
- [ ] **9.3.4** Analyser flamegraph
- [ ] **9.3.5** Vérifier que `Note` et `NoteIcon` ne re-render pas inutilement (React.memo OK)

#### 9.4 Mémoire (Optionnel)

**Chrome DevTools > Performance > Memory** :

- [ ] **9.4.1** Heap snapshot avant création notes
- [ ] **9.4.2** Créer 20 notes
- [ ] **9.4.3** Heap snapshot après
- [ ] **9.4.4** Supprimer toutes les notes
- [ ] **9.4.5** Heap snapshot final
- [ ] **9.4.6** Pas de memory leak (heap revient proche initial)

---

### ✅ Test 10 : Intégration avec Features Existantes

**Objectif** : Vérifier que Notes n'interfèrent pas avec le reste de l'app.

#### 10.1 Scroll Automatique (Reading Mode)

- [ ] **10.1.1** Activer mode lecture automatique (si disponible)
- [ ] **10.1.2** Texte défile automatiquement
- [ ] **10.1.3** Présence notes ne bloque pas scroll
- [ ] **10.1.4** IntersectionObserver fonctionne (surlignage ligne active OK)

#### 10.2 Text-to-Speech (TTS)

**Si TTS implémenté** :

- [ ] **10.2.1** Activer TTS (lecture audio du texte)
- [ ] **10.2.2** TTS lit le texte de la pièce
- [ ] **10.2.3** TTS ne lit PAS le contenu des notes (comportement souhaité)
- [ ] **10.2.4** Pause/Resume TTS fonctionne avec notes ouvertes

#### 10.3 Navigation Pièce

- [ ] **10.3.1** Changer d'acte via sidebar
- [ ] **10.3.2** Notes de l'acte affiché sont visibles
- [ ] **10.3.3** Revenir à acte précédent → Notes toujours là
- [ ] **10.3.4** Changer de pièce complètement (sélectionner autre pièce)
- [ ] **10.3.5** Anciennes notes disparaissent
- [ ] **10.3.6** Créer note sur nouvelle pièce → Stockée avec bon `playId`

#### 10.4 Régression - Bug Scroll Automatique (v0.2.3)

**Contexte** : Bug corrigé en v0.2.3 (scroll auto en mode silent)

- [ ] **10.4.1** Activer mode `readingMode: 'silent'`
- [ ] **10.4.2** Scroll automatique fonctionne toujours
- [ ] **10.4.3** Pas de régression (bug non réintroduit)

---

## 📊 Rapport de Test

### Template de Bug Report

Si un bug est trouvé, documenter ainsi :

```
**[BUG-001] Titre court du bug**

**Sévérité** : Critique / Majeur / Mineur / Cosmétique

**Étapes de reproduction** :
1. Ouvrir pièce "Hamlet"
2. Long-press sur titre
3. Taper "Test"
4. ...

**Comportement attendu** :
Note devrait être sauvegardée après 500ms.

**Comportement observé** :
Note n'est pas sauvegardée, disparaît au rechargement.

**Environnement** :
- Navigateur : Chrome 120.0.6099.109
- OS : Windows 11
- Résolution : 1920x1080
- Device : Desktop

**Console Errors** :
```
TypeError: Cannot read property 'content' of undefined
  at NotesStorage.updateNoteContent (notesStorage.ts:45)
```

**Screenshot** : (si pertinent)
```

---

## ✅ Résumé Final

### Statistiques de Test

- **Tests passés** : ___/100+
- **Tests échoués** : ___
- **Bugs critiques** : ___
- **Bugs mineurs** : ___
- **Warnings** : ___

### Décision Phase 6

- [ ] **VALIDÉ** : Tous tests critiques passent → Passer Phase 7
- [ ] **CORRECTIONS NÉCESSAIRES** : Bugs bloquants trouvés → Corriger avant Phase 7
- [ ] **PARTIAL PASS** : Bugs mineurs non-bloquants → Documenter et continuer Phase 7

---

## 🔗 Prochaines Étapes

Après validation Phase 6 :

1. **Si VALIDÉ** → Continuer Phase 7 (Documentation & Polish)
2. **Si CORRECTIONS** → Fixer bugs, re-tester, puis Phase 7
3. **Créer rapport final** : `PHASE_6_TEST_REPORT.md`
4. **Commit Phase 6** : `git commit -m "Phase 6: Tests et Validation complétés"`
5. **Push** : `git push origin new_annotations`

---

**Testeur** : _______________  
**Date** : _______________  
**Durée tests** : ___ heures  
**Statut final** : ☐ PASS  ☐ FAIL  ☐ PARTIAL

---

**Fin du guide de test manuel Phase 6**