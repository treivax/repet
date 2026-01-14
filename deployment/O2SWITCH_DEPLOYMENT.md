# Déploiement O2switch - Guide Complet

Ce document décrit la procédure complète pour déployer les deux builds de Répét sur l'hébergeur O2switch.

## 📋 Vue d'ensemble

Répét utilise une architecture dual-build :

- **Build OFFLINE** (~675 MB) : Version complète avec toutes les voix embarquées
  - URL : `https://app.repet.ecanasso.org`
  - Dossier : `dist-offline/`
  - Cible : Desktop (Chrome, Firefox, Edge, Safari) et Android

- **Build ONLINE** (~10 MB) : Version légère qui télécharge les voix à la demande
  - URL : `https://ios.repet.ecanasso.org`
  - Dossier : `dist-online/`
  - Cible : iOS/Safari/macOS

## ⚠️ Note importante sur le déploiement

O2switch nécessite d'autoriser les adresses IP pour l'accès SSH, ce qui n'est pas compatible avec GitHub Actions (IPs dynamiques). **Le déploiement utilise donc FTP/FTPS** qui est plus adapté à ce cas d'usage.

## 🔧 Prérequis

- [x] Compte O2switch avec accès cPanel
- [x] Domaine `ecanasso.org` configuré sur O2switch
- [x] Accès FTP (utilisé pour le déploiement automatique)
- [x] Git et Node.js installés localement
- [x] Accès au repository GitHub

## 📦 Configuration O2switch (cPanel)

### Étape 1 : Créer les sous-domaines

**Via cPanel → Domaines → Sous-domaines :**

1. **Créer le sous-domaine pour le build OFFLINE**
   - Sous-domaine : `app.repet`
   - Domaine : `ecanasso.org`
   - Racine du document : `/home/VOTRE_USERNAME/public_html/app.repet.ecanasso.org`
   - Cliquer sur "Créer"

2. **Créer le sous-domaine pour le build ONLINE**
   - Sous-domaine : `ios.repet`
   - Domaine : `ecanasso.org`
   - Racine du document : `/home/VOTRE_USERNAME/public_html/ios.repet.ecanasso.org`
   - Cliquer sur "Créer"

### Étape 2 : Activer SSL (Let's Encrypt)

**Via cPanel → Sécurité → SSL/TLS Status :**

1. Rechercher `app.repet.ecanasso.org`
2. Cliquer sur "Run AutoSSL"
3. Répéter pour `ios.repet.ecanasso.org`

Vérifier que les certificats sont bien installés (icône verte).

### Étape 3 : Récupérer les informations FTP

**Via cPanel → Fichiers → Comptes FTP :**

1. Noter les informations de connexion FTP :
   - Serveur FTP : généralement `ftp.ecanasso.org` ou `ecanasso.org`
   - Nom d'utilisateur : `votreuser@ecanasso.org` (format complet)
   - Mot de passe : votre mot de passe cPanel (ou créer un compte FTP dédié)

2. Noter les chemins des dossiers :
   - Offline : `/home/VOTRE_USERNAME/public_html/app.repet.ecanasso.org`
   - Online : `/home/VOTRE_USERNAME/public_html/ios.repet.ecanasso.org`

**Test de connexion FTP (optionnel) :**
```bash
# Via lftp (à installer : sudo apt install lftp)
lftp -u votreuser@ecanasso.org ftp.ecanasso.org
# Entrer le mot de passe
# Taper 'ls' pour lister les fichiers
# Taper 'quit' pour quitter
```

## 🔐 Configuration des secrets GitHub

### Étape 1 : Accéder aux secrets du repository

1. Aller sur GitHub : `https://github.com/VOTRE_USERNAME/repet`
2. Cliquer sur **Settings** (Paramètres)
3. Dans le menu latéral : **Secrets and variables** → **Actions**
4. Onglet **"Repository secrets"**

### Étape 2 : Ajouter les secrets

Cliquer sur **"New repository secret"** pour chaque secret :

#### Secret 1 : O2SWITCH_FTP_HOST
```
Name: O2SWITCH_FTP_HOST
Value: ftp.ecanasso.org
```
*(Ou simplement `ecanasso.org` si le FTP fonctionne sur ce domaine)*

#### Secret 2 : O2SWITCH_FTP_USERNAME
```
Name: O2SWITCH_FTP_USERNAME
Value: votreuser@ecanasso.org
```
*(Format complet avec @ecanasso.org)*

#### Secret 3 : O2SWITCH_FTP_PASSWORD
```
Name: O2SWITCH_FTP_PASSWORD
Value: VOTRE_MOT_DE_PASSE
```
⚠️ **Sécurité** : Utilisez de préférence un compte FTP dédié avec accès limité aux dossiers de déploiement uniquement.

#### Secret 4 : O2SWITCH_PATH_OFFLINE
```
Name: O2SWITCH_PATH_OFFLINE
Value: /public_html/app.repet.ecanasso.org
```
⚠️ **Important** : Le chemin est relatif au home FTP, sans `/home/username` au début.

#### Secret 5 : O2SWITCH_PATH_ONLINE
```
Name: O2SWITCH_PATH_ONLINE
Value: /public_html/ios.repet.ecanasso.org
```

**Comment trouver le chemin exact :**
1. Se connecter en FTP avec un client (FileZilla, etc.)
2. Noter le chemin affiché à partir du dossier home
3. Généralement : `/public_html/nom_du_sous_domaine/`

### Résumé des secrets

| Nom du secret | Exemple de valeur |
|---------------|-------------------|
| `O2SWITCH_FTP_HOST` | `ftp.ecanasso.org` |
| `O2SWITCH_FTP_USERNAME` | `ecanasso@ecanasso.org` |
| `O2SWITCH_FTP_PASSWORD` | `votre_mot_de_passe` |
| `O2SWITCH_PATH_OFFLINE` | `/public_html/app.repet.ecanasso.org` |
| `O2SWITCH_PATH_ONLINE` | `/public_html/ios.repet.ecanasso.org` |

## 🚀 Déploiement

### Déploiement automatique (via GitHub Actions)

Le déploiement se fait automatiquement à chaque push sur la branche `main`.

**Workflow :**
1. Push du code sur `main`
2. GitHub Actions détecte le push
3. Build des deux versions (offline + online)
4. Vérification de la qualité (type-check + lint)
5. Déploiement via FTP (lftp) sur O2switch

**Fichier de workflow :** `.github/workflows/deploy-o2switch.yml`

**Méthode de déploiement :** `lftp` avec mirror
- Synchronisation intelligente (seulement les fichiers modifiés)
- Suppression des fichiers obsolètes (`--delete`)
- Upload parallèle pour plus de rapidité

**Voir le statut du déploiement :**
- GitHub → Actions → Dernière exécution

### Déploiement manuel (local)

Si vous devez déployer manuellement sans passer par GitHub Actions :

**Option 1 : Via FTP avec lftp (recommandé)**

```bash
# 1. Builder les deux versions
npm run build

# 2. Installer lftp si nécessaire
sudo apt install lftp  # Linux
brew install lftp      # macOS

# 3. Déployer la version OFFLINE
lftp -c "
  set ftp:ssl-allow no;
  open -u votreuser@ecanasso.org,VOTRE_PASSWORD ftp.ecanasso.org;
  mirror --reverse --delete --verbose dist-offline/ /public_html/app.repet.ecanasso.org/;
  bye;
"

# 4. Déployer la version ONLINE
lftp -c "
  set ftp:ssl-allow no;
  open -u votreuser@ecanasso.org,VOTRE_PASSWORD ftp.ecanasso.org;
  mirror --reverse --delete --verbose dist-online/ /public_html/ios.repet.ecanasso.org/;
  bye;
"
```

**Option 2 : Via client FTP graphique (FileZilla, Cyberduck)**

1. Connectez-vous en FTP
2. Naviguez vers `/public_html/app.repet.ecanasso.org/`
3. Uploadez le contenu de `dist-offline/`
4. Répétez pour `dist-online/` vers `/public_html/ios.repet.ecanasso.org/`

**Options lftp expliquées :**
- `--reverse` : Upload (local → serveur)
- `--delete` : Supprime les fichiers obsolètes sur le serveur
- `--verbose` : Affiche les détails du transfert
- `--parallel=10` : Upload en parallèle (plus rapide)

## ✅ Vérification post-déploiement

### 1. Vérifier que les sites sont accessibles

- **Build OFFLINE** : https://app.repet.ecanasso.org
- **Build ONLINE** : https://ios.repet.ecanasso.org

### 2. Vérifier les headers HTTP

```bash
# Vérifier COOP/COEP (requis pour WASM threadé)
curl -I https://app.repet.ecanasso.org | grep -i "cross-origin"

# Doit afficher :
# cross-origin-embedder-policy: credentialless
# cross-origin-opener-policy: same-origin
```

### 3. Vérifier les types MIME

```bash
# Vérifier le type MIME des fichiers WASM
curl -I https://app.repet.ecanasso.org/wasm/ort-wasm-simd.wasm | grep -i "content-type"

# Doit afficher :
# content-type: application/wasm
```

### 4. Tester dans le navigateur

1. Ouvrir https://app.repet.ecanasso.org
2. Ouvrir les DevTools (F12)
3. Onglet **Console** : Vérifier qu'il n'y a pas d'erreurs
4. Onglet **Network** : Vérifier que les fichiers .wasm se chargent
5. Onglet **Application** → Service Workers : Vérifier que le SW est actif

### 5. Tester la PWA

**Sur Desktop :**
- Chrome : Icône "Installer l'application" dans la barre d'adresse

**Sur iOS (build online) :**
1. Safari → Ouvrir https://ios.repet.ecanasso.org
2. Bouton Partager → Ajouter à l'écran d'accueil
3. Lancer l'app depuis l'écran d'accueil
4. Vérifier que l'app fonctionne hors ligne (mode avion)

## 🐛 Dépannage

### Erreur : "Login incorrect" ou "530 Login authentication failed"

**Cause :** Identifiants FTP incorrects.

**Solution :**
1. Vérifier le format du nom d'utilisateur : `user@domain.com`
2. Vérifier le mot de passe (tester avec un client FTP)
3. Créer un compte FTP dédié si nécessaire via cPanel

### Erreur : "Cross-Origin-Embedder-Policy"

**Cause :** Les headers COOP/COEP ne sont pas configurés.

**Solution :**
1. Vérifier que le `.htaccess` est bien présent dans le dossier
2. Vérifier que `mod_headers` est activé sur Apache (c'est le cas chez O2switch)
3. Contacter le support O2switch si nécessaire

### Erreur : "Failed to load WASM"

**Cause :** Type MIME incorrect pour les fichiers .wasm

**Solution :**
1. Vérifier la section MIME types du `.htaccess`
2. Forcer le rechargement (Ctrl+Shift+R)
3. Vider le cache du Service Worker

### Le site affiche une erreur 404 sur les routes

**Cause :** La réécriture SPA n'est pas active.

**Solution :**
1. Vérifier que le `.htaccess` contient les règles RewriteRule
2. Vérifier que `mod_rewrite` est activé (le cas chez O2switch)
3. Vérifier les permissions du `.htaccess` (644)

### Le déploiement GitHub Actions échoue

**Vérifier :**
1. Les secrets GitHub sont bien configurés (format FTP)
2. Le nom d'utilisateur FTP est au format `user@domain.com`
3. Le mot de passe FTP est correct
4. Les chemins sont relatifs au home FTP (sans `/home/user`)

**Consulter les logs :**
- GitHub → Actions → Cliquer sur le workflow échoué
- Lire les logs de l'étape qui a échoué

### Erreur : "lftp: command not found"

**Cause :** lftp n'est pas installé sur le runner (rare).

**Solution :** Le workflow installe automatiquement lftp, mais si l'erreur persiste :
1. Vérifier les logs de l'étape "Sync files via lftp"
2. L'installation devrait se faire automatiquement avec `apt-get install`

## 📊 Monitoring

### Espace disque utilisé

**Via cPanel → Fichiers → Gestionnaire de fichiers :**
1. Naviguer vers le dossier du sous-domaine
2. La taille est affichée en bas de l'interface

**Ou via FTP :**
```bash
lftp -u votreuser@ecanasso.org ftp.ecanasso.org
du -sh public_html/app.repet.ecanasso.org
du -sh public_html/ios.repet.ecanasso.org
quit
```

**Résultat attendu :**
- ~675M pour app.repet (offline)
- ~10M pour ios.repet (online)

### Bande passante

Via cPanel → Métriques → Bande passante

O2switch offre de la bande passante illimitée, mais surveiller la consommation est recommandé.

### Logs Apache

Via cPanel → Métriques → Erreurs ou Visitors

## 🔄 Rollback (retour arrière)

Si un déploiement pose problème, vous pouvez revenir à la version précédente :

### Option 1 : Redéployer un commit précédent

```bash
# Localement
git checkout COMMIT_SHA
npm run build
# Puis déployer manuellement avec rsync
```

### Option 2 : Via GitHub Actions

1. GitHub → Actions
2. Sélectionner un workflow réussi précédent
3. Cliquer sur "Re-run all jobs"

### Option 3 : Restaurer depuis une sauvegarde

Si vous avez activé les sauvegardes O2switch :
1. cPanel → Fichiers → Gestionnaire de sauvegardes
2. Restaurer le dossier concerné

## 📚 Ressources

- [Documentation O2switch](https://faq.o2switch.fr/)
- [Guide SSH O2switch](https://faq.o2switch.fr/hebergement-mutualise/acces-ssh)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [rsync Manual](https://linux.die.net/man/1/rsync)

## 🆘 Support

- **O2switch Support :** https://www.o2switch.fr/support/
- **GitHub Issues :** https://github.com/VOTRE_USERNAME/repet/issues
- **Email :** votre-email@example.com

---

**Dernière mise à jour :** 2025-01-XX
**Version :** 1.0.0