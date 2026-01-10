# Guide de Tests Manuels - Répét

Ce document décrit les tests manuels à effectuer pour valider chaque fonctionnalité de l'application.

## 📋 Pré-requis

- Node.js 18+ installé
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Accès aux DevTools du navigateur
- Connexion internet (pour le premier chargement uniquement)

## 🚀 Préparation

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier les types
npm run type-check

# 3. Vérifier le linting
npm run lint

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir l'application sur `http://localhost:5173`

---

## ✅ Checklist de Tests

### 1. Tests de Build et Configuration

- [ ] `npm run type-check` passe sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run build` génère le dossier `dist/` avec succès
- [ ] `npm run preview` lance l'application en mode production
- [ ] Aucune erreur dans la console navigateur au chargement
- [ ] Service Worker enregistré (vérifier dans DevTools > Application > Service Workers)
- [ ] Manifest PWA présent (DevTools > Application > Manifest)

---

### 2. Tests du Parser

#### 2.1 Import de Fichier

- [ ] Ouvrir la page d'accueil (`/`)
- [ ] Cliquer sur "Choisir un fichier"
- [ ] Sélectionner `public/test-play.txt`
- [ ] Le fichier est bien chargé (nom affiché)
- [ ] Cliquer sur "Analyser la pièce"
- [ ] Aucune erreur dans la console
- [ ] Les métadonnées sont extraites (titre, auteur visible)
- [ ] Les personnages sont détectés
- [ ] Les actes et scènes sont parsés

#### 2.2 Validation de Fichier

- [ ] Essayer d'importer un fichier vide → message d'erreur approprié
- [ ] Essayer d'importer un fichier sans structure → message d'erreur
- [ ] Essayer d'importer un fichier trop volumineux (>5MB) → message d'erreur

---

### 3. Tests du Stockage (IndexedDB)

Ouvrir DevTools > Application > IndexedDB > RepetDB

#### 3.1 Sauvegarde de Pièce

- [ ] Importer et parser `test-play.txt`
- [ ] La pièce apparaît dans IndexedDB > `plays`
- [ ] Les champs sont correctement remplis (id, title, author, createdAt, etc.)
- [ ] `lines` est un tableau avec toutes les lignes aplaties

#### 3.2 Bibliothèque

- [ ] Naviguer vers `/library`
- [ ] La pièce importée apparaît dans la liste
- [ ] Les métadonnées (titre, auteur, date) sont affichées
- [ ] Importer une deuxième pièce
- [ ] Les deux pièces apparaissent dans la bibliothèque
- [ ] Les pièces sont triées par date (plus récent en premier)

#### 3.3 Recherche

- [ ] Dans la bibliothèque, taper un mot du titre dans la recherche
- [ ] La liste est filtrée en temps réel
- [ ] Taper un mot de l'auteur → filtrage correct
- [ ] Effacer la recherche → toutes les pièces réapparaissent

#### 3.4 Suppression

- [ ] Cliquer sur le bouton de suppression d'une pièce
- [ ] Une modale de confirmation apparaît
- [ ] Cliquer sur "Annuler" → la pièce n'est pas supprimée
- [ ] Cliquer à nouveau sur supprimer puis "Supprimer" → la pièce est supprimée
- [ ] Vérifier dans IndexedDB que la pièce a bien été supprimée

---

### 4. Tests du TTS (Text-to-Speech)

#### 4.1 Initialisation

Ouvrir la console navigateur et taper :

```javascript
await window.speechSynthesis.getVoices()
```

- [ ] Des voix sont retournées (au moins une voix française si disponible)
- [ ] Sur iOS : tester après une interaction utilisateur (clic)

#### 4.2 Configuration des Voix

- [ ] Aller dans `/settings`
- [ ] La liste des voix disponibles est affichée
- [ ] Sélectionner une voix française
- [ ] La voix est sauvegardée (persiste après rechargement)
- [ ] Ajuster la vitesse (0.5 → 2.0) avec le slider
- [ ] Ajuster le volume (0 → 1.0) avec le slider

#### 4.3 Lecture Vocale

- [ ] Ouvrir une pièce (`/play/:id`)
- [ ] Cliquer sur le bouton "Lire" (▶)
- [ ] La ligne courante est lue à voix haute
- [ ] Cliquer sur "Arrêter" (⏹) pendant la lecture → la lecture s'arrête
- [ ] Activer "Lecture automatique" dans les paramètres
- [ ] Lire une ligne → la ligne suivante démarre automatiquement

---

### 5. Tests de Navigation (Play Store)

#### 5.1 Navigation Ligne par Ligne

- [ ] Ouvrir une pièce (`/play/:id`)
- [ ] Cliquer sur "Suivant" → la ligne suivante s'affiche
- [ ] Cliquer sur "Précédent" → la ligne précédente s'affiche
- [ ] Le bouton "Précédent" est désactivé à la première ligne
- [ ] Le bouton "Suivant" est désactivé à la dernière ligne
- [ ] Les indicateurs (Ligne X / Y) sont corrects

#### 5.2 Navigation Actes/Scènes

- [ ] Le SceneNavigator affiche l'acte et scène actuels
- [ ] Sélectionner une autre scène dans le dropdown
- [ ] La navigation saute à la première ligne de cette scène
- [ ] La ligne courante est mise à jour

#### 5.3 Persistance

- [ ] Naviguer jusqu'à la ligne 10
- [ ] Rafraîchir la page (F5)
- [ ] La position de lecture est conservée (retour à la ligne 10)

---

### 6. Tests des Composants UI

#### 6.1 Layout et Navigation Générale

- [ ] Header présent sur toutes les pages
- [ ] Logo "Répét" cliquable → retour à l'accueil
- [ ] Liens de navigation : Accueil, Bibliothèque, Paramètres
- [ ] Chaque lien fonctionne correctement
- [ ] Pas de rechargement complet de page (SPA)

#### 6.2 Boutons

- [ ] Tous les boutons ont un état hover visible
- [ ] Tous les boutons ont un état disabled visible
- [ ] Les variants (primary, secondary, danger, ghost) sont distincts
- [ ] Les tailles (sm, md, lg) fonctionnent

#### 6.3 Inputs

- [ ] Les inputs acceptent le texte
- [ ] Le placeholder est visible
- [ ] L'état focus est visible (ring bleu)
- [ ] Les icônes (si présentes) s'affichent correctement

#### 6.4 Modales

- [ ] Les modales s'ouvrent avec animation
- [ ] Cliquer en dehors de la modale la ferme
- [ ] Appuyer sur ESC ferme la modale
- [ ] Le focus est piégé dans la modale (navigation Tab/Shift+Tab)
- [ ] Les boutons d'action fonctionnent

#### 6.5 Toasts/Notifications

- [ ] Les messages d'erreur s'affichent en rouge
- [ ] Les toasts disparaissent automatiquement après 5 secondes
- [ ] Possibilité de fermer manuellement un toast
- [ ] Plusieurs toasts peuvent s'empiler

#### 6.6 Spinner/Loading

- [ ] Le spinner s'affiche pendant le chargement des pièces
- [ ] Le spinner disparaît une fois les données chargées

---

### 7. Tests du PlayScreen

#### 7.1 Sélection de Personnage

- [ ] Ouvrir une pièce → modale de sélection de personnage s'ouvre
- [ ] La liste de tous les personnages est affichée
- [ ] Cliquer sur un personnage → il est sélectionné (badge visuel)
- [ ] Cliquer sur "Fermer" → la modale se ferme
- [ ] Le nom du personnage sélectionné apparaît dans le header
- [ ] Cliquer à nouveau sur le bouton personnage → possibilité de changer

#### 7.2 Affichage des Lignes

- [ ] La ligne courante est affichée en grand
- [ ] Le nom du personnage est affiché
- [ ] Le texte de la réplique est lisible
- [ ] Les didascalies sont en italique (si applicable)
- [ ] Les lignes de l'utilisateur sont surlignées (si configuré)
- [ ] Les lignes précédente/suivante sont visibles en contexte (opacité réduite)

#### 7.3 Contrôles de Lecture

- [ ] Les boutons Précédent/Suivant fonctionnent
- [ ] Le bouton Play/Pause fonctionne
- [ ] Le SceneNavigator permet de sauter entre scènes
- [ ] Les raccourcis clavier (si implémentés) fonctionnent

---

### 8. Tests du ReaderScreen

#### 8.1 Mode Lecteur

- [ ] Ouvrir une pièce en mode lecteur (`/reader/:id`)
- [ ] Si aucun personnage sélectionné → message d'erreur + bouton retour
- [ ] Sélectionner un personnage dans PlayScreen puis aller en mode Reader
- [ ] La ligne courante est mise en évidence (fond bleu)

#### 8.2 Filtrage des Lignes

- [ ] Par défaut, seules les lignes du personnage sélectionné sont affichées
- [ ] Cliquer sur "Toutes les lignes" → toutes les lignes de la scène s'affichent
- [ ] Cliquer sur "Mes lignes" → retour au filtrage
- [ ] Les lignes de l'utilisateur ont un badge "Vous"

#### 8.3 Liste des Lignes

- [ ] Toutes les lignes de la scène courante sont listées
- [ ] Cliquer sur une ligne → navigation vers cette ligne
- [ ] Cliquer sur le bouton ▶ d'une ligne → lecture TTS de cette ligne
- [ ] Pendant la lecture, les autres boutons ▶ sont désactivés

---

### 9. Tests du SettingsScreen

#### 9.1 Voix TTS

- [ ] La liste des voix du système est affichée
- [ ] Sélectionner une voix → elle est marquée comme sélectionnée
- [ ] La sélection persiste après rechargement

#### 9.2 Paramètres Audio

- [ ] Slider de vitesse (0.5 - 2.0) fonctionne
- [ ] Slider de volume (0 - 1.0) fonctionne
- [ ] Les valeurs sont affichées à côté des sliders
- [ ] Les changements sont appliqués immédiatement

#### 9.3 Modes de Lecture

- [ ] Toggle "Lecture automatique" fonctionne
- [ ] Toggle "Surligner mes lignes" fonctionne
- [ ] Les toggles persistent après rechargement

#### 9.4 Réinitialisation

- [ ] Bouton "Réinitialiser les paramètres" présent
- [ ] Cliquer → confirmation demandée
- [ ] Confirmer → tous les paramètres reviennent aux valeurs par défaut

---

### 10. Tests Responsive

#### 10.1 Mobile (< 768px)

- [ ] Navigation adaptée (burger menu si applicable)
- [ ] Tous les boutons sont cliquables (taille suffisante)
- [ ] Le texte est lisible (taille de police adaptée)
- [ ] Pas de scroll horizontal
- [ ] Les modales occupent toute la largeur

#### 10.2 Tablette (768px - 1024px)

- [ ] Layout adapté (colonnes réduites)
- [ ] Grille de pièces en 2 colonnes
- [ ] Navigation fonctionnelle

#### 10.3 Desktop (> 1024px)

- [ ] Layout complet
- [ ] Grille de pièces en 3 colonnes
- [ ] Max-width appliqué pour centrer le contenu

---

### 11. Tests du Mode Italiennes

#### 11.1 Activation du Mode

- [ ] Aller dans `/settings`
- [ ] Sélectionner le mode de lecture "Italiennes"
- [ ] Le radio button est bien coché
- [ ] Une option "Masquer mes répliques en mode italiennes" apparaît
- [ ] Cocher cette option
- [ ] La configuration persiste après rechargement

#### 11.2 Masquage des Lignes

- [ ] Ouvrir une pièce (`/play/:id`)
- [ ] Sélectionner un personnage
- [ ] Un badge "MODE ITALIENNES" apparaît dans le header (violet)
- [ ] Naviguer jusqu'à une ligne de votre personnage
- [ ] La ligne est masquée (fond violet, texte flouté)
- [ ] Le texte affiche "●●●●●●●●●●●●●●●"
- [ ] Un badge "🔒 Masqué" apparaît
- [ ] Un message "Récitez votre réplique de mémoire" est affiché

#### 11.3 Bouton Révéler

- [ ] Sur une ligne masquée, un bouton "👁️ Révéler ma réplique" apparaît
- [ ] Cliquer sur "Révéler" → le texte devient visible
- [ ] Le bouton change en "🔒 Masquer à nouveau"
- [ ] Cliquer sur "Masquer à nouveau" → le texte est à nouveau caché
- [ ] Naviguer vers la ligne suivante → l'état "révéler" se réinitialise

#### 11.4 Lignes des Autres Personnages

- [ ] Les lignes des autres personnages restent visibles
- [ ] Seules les lignes de votre personnage sont masquées
- [ ] Les didascalies restent visibles

#### 11.5 Mode Lecteur (ReaderScreen)

- [ ] Ouvrir `/reader/:id` en mode italiennes
- [ ] La ligne courante de votre personnage est masquée
- [ ] Dans la liste des lignes, vos lignes ont une icône 🔒
- [ ] Cliquer sur le bouton ▶ d'une ligne masquée est désactivé
- [ ] Le tooltip indique "Ligne masquée en mode italien"
- [ ] Le bouton "Révéler ma réplique" fonctionne aussi

#### 11.6 Toggle "Toutes les lignes"

- [ ] En mode Reader, activer "Toutes les lignes"
- [ ] Les lignes des autres personnages s'ajoutent
- [ ] Vos lignes restent masquées si le mode italien est actif

#### 11.7 Désactivation du Mode

- [ ] Retourner dans Settings
- [ ] Changer le mode de "Italiennes" à "Audio" ou "Silencieux"
- [ ] Retourner dans la pièce
- [ ] Le badge "MODE ITALIENNES" disparaît
- [ ] Toutes les lignes sont visibles

---

### 12. Tests PWA

#### 11.1 Installation

**Sur Desktop (Chrome/Edge)**
- [ ] Icône "Installer" apparaît dans la barre d'adresse
- [ ] Cliquer sur "Installer" → prompt d'installation
- [ ] L'application s'installe et s'ouvre dans une fenêtre standalone
- [ ] L'icône apparaît dans le menu d'applications

**Sur iOS (Safari)**
- [ ] Ouvrir l'application dans Safari
- [ ] Partage → "Sur l'écran d'accueil"
- [ ] L'icône est ajoutée à l'écran d'accueil
- [ ] Ouvrir l'app → s'ouvre en mode standalone (sans barre Safari)

**Sur Android (Chrome)**
- [ ] Banner "Ajouter à l'écran d'accueil" apparaît
- [ ] Installer → l'app apparaît dans le tiroir d'applications
- [ ] Ouvrir → mode standalone

#### 11.2 Offline

- [ ] Installer l'application
- [ ] Ouvrir DevTools > Application > Service Workers
- [ ] Cocher "Offline"
- [ ] Rafraîchir la page → l'application se charge quand même
- [ ] Les pièces stockées localement sont accessibles
- [ ] La navigation fonctionne
- [ ] Le TTS fonctionne (utilise l'API native du navigateur)

#### 11.3 Mise à Jour

- [ ] Modifier le code source (ex: changer un texte)
- [ ] Rebuilder l'application
- [ ] Rafraîchir la page → nouveau Service Worker détecté
- [ ] La nouvelle version se charge automatiquement

---

### 12. Tests de Performance

#### 12.1 Chargement Initial

- [ ] Temps de chargement < 3 secondes (3G)
- [ ] First Contentful Paint < 1.5 secondes
- [ ] Pas de layout shift visible
- [ ] Spinner de chargement pendant l'initialisation

#### 12.2 Navigation

- [ ] Transitions entre pages fluides (pas de freeze)
- [ ] Navigation ligne par ligne instantanée
- [ ] Pas de re-render inutile (vérifier avec React DevTools)

#### 12.3 Mémoire

- [ ] Ouvrir plusieurs pièces successivement
- [ ] Vérifier dans DevTools > Memory qu'il n'y a pas de fuite mémoire
- [ ] Le TTS s'arrête bien lors du changement de page

---

### 13. Tests de Sécurité et Confidentialité

- [ ] Aucune donnée n'est envoyée vers un serveur externe
- [ ] Toutes les données sont stockées localement (IndexedDB)
- [ ] Le TTS utilise l'API native (pas de service cloud)
- [ ] Pas de tracking / analytics
- [ ] Pas de cookies tiers

---

### 14. Tests de Compatibilité Navigateur

#### Chrome Desktop
- [ ] Toutes les fonctionnalités OK

#### Firefox Desktop
- [ ] Toutes les fonctionnalités OK
- [ ] TTS fonctionne (peut avoir moins de voix disponibles)

#### Safari Desktop
- [ ] Toutes les fonctionnalités OK
- [ ] TTS fonctionne

#### Safari iOS
- [ ] Application installable
- [ ] TTS nécessite une interaction utilisateur avant le premier speak()
- [ ] Tous les boutons cliquables (pas de problème de touch)

#### Chrome Android
- [ ] Application installable
- [ ] TTS fonctionne avec les voix du système
- [ ] Performance acceptable

---

### 13. Tests d'Intégration Mode Italiennes + TTS

#### 13.1 Mode Italiennes + Audio

- [ ] Activer mode "Italiennes" dans Settings
- [ ] Vos lignes sont masquées
- [ ] Les autres lignes peuvent être lues avec TTS
- [ ] Cliquer sur ▶ pour une ligne d'un autre personnage → TTS fonctionne
- [ ] Vos lignes masquées n'ont pas de bouton TTS actif

#### 13.2 Auto-play en Mode Italiennes

- [ ] Activer "Lecture automatique" dans Settings
- [ ] Activer mode "Italiennes"
- [ ] Lire une ligne d'un autre personnage → passe automatiquement à la suivante
- [ ] Si la suivante est votre ligne → s'arrête (car masquée)

#### 13.3 Révéler + TTS

- [ ] Sur une ligne masquée, cliquer sur "Révéler"
- [ ] Le texte devient visible
- [ ] Le bouton TTS est toujours désactivé (car votre ligne)
- [ ] C'est le comportement attendu (vous devez la réciter, pas l'écouter)

---

## 🐛 Reporting de Bugs

Si un test échoue, noter :

1. **Titre court et descriptif**
2. **Étapes pour reproduire**
3. **Comportement attendu**
4. **Comportement observé**
5. **Environnement** (OS, navigateur, version)
6. **Logs console** (screenshot ou copie)

---

## ✅ Validation Finale

Avant de marquer le projet comme terminé :

- [ ] Tous les tests ci-dessus passent (444+ items)
- [ ] Aucune erreur dans la console
- [ ] Aucun warning TypeScript
- [ ] Aucun warning ESLint
- [ ] Build de production réussit
- [ ] L'application fonctionne en mode offline
- [ ] L'application est installable en PWA
- [ ] Le mode italiennes fonctionne correctement
- [ ] Le bouton révéler fonctionne
- [ ] Le README est à jour
- [ ] La LICENSE est présente

---

**Bonne chance pour les tests ! 🎭**