# 🚀 Plan de Déploiement O2switch - Répét

**Version actuelle** : v0.1.0  
**Date** : Janvier 2025  
**Builds** : Offline (248 MB) + Online (54 MB)

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration GitHub Secrets](#configuration-github-secrets)
3. [Déploiement Automatique](#déploiement-automatique)
4. [Déploiement Manuel](#déploiement-manuel)
5. [Tests Fonctionnels](#tests-fonctionnels)
6. [Tests Auto-Update PWA](#tests-auto-update-pwa)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

### Côté O2switch

- [ ] Compte O2switch actif
- [ ] Accès FTP configuré
- [ ] Deux sous-domaines configurés :
  - `app.repet.ecanasso.org` → Build Offline
  - `ios.repet.ecanasso.org` → Build Online
- [ ] Certificats SSL actifs sur les deux domaines
- [ ] `.htaccess` supporté (Apache)
- [ ] Modules Apache requis activés :
  - `mod_headers` (Headers CORS/PWA)
  - `mod_rewrite` (SPA routing)
  - `mod_deflate` (Compression GZIP)
  - `mod_mime` (MIME types)

### Côté GitHub

- [ ] Repository accessible
- [ ] GitHub Actions activé
- [ ] Secrets configurés (voir section suivante)

### Côté Local

- [ ] Node.js 18+ installé
- [ ] npm installé
- [ ] Git configuré
- [ ] Code à jour sur `main`

---

## 🔐 Configuration GitHub Secrets

Les secrets suivants DOIVENT être configurés dans **Settings → Secrets and variables → Actions** :

### Secrets Requis

```
O2SWITCH_FTP_HOST         # Exemple: ftp.ecanasso.org
O2SWITCH_FTP_USERNAME     # Exemple: votre_user_cpanel
O2SWITCH_FTP_PASSWORD     # Mot de passe FTP
O2SWITCH_PATH_OFFLINE     # Exemple: /public_html/app.repet.ecanasso.org
O2SWITCH_PATH_ONLINE      # Exemple: /public_html/ios.repet.ecanasso.org
```

### Vérification des Secrets

**Dans GitHub** :
1. Aller sur le repository
2. Settings → Secrets and variables → Actions
3. Vérifier que les 5 secrets existent
4. ⚠️ Les valeurs ne sont pas visibles (normal)

**Test des secrets** :
Les secrets seront testés automatiquement lors du premier déploiement. En cas d'erreur, le workflow affichera quel secret manque.

---

## 🤖 Déploiement Automatique

### Via Push sur `main`

**Le déploiement se déclenche automatiquement à chaque push sur `main`.**

```bash
# 1. Vérifier que vous êtes sur main
git branch

# 2. Bumper la version (important pour auto-update PWA)
# Éditer src/config/version.ts
export const APP_VERSION = '0.1.1'  # Incrémenter

# 3. Commit
git add src/config/version.ts
git commit -m "chore: bump version to 0.1.1"

# 4. Push (déclenche le déploiement)
git push origin main
```

**Le workflow GitHub Actions va** :
1. ✅ Checkout du code
2. ✅ Install des dépendances
3. ✅ Type check
4. ✅ Lint
5. ✅ Build offline (dist-offline/)
6. ✅ Build online (dist-online/)
7. ✅ Génération des `.htaccess`
8. ✅ Upload FTP vers O2switch (2 jobs parallèles)

### Via GitHub Actions (Manuel)

Si vous voulez déployer sans push :

1. Aller sur **Actions** dans GitHub
2. Sélectionner **Deploy to O2switch**
3. Cliquer sur **Run workflow**
4. Sélectionner la branche `main`
5. Cliquer sur **Run workflow**

### Suivi du Déploiement

1. Aller sur **Actions** dans GitHub
2. Cliquer sur le workflow en cours
3. Observer les logs en temps réel
4. Vérifier que les 2 jobs (offline + online) sont ✅

**Durée estimée** : 5-10 minutes

---

## 🛠️ Déploiement Manuel

Si GitHub Actions ne fonctionne pas, déploiement manuel via FTP/SFTP.

### Étape 1 : Build Local

```bash
# Installer les dépendances
npm ci

# Build les deux versions
npm run build

# Vérifier les builds
ls -lh dist-offline/
ls -lh dist-online/
```

### Étape 2 : Créer les .htaccess

**Pour dist-offline/.htaccess** :

```bash
cat > dist-offline/.htaccess << 'EOF'
# .htaccess pour Répét Offline (app.repet.ecanasso.org)

<IfModule mod_headers.c>
    # Headers WASM/PWA requis
    Header set Cross-Origin-Embedder-Policy "credentialless"
    Header set Cross-Origin-Opener-Policy "same-origin"
    
    # Sécurité
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    
    # Service Worker - toujours frais
    <FilesMatch "sw\.js$">
        Header set Cache-Control "public, max-age=0, must-revalidate"
    </FilesMatch>
    
    # Assets hashés - cache agressif
    <FilesMatch "\.(js|css|woff2|png|jpg|svg)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    
    # WASM et modèles
    <FilesMatch "\.(wasm|onnx|data)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_mime.c>
    AddType application/wasm .wasm
    AddType application/octet-stream .onnx
    AddType application/octet-stream .data
</IfModule>

Options -Indexes
DirectoryIndex index.html
EOF
```

**Pour dist-online/.htaccess** : (même contenu, sans les règles `.onnx`)

### Étape 3 : Upload FTP

**Via FileZilla** :

1. Connexion FTP :
   - Hôte : `ftp.ecanasso.org`
   - Utilisateur : `[votre_user]`
   - Mot de passe : `[votre_mdp]`
   - Port : 21

2. Upload Offline :
   - Distant : `/public_html/app.repet.ecanasso.org/`
   - Local : `dist-offline/`
   - ⚠️ Supprimer le contenu distant AVANT upload

3. Upload Online :
   - Distant : `/public_html/ios.repet.ecanasso.org/`
   - Local : `dist-online/`
   - ⚠️ Supprimer le contenu distant AVANT upload

**Via lftp (ligne de commande)** :

```bash
# Offline
lftp -u username,password ftp.ecanasso.org -e "
  cd /public_html/app.repet.ecanasso.org;
  mirror -R --delete dist-offline/ ./;
  bye
"

# Online
lftp -u username,password ftp.ecanasso.org -e "
  cd /public_html/ios.repet.ecanasso.org;
  mirror -R --delete dist-online/ ./;
  bye
"
```

---

## 🧪 Tests Fonctionnels

### Checklist Build Offline (app.repet.ecanasso.org)

#### 1. Chargement Initial

- [ ] **Ouvrir** : https://app.repet.ecanasso.org
- [ ] Page se charge sans erreur
- [ ] Aucune erreur console (F12)
- [ ] CSS/styles appliqués correctement
- [ ] Mode clair/sombre fonctionne

#### 2. Installation PWA

**Desktop (Chrome)** :
- [ ] Icône d'installation (⊕) visible dans la barre d'adresse
- [ ] Clic sur l'icône → Prompt d'installation apparaît
- [ ] Installation réussie
- [ ] Application s'ouvre dans une fenêtre dédiée
- [ ] Barre d'URL absente (standalone)

**Android (Chrome)** :
- [ ] Menu (⋮) → "Installer l'application" visible
- [ ] Installation sur écran d'accueil réussie
- [ ] Lancement depuis l'icône fonctionne
- [ ] Mode standalone actif

**iOS (Safari)** :
- [ ] Bouton Partager → "Sur l'écran d'accueil" visible
- [ ] Ajout à l'écran d'accueil réussi
- [ ] Lancement depuis l'icône fonctionne
- [ ] PWA standalone (pas de barre Safari)

#### 3. Mode Hors Ligne

- [ ] **Activer le mode avion** / **Couper le WiFi**
- [ ] Recharger la page (F5)
- [ ] Application fonctionne toujours
- [ ] Aucune erreur réseau dans la console
- [ ] Importer une pièce fonctionne
- [ ] Lecture fonctionne

#### 4. Synthèse Vocale (4 voix)

- [ ] **Importer une pièce** (utiliser `examples/ALEGRIA.txt`)
- [ ] Aller dans les détails de la pièce
- [ ] **Voix disponibles** : Siwis, Tom, Jessica, Pierre (4 voix)
- [ ] Assigner Siwis à un personnage → Test lecture ✅
- [ ] Assigner Tom à un personnage → Test lecture ✅
- [ ] Assigner Jessica à un personnage → Test lecture ✅
- [ ] Assigner Pierre à un personnage → Test lecture ✅
- [ ] Toutes les voix fonctionnent offline

#### 5. Modes de Lecture

**Mode Silencieux** :
- [ ] Affichage texte correct
- [ ] Clic sur ligne fonctionne
- [ ] Navigation fluide

**Mode Audio** :
- [ ] Lecture automatique démarre
- [ ] Suivi visuel de la ligne en cours
- [ ] Boutons Lecture/Pause fonctionnent
- [ ] Boutons Suivant/Précédent fonctionnent
- [ ] Vitesse de lecture ajustable

**Mode Italienne** :
- [ ] Sélectionner "Votre personnage"
- [ ] Vos répliques sont masquées (••••••)
- [ ] Répliques des autres personnages visibles
- [ ] Clic sur ligne masquée → Révèle temporairement
- [ ] Options "Afficher avant/après" fonctionnent

#### 6. Paramètres Voix Off

- [ ] **3 toggles indépendants** visibles :
  - [ ] Didascalies (ON/OFF)
  - [ ] Structure (ON/OFF)
  - [ ] Présentation (ON/OFF)
- [ ] Toggle Didascalies → Lit les didascalies
- [ ] Toggle Structure → Lit actes/scènes
- [ ] Toggle Présentation → Lit la section Cast
- [ ] Désactiver tous → Seuls dialogues lus

#### 7. Stockage Local

- [ ] Importer plusieurs pièces
- [ ] Fermer l'application
- [ ] Rouvrir l'application
- [ ] Toutes les pièces toujours présentes
- [ ] Paramètres conservés

#### 8. Performance

- [ ] Temps de chargement initial : **< 10 secondes**
- [ ] Chargement voix : **< 5 secondes** (première utilisation)
- [ ] Lecture fluide, sans lag
- [ ] Pas de freeze de l'interface

### Checklist Build Online (ios.repet.ecanasso.org)

#### 1. Chargement Initial

- [ ] **Ouvrir** : https://ios.repet.ecanasso.org
- [ ] Page se charge rapidement (< 3 secondes)
- [ ] Aucune erreur console
- [ ] Styles appliqués

#### 2. Téléchargement Voix

- [ ] Importer une pièce
- [ ] Assigner une voix (ex: Siwis)
- [ ] **Première lecture** : Modal "Téléchargement en cours"
- [ ] Barre de progression affichée
- [ ] Téléchargement réussi
- [ ] Lecture démarre automatiquement après DL

#### 3. Cache Persistant (OPFS)

- [ ] Lecture avec Siwis (téléchargée)
- [ ] **Fermer l'application**
- [ ] **Couper le WiFi / Mode avion**
- [ ] Rouvrir l'application
- [ ] Relire avec Siwis → **Pas de re-téléchargement**
- [ ] Voix fonctionne hors ligne (OPFS cache)

#### 4. Installation iOS

- [ ] **Safari sur iOS uniquement**
- [ ] Partager → "Sur l'écran d'accueil"
- [ ] Installation réussie
- [ ] Lancement depuis l'icône
- [ ] Mode standalone
- [ ] Fonctionnement offline (voix en cache)

#### 5. Limite de Stockage

- [ ] **Tester avec 4 voix** (Siwis, Tom, Jessica, Pierre)
- [ ] Télécharger toutes les voix successivement
- [ ] Vérifier qu'aucune erreur de quota
- [ ] Toutes restent en cache OPFS

---

## 🔄 Tests Auto-Update PWA

### Objectif

Vérifier que la PWA détecte et applique automatiquement les mises à jour.

### Pré-requis

- Application déjà déployée et installée
- Service Worker actif

### Scénario de Test

#### Étape 1 : Installation Initiale (v0.1.0)

1. **Déployer la version v0.1.0**
   ```bash
   # Dans src/config/version.ts
   export const APP_VERSION = '0.1.0'
   
   # Commit et push
   git commit -am "chore: version 0.1.0"
   git push origin main
   ```

2. **Attendre le déploiement** (5-10 min)

3. **Installer la PWA**
   - Ouvrir https://app.repet.ecanasso.org
   - Installer la PWA (icône ⊕)
   - Fermer et rouvrir depuis l'icône PWA

4. **Vérifier la version**
   - Ouvrir DevTools (F12) → Console
   - Chercher : `App Version: 0.1.0`
   - ✅ Confirmer que c'est bien v0.1.0

#### Étape 2 : Déployer Nouvelle Version (v0.1.1)

1. **Bumper la version**
   ```bash
   # Dans src/config/version.ts
   export const APP_VERSION = '0.1.1'
   
   # Commit et push
   git commit -am "chore: version 0.1.1"
   git push origin main
   ```

2. **Attendre le déploiement** (5-10 min)

#### Étape 3 : Test Auto-Update

**Cas 1 : Update Check Automatique (après 1 heure)**

- [ ] **Garder la PWA ouverte** pendant 1 heure
- [ ] **Après 1h** : Notification apparaît en bas à droite
- [ ] Message : "Mise à jour disponible"
- [ ] Bouton "Mettre à jour" visible
- [ ] Bouton "Plus tard" visible

**Cas 2 : Update Check Manuel (rechargement)**

- [ ] **Recharger la page** (Ctrl+R ou F5)
- [ ] Service Worker détecte la nouvelle version
- [ ] **Notification apparaît** dans les 5-10 secondes
- [ ] Message : "Mise à jour disponible"

#### Étape 4 : Appliquer la Mise à Jour

1. **Cliquer sur "Mettre à jour"**
   - [ ] Bouton devient "Mise à jour..."
   - [ ] Page se recharge automatiquement
   - [ ] Application redémarre

2. **Vérifier la nouvelle version**
   - [ ] Ouvrir DevTools → Console
   - [ ] Chercher : `App Version: 0.1.1`
   - [ ] Chercher : `App version updated: 0.1.0 → 0.1.1`
   - [ ] ✅ Version correctement mise à jour

3. **Fonctionnalité intacte**
   - [ ] Toutes les pièces toujours présentes
   - [ ] Paramètres conservés
   - [ ] Voix toujours en cache
   - [ ] Lecture fonctionne

#### Étape 5 : Test "Plus tard"

1. **Redéployer v0.1.2**
2. **Notification apparaît**
3. **Cliquer sur "Plus tard"**
   - [ ] Notification disparaît
   - [ ] Application continue sur v0.1.1
   - [ ] Aucun rechargement

4. **Recharger manuellement (F5)**
   - [ ] Notification réapparaît
   - [ ] Option de mise à jour toujours disponible

### Vérification Service Worker

**DevTools → Application → Service Workers** :

- [ ] **Status** : `activated and is running`
- [ ] **Source** : `/sw.js` ou `/workbox-*.js`
- [ ] **Update on reload** : décoché (normal)
- [ ] **Offline** : simuler → App continue de fonctionner

**DevTools → Application → Manifest** :

- [ ] **Identity** : "Répét - Répétition Théâtre"
- [ ] **Presentation** : `standalone`
- [ ] **Icons** : 192x192 et 512x512 présentes

**DevTools → Application → Cache Storage** :

- [ ] Cache `workbox-precache-v2-...` présent
- [ ] Fichiers JS/CSS/images en cache
- [ ] **NE contient PAS** les `.onnx` (trop gros)

### Logs de Mise à Jour

**Console doit afficher** :

```
[PWA] Service Worker enregistré: /sw.js
[PWA] Vérification des mises à jour...
[PWA] Nouvelle version disponible
[PWA] Mise à jour du Service Worker...
🔄 App version updated: 0.1.0 → 0.1.1
📦 Répét - Version Info
App Version: 0.1.1
Model Version: 1.0.0
Build Mode: offline
```

---

## 🔙 Rollback

Si un déploiement pose problème, rollback rapide.

### Méthode 1 : Rollback Git + Redéploiement

```bash
# 1. Identifier le commit stable
git log --oneline

# 2. Revert au commit stable
git revert <commit_hash>

# ou reset hard (attention!)
git reset --hard <commit_hash>
git push origin main --force

# 3. Le workflow redéploie automatiquement
```

### Méthode 2 : Rollback FTP Manuel

1. **Sauvegarder le build stable localement** (avant chaque déploiement)
   ```bash
   cp -r dist-offline/ backups/dist-offline-v0.1.0/
   cp -r dist-online/ backups/dist-online-v0.1.0/
   ```

2. **Re-upload la version stable** via FTP/FileZilla

### Méthode 3 : Désactiver Auto-Update

Si l'auto-update pose problème :

1. Éditer `src/App.tsx` :
   ```tsx
   <UpdateManager checkInterval={60 * 60 * 1000} autoUpdate={false} />
   // Passer autoUpdate à true pour forcer l'update sans prompt
   ```

2. Redéployer

---

## 🐛 Troubleshooting

### Problème : Déploiement GitHub Actions échoue

**Erreur** : `O2SWITCH_FTP_HOST n'est pas défini`

**Solution** :
1. Vérifier les secrets GitHub (Settings → Secrets)
2. Re-créer le secret manquant
3. Re-run le workflow

---

### Problème : .htaccess ne fonctionne pas

**Symptôme** : Erreur 404 sur routes, headers CORS manquants

**Solution** :
1. Vérifier que `.htaccess` est bien uploadé
2. Vérifier dans cPanel : **Apache mod_rewrite** activé
3. Tester `.htaccess` localement :
   ```bash
   # Vérifier la syntaxe
   apachectl configtest
   ```

---

### Problème : Service Worker ne s'installe pas

**Symptôme** : Pas d'icône d'installation, mode offline ne fonctionne pas

**Vérifications** :
1. **HTTPS actif** (PWA = HTTPS obligatoire)
   - Vérifier : https://app.repet.ecanasso.org (pas http://)
2. **sw.js accessible**
   - Tester : https://app.repet.ecanasso.org/sw.js
   - Doit retourner du JS (pas 404)
3. **Headers corrects**
   - DevTools → Network → sw.js
   - Vérifier `Content-Type: application/javascript`
   - Vérifier `Cache-Control: public, max-age=0, must-revalidate`

---

### Problème : Voix ne se chargent pas (offline)

**Symptôme** : Erreur "Modèle Piper non trouvé"

**Vérifications** :
1. **Fichiers .onnx présents**
   ```bash
   # Vérifier localement
   ls -lh dist-offline/voices/
   # Doit contenir 3 dossiers : siwis, tom, upmc
   ```
2. **Upload FTP complet**
   - Vérifier que `/voices/` est bien uploadé
   - Taille attendue : ~248 MB
3. **Headers WASM corrects**
   - DevTools → Network → .onnx
   - Headers : `Cross-Origin-Embedder-Policy: credentialless`

---

### Problème : Auto-update ne fonctionne pas

**Symptôme** : Nouvelle version déployée mais notification n'apparaît pas

**Vérifications** :
1. **Version bumpée** dans `src/config/version.ts`
2. **Service Worker mis à jour**
   - DevTools → Application → Service Workers
   - Cliquer sur "Update" manuellement
3. **Attendre 1 heure** (intervalle de check automatique)
4. **Forcer le rechargement** (Ctrl+Shift+R)

---

### Problème : Build GitHub Actions échoue (Cannot find module)

**Symptôme** : 
```
Cannot find module '../hooks/useAudioOptimization'
Cannot find module '@/config/version'
Cannot find module './core/pwa/UpdateManager'
```

**Cause** : Virgule en trop dans `tsconfig.json` section `paths`

**Solution** :
Éditer `tsconfig.json` et supprimer la virgule après `"@/*": ["./src/*"]` :

```json
"paths": {
  "@/*": ["./src/*"]    // Pas de virgule ici
}
```

Tester localement :
```bash
npm run type-check
# Doit passer sans erreur
```

---

### Problème : WASM ne charge pas (SharedArrayBuffer)

**Symptôme** : Erreur `SharedArrayBuffer is not defined`

**Solution** :
Vérifier les headers dans `.htaccess` :
```apache
Header set Cross-Origin-Embedder-Policy "credentialless"
Header set Cross-Origin-Opener-Policy "same-origin"
```

Tester avec :
```bash
curl -I https://app.repet.ecanasso.org | grep -i "cross-origin"
```

---

## 📊 Métriques de Succès

### Build Offline

- ✅ Taille : **~248 MB**
- ✅ Temps de chargement initial : **< 10s**
- ✅ Temps de chargement voix : **< 5s**
- ✅ Fonctionne 100% hors ligne

### Build Online

- ✅ Taille : **~54 MB**
- ✅ Temps de chargement initial : **< 3s**
- ✅ Temps téléchargement voix : **< 10s** (selon réseau)
- ✅ Compatible iOS PWA

### PWA

- ✅ Installation possible (Desktop, Android, iOS)
- ✅ Mode standalone actif
- ✅ Service Worker actif
- ✅ Auto-update fonctionnel (check toutes les heures)

---

## ✅ Checklist Finale Déploiement

Avant de déclarer le déploiement réussi :

- [ ] Déploiement GitHub Actions ✅ (offline + online)
- [ ] Build Offline accessible : https://app.repet.ecanasso.org
- [ ] Build Online accessible : https://ios.repet.ecanasso.org
- [ ] HTTPS actif sur les deux domaines
- [ ] PWA installable (Desktop + Mobile)
- [ ] Mode offline fonctionnel (build offline)
- [ ] 4 voix fonctionnent (Siwis, Tom, Jessica, Pierre)
- [ ] 3 modes de lecture OK (Silencieux, Audio, Italienne)
- [ ] 3 toggles voix off fonctionnent
- [ ] Stockage local persiste
- [ ] Auto-update PWA testé et validé
- [ ] Aucune erreur console
- [ ] Performance acceptable (< 10s)

---

**🎉 Déploiement Terminé !**

Les deux versions de Répét sont maintenant en production sur O2switch avec auto-update PWA fonctionnel.