# Phase 6 : Tests et Validation - Plan de Test Détaillé

**Date de début** : 2024-01-XX  
**Statut** : EN COURS  
**Responsable** : Équipe Répét  

---

## 📋 Vue d'ensemble

Ce document décrit le plan de test complet pour valider la fonctionnalité **Notes/Annotations** implémentée dans les Phases 1-5.

### Objectifs de Phase 6
- ✅ Validation fonctionnelle complète de toutes les features Notes
- ✅ Tests de performance et optimisation
- ✅ Tests multi-plateforme et responsive
- ✅ Tests d'accessibilité
- ✅ Détection et correction de bugs
- ✅ Documentation des résultats

---

## 🧪 1. Tests de Build et Qualité du Code

### 1.1 Compilation et Linting
- [x] `npm run type-check` — TypeScript sans erreur
- [x] `npm run lint` — ESLint sans warning
- [ ] `npm run build` — Build production réussit
- [ ] Vérifier bundle size (pas d'augmentation excessive)

### 1.2 Qualité du Code
- [ ] Pas de `console.log` ou debug code
- [ ] Tous les TODOs traités ou documentés
- [ ] Copyright headers présents (conformité `common.md`)
- [ ] Imports organisés et optimisés

---

## 🎯 2. Tests Fonctionnels - Création de Notes

### 2.1 Long-Press sur Éléments Attachables

**Titre de la pièce (`PRESENTATION`)**
- [ ] Long-press (1000ms) sur titre → note créée
- [ ] Note apparaît à côté du titre
- [ ] `attachedToType: 'presentation'`, `attachedToIndex: 0`
- [ ] Note initialement maximisée et vide

**Actes (`STRUCTURE` - Act)**
- [ ] Long-press sur en-tête d'acte → note créée
- [ ] Position correcte (avant/après l'acte)
- [ ] `attachedToType: 'structure'`, bon `attachedToIndex`

**Scènes (`STRUCTURE` - Scene)**
- [ ] Long-press sur en-tête de scène → note créée
- [ ] Position correcte
- [ ] `attachedToType: 'structure'`, bon `attachedToIndex`

**Didascalies (`STAGE_DIRECTION`)**
- [ ] Long-press sur didascalie → note créée
- [ ] `attachedToType: 'stage_direction'`, bon `attachedToIndex`
- [ ] Note positionnée correctement dans le flux

**Répliques (`LINE`)**
- [ ] Long-press sur personnage → note créée
- [ ] Long-press sur texte de réplique → note créée
- [ ] `attachedToType: 'line'`, bon `attachedToIndex`
- [ ] Support multi-lignes (répliques longues)

### 2.2 Comportement de Création
- [ ] Une seule note par élément (pas de doublons)
- [ ] Feedback visuel pendant long-press (si implémenté)
- [ ] Création instantanée après release
- [ ] Focus automatique sur textarea après création
- [ ] Note vide sauvegardée dans IndexedDB

### 2.3 Cas Limites
- [ ] Long-press annulé (mouvement souris/doigt) → pas de note
- [ ] Click rapide (<1000ms) → pas de note, comportement normal
- [ ] Long-press sur élément déjà annoté → aucun effet

---

## ✏️ 3. Tests Fonctionnels - Édition de Notes

### 3.1 Saisie de Texte
- [ ] Taper dans textarea → texte affiché
- [ ] Multiligne supporté (Enter → nouvelle ligne)
- [ ] Caractères spéciaux (émojis, accents, ponctuation)
- [ ] Texte long (>1000 caractères) → scroll interne

### 3.2 Auto-Save
- [ ] Debounce 500ms : taper → pause 500ms → save automatique
- [ ] Indicateur visuel de sauvegarde (si implémenté)
- [ ] `onBlur` → save immédiat (quitter textarea)
- [ ] Contenu persisté dans IndexedDB
- [ ] Rechargement page → notes restaurées avec bon contenu

### 3.3 Performance Édition
- [ ] Pas de lag en tapant (debounce efficace)
- [ ] Pas de re-render inutiles (vérifier avec React DevTools)
- [ ] Mémoire stable (pas de leak)

---

## 🔄 4. Tests Fonctionnels - Minimisation/Maximisation

### 4.1 Minimisation Individuelle
- [ ] Clic sur icône minimiser (bouton `-`) → note se réduit
- [ ] Seul `NoteIcon` visible (🗒️ jaune)
- [ ] Contenu caché
- [ ] État `isMinimized: true` sauvegardé
- [ ] Rechargement → note reste minimisée

### 4.2 Maximisation Individuelle
- [ ] Clic sur `NoteIcon` → note s'agrandit
- [ ] Contenu affiché
- [ ] Textarea éditable
- [ ] État `isMinimized: false` sauvegardé
- [ ] Rechargement → note reste maximisée

### 4.3 Menu Global (PlayScreen)
- [ ] Bouton "Afficher Notes" visible dans menu
- [ ] Clic → toutes notes minimisées affichées (maximisées)
- [ ] Clic "Masquer Notes" → toutes notes maximisées cachées (minimisées)
- [ ] Libellé du bouton change dynamiquement
- [ ] État synchronisé avec notes individuelles

### 4.4 Cas Limites
- [ ] Mélange notes min/max → menu global fonctionne correctement
- [ ] Toggle rapide → pas de bug d'état
- [ ] Animation/transition fluide (si implémentée)

---

## 🗑️ 5. Tests Fonctionnels - Suppression

### 5.1 ConfirmDialog
- [ ] Clic bouton suppression (×) → dialog s'ouvre
- [ ] Dialog modal bloque interactions arrière-plan
- [ ] Message de confirmation clair
- [ ] Boutons "Annuler" et "Supprimer" visibles
- [ ] Focus automatique sur "Annuler" (sécurité)

### 5.2 Confirmation Suppression
- [ ] Clic "Supprimer" → note disparaît
- [ ] Note retirée d'IndexedDB (vérifier DevTools)
- [ ] Dialog se ferme
- [ ] UI se met à jour (plus d'icône ni de note)

### 5.3 Annulation Suppression
- [ ] Clic "Annuler" → dialog se ferme
- [ ] Note conservée (texte intact)
- [ ] Pas de changement dans IndexedDB

### 5.4 Accessibilité Dialog
- [ ] Touche `ESC` → ferme dialog (annulation)
- [ ] Touche `Tab` → navigation clavier dans dialog
- [ ] `Enter` sur "Annuler" → annulation
- [ ] `Enter` sur "Supprimer" → suppression
- [ ] ARIA labels présents (`role="dialog"`, `aria-labelledby`, etc.)
- [ ] Screen reader annonce le dialog (tester avec NVDA/VoiceOver)

---

## 📄 6. Tests Fonctionnels - Export PDF

### 6.1 Export avec Notes Maximisées
- [ ] Créer 3+ notes maximisées non vides
- [ ] Menu → "Exporter en PDF"
- [ ] PDF généré contient les notes
- [ ] Notes positionnées près des éléments attachés
- [ ] Styles corrects : fond jaune pastel (#FFF9C4), bordure jaune, texte italique gris

### 6.2 Export avec Notes Minimisées
- [ ] Créer notes minimisées
- [ ] Export PDF → notes minimisées **non incluses** dans PDF
- [ ] PDF ne contient que les notes maximisées

### 6.3 Export avec Notes Vides
- [ ] Note maximisée mais vide
- [ ] Export → note vide **non incluse** (logique `if (content.trim())`)

### 6.4 Pagination et Formatage
- [ ] Note très longue → pagination automatique (multi-pages)
- [ ] Marges et espacement corrects
- [ ] Texte lisible (pas de débordement)
- [ ] Qualité PDF professionnelle

### 6.5 Cas Limites Export
- [ ] Export sans aucune note → PDF normal (sans notes)
- [ ] Export avec 20+ notes → performance acceptable (<10s)
- [ ] Combinaison notes sur différents types d'éléments

---

## 🎨 7. Tests Multi-Thèmes

### 7.1 Thème Clair
- [ ] Notes visibles et lisibles
- [ ] Couleur fond jaune (#FFF9C4) appropriée
- [ ] Texte contrasté
- [ ] Icônes et boutons visibles

### 7.2 Thème Sombre
- [ ] Notes adaptées (si dark mode existe)
- [ ] Fond jaune reste visible sans éblouir
- [ ] Bordures et texte contrastés
- [ ] Accessibilité préservée (WCAG AA)

### 7.3 Switch Thème Dynamique
- [ ] Passer de clair à sombre → notes s'adaptent
- [ ] Pas de flash ou artefact visuel
- [ ] État notes préservé

---

## 📱 8. Tests Responsive et Multi-Plateforme

### 8.1 Mobile (< 768px)
- [ ] Long-press fonctionne sur écran tactile
- [ ] Durée 1000ms appropriée (pas trop court/long)
- [ ] Textarea éditable au doigt
- [ ] Clavier virtuel ne cache pas note
- [ ] Boutons suffisamment grands (min 44x44px)
- [ ] Scroll contenu note fluide

### 8.2 Tablet (768px - 1024px)
- [ ] Layout adapté
- [ ] Notes correctement positionnées
- [ ] Touch et clavier souris fonctionnent

### 8.3 Desktop (> 1024px)
- [ ] Souris hover fonctionne (si styles hover)
- [ ] Click et long-press souris
- [ ] Textarea redimensionnement (si implémenté)

### 8.4 Navigateurs
- [ ] Chrome/Chromium (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (macOS/iOS)
- [ ] Edge (Chromium)

---

## 🚀 9. Tests de Performance

### 9.1 Scénario Charge Normale (< 10 notes)
- [ ] Création/édition fluide
- [ ] Pas de lag visible
- [ ] Rendu <100ms

### 9.2 Scénario Charge Élevée (20+ notes)
- [ ] Profiler React DevTools → identifier re-renders
- [ ] Vérifier mémoïsation (`React.memo`, `useMemo`, `useCallback`)
- [ ] Temps de chargement initial <2s
- [ ] Scroll fluide (60fps)

### 9.3 IndexedDB Performance
- [ ] Lecture notes au mount <200ms
- [ ] Écriture debounced efficace
- [ ] Pas de blocage UI pendant I/O
- [ ] Query composite index performant

### 9.4 Mémoire
- [ ] Heap stable (Chrome DevTools Memory Profiler)
- [ ] Pas de memory leak après 50+ create/delete cycles
- [ ] Garbage collection efficace

---

## ♿ 10. Tests d'Accessibilité

### 10.1 Navigation Clavier
- [ ] `Tab` → focus visible sur notes éditables
- [ ] `Shift+Tab` → navigation inverse
- [ ] `Enter` dans dialog → action par défaut
- [ ] `Esc` → ferme dialog

### 10.2 ARIA et Sémantique
- [ ] `role="dialog"` sur ConfirmDialog
- [ ] `aria-label` sur boutons icônes (×, −)
- [ ] `aria-labelledby` / `aria-describedby` corrects
- [ ] Landmark regions appropriées

### 10.3 Screen Readers
- [ ] NVDA (Windows) ou VoiceOver (macOS) annonce :
  - [ ] Création de note
  - [ ] État minimisé/maximisé
  - [ ] Contenu de note
  - [ ] Dialog de suppression
- [ ] Ordre de lecture logique

### 10.4 Contraste et Visibilité
- [ ] Ratio contraste texte/fond ≥ 4.5:1 (WCAG AA)
- [ ] Focus indicator visible (outline >2px)
- [ ] Couleur pas seul indicateur d'état

---

## 🔍 11. Tests d'Intégration avec Features Existantes

### 11.1 Scroll Automatique (Reading Mode)
- [ ] Mode silent → scroll auto fonctionne normalement
- [ ] Présence de notes ne casse pas scroll
- [ ] IntersectionObserver non perturbé

### 11.2 Text-to-Speech (TTS)
- [ ] TTS lit texte de pièce
- [ ] Notes **non lues** par TTS (comportement souhaité ?)
- [ ] Pause/Resume TTS fonctionne avec notes ouvertes

### 11.3 Navigation Pièce
- [ ] Changer d'acte/scène → notes affichées/cachées correctement
- [ ] Reload partiel UI → notes préservées
- [ ] Deep linking → notes rechargées

### 11.4 Gestion État Pièce
- [ ] Changer de pièce (`playId`) → notes anciennes disparaissent
- [ ] Notes nouvelles pièce chargées
- [ ] Pas de mélange entre notes de différentes pièces

---

## 📊 12. Tests de Persistence et État

### 12.1 IndexedDB
- [ ] Chrome DevTools → Application → IndexedDB → `repetDB` → table `notes`
- [ ] Notes créées apparaissent
- [ ] Mise à jour contenu reflétée
- [ ] Suppression retire entrée
- [ ] Index composite `[playId+attachedToType+attachedToIndex]` utilisé

### 12.2 Rechargement Page
- [ ] F5 → notes restaurées (contenu, position, état min/max)
- [ ] Hard refresh (Ctrl+Shift+R) → notes toujours présentes
- [ ] Fermer/rouvrir navigateur → notes persistées

### 12.3 Cas Limites Stockage
- [ ] Quota IndexedDB atteint (peu probable, tester si possible)
- [ ] Corruption DB (vérifier migration Dexie)
- [ ] Vider cache → notes supprimées (comportement attendu)

---

## 🐛 13. Tests de Régression

### 13.1 Features Non Modifiées
- [ ] Affichage texte pièce normal
- [ ] Styles typographie intacts
- [ ] Navigation sidebar fonctionne
- [ ] Export PDF sans notes fonctionne
- [ ] Modes de lecture (silent/karaoke) OK

### 13.2 Bug Antérieur (Scroll Automatique)
- [ ] Fix scroll automatique en mode `silent` toujours actif
- [ ] Pas de régression de commit bugfix `v0.2.3`

---

## 📝 14. Documentation des Résultats

### 14.1 Bugs Trouvés
Format : 
```
**[BUG-XXX] Titre court**
- Sévérité : Critique / Majeur / Mineur / Cosmétique
- Étapes de reproduction : 1. ... 2. ... 3. ...
- Comportement attendu : ...
- Comportement observé : ...
- Navigateur/OS : ...
- Screenshot/Logs : ...
```

### 14.2 Rapport de Test
- [ ] Créer `PHASE_6_TEST_REPORT.md`
- [ ] Résumé : X/Y tests passés
- [ ] Liste bugs critiques/bloquants
- [ ] Recommandations avant Phase 7

---

## ✅ 15. Critères de Succès Phase 6

**Phase 6 est considérée complétée quand** :
- ✅ Tous les tests de build/qualité passent
- ✅ ≥95% des tests fonctionnels passent
- ✅ Aucun bug critique/bloquant ouvert
- ✅ Performance acceptable (profiling OK)
- ✅ Tests manuels sur ≥2 navigateurs
- ✅ Tests mobile ET desktop réussis
- ✅ Rapport de test documenté

---

## 📅 Planning Phase 6

**Estimation** : 1-2 jours de tests manuels intensifs

### Jour 1
- Matin : Tests 1-6 (Build, Création, Édition, Min/Max, Suppression, Export)
- Après-midi : Tests 7-9 (Thèmes, Responsive, Performance)

### Jour 2
- Matin : Tests 10-12 (Accessibilité, Intégration, Persistence)
- Après-midi : Tests 13-14 (Régression, Documentation)
- Fin : Rapport final et décision Phase 7

---

## 🔗 Prochaines Étapes

Après validation Phase 6 :
→ **Phase 7** : Documentation finale, polish, CHANGELOG, guide utilisateur  
→ **PR** : Ouvrir Pull Request `new_annotations` → `main`  
→ **Review** : Code review équipe  
→ **Release** : Tag version, déploiement  

---

**Dernière mise à jour** : 2024-01-XX  
**Statut global** : Phase 6 EN COURS (0% complété)