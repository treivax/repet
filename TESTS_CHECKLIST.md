# ✅ Checklist de Tests - Répét

**Version** : _________  
**Date** : _________  
**Testeur** : _________  
**Environnement** : ☐ Desktop  ☐ Android  ☐ iOS

---

## 🌐 BUILD OFFLINE (app.repet.ecanasso.org)

### Chargement Initial

- [ ] URL https://app.repet.ecanasso.org accessible
- [ ] Page se charge sans erreur (< 10 secondes)
- [ ] Aucune erreur dans la console (F12)
- [ ] CSS et styles appliqués correctement
- [ ] Thème clair fonctionne
- [ ] Thème sombre fonctionne

### Installation PWA - Desktop (Chrome/Edge/Firefox)

- [ ] Icône d'installation (⊕) visible dans la barre d'adresse
- [ ] Clic sur icône → Prompt d'installation apparaît
- [ ] Installation réussie
- [ ] Application s'ouvre dans fenêtre dédiée
- [ ] Mode standalone (pas de barre d'URL)
- [ ] Icône dans le menu Démarrer/Applications

### Installation PWA - Android (Chrome)

- [ ] Menu (⋮) → "Installer l'application" visible
- [ ] Installation réussie
- [ ] Icône ajoutée à l'écran d'accueil
- [ ] Lancement depuis icône fonctionne
- [ ] Mode standalone (plein écran)

### Installation PWA - iOS (Safari)

- [ ] Bouton Partager (□↑) visible
- [ ] "Sur l'écran d'accueil" visible dans le menu
- [ ] Installation réussie
- [ ] Icône ajoutée à l'écran d'accueil
- [ ] Lancement depuis icône fonctionne
- [ ] Mode standalone (pas de barre Safari)

### Mode Hors Ligne

- [ ] Activer le mode avion OU couper le WiFi
- [ ] Recharger la page (F5)
- [ ] Application continue de fonctionner
- [ ] Aucune erreur réseau dans la console
- [ ] Interface complètement fonctionnelle

### Import et Gestion de Pièces

- [ ] Bouton "Importer" visible sur page d'accueil
- [ ] Import fichier .txt fonctionne
- [ ] Titre de la pièce affiché correctement
- [ ] Auteur affiché (si présent dans le fichier)
- [ ] Miniature/couleur générée
- [ ] Pièce apparaît dans la bibliothèque
- [ ] Clic sur la pièce → Détails s'ouvrent
- [ ] Suppression de pièce fonctionne

### Synthèse Vocale - 4 Voix Disponibles

**Tester chaque voix individuellement :**

- [ ] **Siwis** (Femme) - Visible dans la liste
- [ ] **Tom** (Homme) - Visible dans la liste
- [ ] **Jessica** (Femme) - Visible dans la liste
- [ ] **Pierre** (Homme) - Visible dans la liste

**Tests de lecture :**

- [ ] Assigner Siwis à un personnage → Lecture OK
- [ ] Assigner Tom à un personnage → Lecture OK
- [ ] Assigner Jessica à un personnage → Lecture OK
- [ ] Assigner Pierre à un personnage → Lecture OK
- [ ] Qualité audio acceptable (pas de distorsion)
- [ ] Pas de lag ou freeze pendant la lecture

### Mode Silencieux

- [ ] Sélectionner mode "Silencieux" (📖)
- [ ] Texte affiché correctement
- [ ] Navigation dans le texte fluide
- [ ] Clic sur une ligne fonctionne
- [ ] Scroll fonctionne
- [ ] Didascalies affichées en italique

### Mode Audio

- [ ] Sélectionner mode "Audio" (🔊)
- [ ] Affichage en cartes cliquables
- [ ] Lecture automatique démarre
- [ ] Suivi visuel de la ligne en cours (surbrillance)
- [ ] Bouton Lecture/Pause fonctionne
- [ ] Bouton "Ligne suivante" fonctionne
- [ ] Bouton "Ligne précédente" fonctionne
- [ ] Clic sur une carte → Démarre lecture à ce point
- [ ] Vitesse de lecture ajustable (0.5x à 2x)
- [ ] Slider de vitesse réactif

### Mode Italienne (Répétition)

- [ ] Sélectionner mode "Italienne" (🎭)
- [ ] Paramètre "Votre personnage" visible
- [ ] Sélection d'un personnage fonctionne
- [ ] Vos répliques sont masquées (••••••)
- [ ] Répliques des autres personnages visibles
- [ ] Clic sur réplique masquée → Révèle le texte
- [ ] Option "Masquer vos répliques" (toggle ON/OFF)
- [ ] Option "Afficher avant lecture" fonctionne
- [ ] Option "Afficher après lecture" fonctionne

### Paramètres Voix Off - 3 Toggles Indépendants

- [ ] **Toggle "Didascalies"** visible
- [ ] Didascalies ON → Lit les didascalies
- [ ] Didascalies OFF → Ne lit pas les didascalies
- [ ] **Toggle "Structure"** visible
- [ ] Structure ON → Lit titres, actes, scènes
- [ ] Structure OFF → Ne lit pas la structure
- [ ] **Toggle "Présentation"** visible
- [ ] Présentation ON → Lit section Cast/Personnages
- [ ] Présentation OFF → Ne lit pas la présentation
- [ ] Tous OFF → Seuls les dialogues sont lus

### Voix Narrateur

- [ ] Sélection de voix narrateur disponible
- [ ] Assigner une voix → Appliquée à la voix off
- [ ] Narrateur différent des personnages fonctionne
- [ ] Lecture cohérente avec la voix sélectionnée

### Sommaire et Navigation

- [ ] Icône sommaire visible
- [ ] Clic sur sommaire → Liste actes/scènes
- [ ] Clic sur une scène → Navigation directe
- [ ] Retour depuis le sommaire fonctionne
- [ ] Badge du mode (📖/🔊/🎭) cliquable
- [ ] Badge → Retour aux détails de la pièce

### Stockage Local (Persistance)

- [ ] Importer 2-3 pièces différentes
- [ ] Configurer des paramètres (voix, personnage)
- [ ] **Fermer complètement l'application**
- [ ] **Rouvrir l'application**
- [ ] Toutes les pièces toujours présentes
- [ ] Paramètres conservés (voix, personnage)
- [ ] Historique de lecture conservé

### Performance

- [ ] Temps de chargement initial : _______ sec (attendu < 10s)
- [ ] Temps de chargement d'une voix : _______ sec (attendu < 5s)
- [ ] Lecture fluide sans lag
- [ ] Pas de freeze de l'interface
- [ ] Transitions entre pages fluides
- [ ] Scroll réactif

---

## 🌐 BUILD ONLINE (ios.repet.ecanasso.org)

### Chargement Initial

- [ ] URL https://ios.repet.ecanasso.org accessible
- [ ] Page se charge rapidement (< 3 secondes)
- [ ] Aucune erreur console
- [ ] Styles appliqués
- [ ] Taille du build légère (pas de /voices)

### Téléchargement des Voix

- [ ] Importer une pièce
- [ ] Assigner une voix (ex: Siwis)
- [ ] Première lecture → Modal "Téléchargement en cours"
- [ ] Barre de progression affichée
- [ ] Progression en % visible
- [ ] Téléchargement réussi
- [ ] Lecture démarre automatiquement après DL

### Cache Persistant (OPFS)

- [ ] Lire avec une voix (ex: Tom)
- [ ] Voix téléchargée
- [ ] **Fermer l'application**
- [ ] **Couper le WiFi / Mode avion**
- [ ] Rouvrir l'application
- [ ] Relire avec Tom → **Pas de re-téléchargement**
- [ ] Voix fonctionne hors ligne (cache OPFS)

### Installation iOS (Safari uniquement)

- [ ] **Ouvrir dans Safari sur iOS**
- [ ] Bouton Partager → "Sur l'écran d'accueil"
- [ ] Installation réussie
- [ ] Lancement depuis l'icône
- [ ] Mode standalone (plein écran)
- [ ] Fonctionnement offline avec voix en cache

### Test Multi-Voix

- [ ] Télécharger Siwis → OK
- [ ] Télécharger Tom → OK
- [ ] Télécharger Jessica → OK
- [ ] Télécharger Pierre → OK
- [ ] Toutes les voix restent en cache
- [ ] Aucune erreur de quota de stockage

---

## 🔄 AUTO-UPDATE PWA

### Pré-requis

- [ ] PWA déjà installée (version actuelle : _______)
- [ ] Service Worker actif (vérifier DevTools)

### Déploiement Nouvelle Version

- [ ] Version bumpée dans `src/config/version.ts`
- [ ] Commit et push sur `main`
- [ ] Workflow GitHub Actions terminé ✅
- [ ] Nouvelle version déployée

### Test Update Automatique (après 1 heure)

- [ ] PWA reste ouverte pendant 1 heure
- [ ] Notification apparaît en bas à droite
- [ ] Message : "Mise à jour disponible"
- [ ] Bouton "Mettre à jour" visible
- [ ] Bouton "Plus tard" visible

### Test Update Manuel (rechargement)

- [ ] Recharger la page (F5 ou Ctrl+R)
- [ ] Attendre 5-10 secondes
- [ ] Notification de mise à jour apparaît
- [ ] Bouton "Mettre à jour" cliquable

### Application de la Mise à Jour

- [ ] Cliquer sur "Mettre à jour"
- [ ] Bouton devient "Mise à jour..."
- [ ] Page se recharge automatiquement
- [ ] Application redémarre
- [ ] **DevTools → Console** : nouvelle version affichée
- [ ] Log : `App version updated: X.X.X → Y.Y.Y`
- [ ] Toutes les pièces toujours présentes
- [ ] Paramètres conservés
- [ ] Fonctionnalité intacte

### Test "Plus tard"

- [ ] Déployer nouvelle version
- [ ] Notification apparaît
- [ ] Cliquer sur "Plus tard"
- [ ] Notification disparaît
- [ ] Application continue sur version actuelle
- [ ] Recharger (F5) → Notification réapparaît

### Vérification Service Worker (DevTools)

**DevTools → Application → Service Workers :**

- [ ] Status : `activated and is running`
- [ ] Source : `/sw.js` visible
- [ ] "Update on reload" : décoché
- [ ] Cliquer "Update" → Force check
- [ ] "Offline" : Simuler → App fonctionne

**DevTools → Application → Manifest :**

- [ ] Identity : "Répét - Répétition Théâtre"
- [ ] Presentation : `standalone`
- [ ] Icons : 192x192 présente
- [ ] Icons : 512x512 présente

**DevTools → Application → Cache Storage :**

- [ ] Cache `workbox-precache-v2-...` présent
- [ ] Fichiers JS/CSS/images en cache
- [ ] **Pas de .onnx** dans le precache (trop gros)

---

## 🐛 Tests d'Erreurs et Edge Cases

### Fichiers Invalides

- [ ] Import fichier non-.txt → Message d'erreur clair
- [ ] Fichier .txt vide → Message d'erreur
- [ ] Fichier mal formaté → Parse ou message d'erreur
- [ ] Fichier très gros (> 1 MB) → Gestion correcte

### Réseau Instable (online)

- [ ] Téléchargement voix → Couper WiFi au milieu
- [ ] Message d'erreur approprié
- [ ] Possibilité de réessayer
- [ ] Pas de crash de l'application

### Quota de Stockage

- [ ] Importer 10+ pièces
- [ ] Télécharger 4 voix (online)
- [ ] Vérifier quota restant
- [ ] Aucune erreur de quota atteinte

### Navigation

- [ ] Retour depuis détails → Bibliothèque
- [ ] Retour depuis lecture → Détails
- [ ] Navigation navigateur (←) fonctionne
- [ ] Aucune perte de données

---

## 📊 Métriques Finales

**Build Offline :**
- Taille totale : _______ MB (attendu ~248 MB)
- Chargement initial : _______ sec (attendu < 10s)
- Installation PWA : ☐ Succès ☐ Échec

**Build Online :**
- Taille totale : _______ MB (attendu ~54 MB)
- Chargement initial : _______ sec (attendu < 3s)
- Installation PWA : ☐ Succès ☐ Échec

**Auto-Update :**
- Notification apparaît : ☐ Oui ☐ Non
- Mise à jour appliquée : ☐ Oui ☐ Non
- Intervalle de check : ☐ 1h ☐ Autre : _______

**Bugs Trouvés :**

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Notes :**

_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## ✅ Validation Finale

- [ ] Tous les tests critiques passent ✅
- [ ] Aucun bug bloquant
- [ ] Performance acceptable
- [ ] PWA installable sur toutes plateformes
- [ ] Auto-update fonctionne correctement
- [ ] Prêt pour production

**Signature** : _________________  **Date** : _________________

---

**🎉 Tests Terminés - Répét v_______ validé pour déploiement !**