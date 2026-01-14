# Setup Checklist - Déploiement O2switch

Liste de vérification rapide pour configurer le déploiement automatique de Répét sur O2switch.

## 📋 Phase 1 : Configuration O2switch (cPanel)

### Sous-domaines
- [ ] Créer le sous-domaine `app.repet.ecanasso.org`
  - Racine : `/home/VOTRE_USERNAME/public_html/app.repet.ecanasso.org`
- [ ] Créer le sous-domaine `ios.repet.ecanasso.org`
  - Racine : `/home/VOTRE_USERNAME/public_html/ios.repet.ecanasso.org`

### SSL
- [ ] Activer AutoSSL pour `app.repet.ecanasso.org`
- [ ] Activer AutoSSL pour `ios.repet.ecanasso.org`
- [ ] Vérifier que les certificats sont installés (icône verte)

### FTP
- [ ] Vérifier que l'accès FTP est activé dans cPanel
- [ ] Noter l'hôte FTP : `________________` (ex: `ftp.ecanasso.org`)
- [ ] Noter le nom d'utilisateur FTP : `________________` (format: `user@domain.com`)
- [ ] Noter le mot de passe FTP : `________________`
- [ ] Tester la connexion FTP : `lftp -u user@domain.com ftp.host.com`

---

## 🔑 Phase 2 : Informations FTP pour GitHub Actions

### Récupération des identifiants
- [ ] Aller dans cPanel → Fichiers → Comptes FTP
- [ ] Noter ou créer un compte FTP dédié pour le déploiement
- [ ] Noter l'hôte FTP (ex: `ftp.ecanasso.org`)
- [ ] Noter le nom d'utilisateur complet (format: `user@domain.com`)
- [ ] Noter le mot de passe

### Test de connexion
- [ ] Installer lftp si nécessaire : `sudo apt install lftp` (Linux) ou `brew install lftp` (macOS)
- [ ] Tester la connexion FTP :
  ```bash
  lftp -u user@domain.com ftp.host.com
  # Entrer le mot de passe
  # Taper 'ls' pour lister les fichiers
  # Taper 'quit' pour quitter
  ```
- [ ] La connexion doit fonctionner et afficher les fichiers

---

## 🔐 Phase 3 : Secrets GitHub

Aller sur GitHub → Settings → Secrets and variables → Actions → Repository secrets

### Créer les 5 secrets suivants :

- [ ] **O2SWITCH_FTP_HOST**
  - Valeur : `ftp.ecanasso.org` (ou votre hôte FTP)

- [ ] **O2SWITCH_FTP_USERNAME**
  - Valeur : `user@ecanasso.org` (format complet avec @domain)

- [ ] **O2SWITCH_FTP_PASSWORD**
  - Valeur : votre mot de passe FTP
  - ⚠️ Utilisez de préférence un compte FTP dédié pour le déploiement

- [ ] **O2SWITCH_PATH_OFFLINE**
  - Valeur : `/public_html/app.repet.ecanasso.org`
  - ⚠️ Chemin relatif au home FTP (sans `/home/username`)

- [ ] **O2SWITCH_PATH_ONLINE**
  - Valeur : `/public_html/ios.repet.ecanasso.org`
  - ⚠️ Chemin relatif au home FTP (sans `/home/username`)

---

## 🚀 Phase 4 : Test du déploiement

### Test local
- [ ] Builder localement :
  ```bash
  npm run build
  ```
- [ ] Vérifier les tailles :
  ```bash
  du -sh dist-offline/  # ~675 MB attendu
  du -sh dist-online/   # ~10 MB attendu
  ```

### Test manuel de déploiement
- [ ] Déployer manuellement la version offline :
  ```bash
  lftp -c "
    set ftp:ssl-allow no;
    open -u user@domain.com,PASSWORD ftp.host.com;
    mirror --reverse --delete --verbose dist-offline/ /public_html/app.repet.ecanasso.org/;
    bye;
  "
  ```
- [ ] Vérifier que https://app.repet.ecanasso.org fonctionne

- [ ] Déployer manuellement la version online :
  ```bash
  lftp -c "
    set ftp:ssl-allow no;
    open -u user@domain.com,PASSWORD ftp.host.com;
    mirror --reverse --delete --verbose dist-online/ /public_html/ios.repet.ecanasso.org/;
    bye;
  "
  ```
- [ ] Vérifier que https://ios.repet.ecanasso.org fonctionne

### Test du workflow GitHub Actions
- [ ] Faire un commit et push sur `main`
- [ ] Aller sur GitHub → Actions
- [ ] Vérifier que le workflow "Deploy to O2switch" s'exécute
- [ ] Vérifier que les deux jobs (offline et online) réussissent
- [ ] Vérifier que les deux sites sont à jour

---

## ✅ Phase 5 : Vérification post-déploiement

### URLs accessibles
- [ ] https://app.repet.ecanasso.org charge correctement
- [ ] https://ios.repet.ecanasso.org charge correctement
- [ ] Les deux sites ont un certificat SSL valide (cadenas vert)

### Headers HTTP
- [ ] Vérifier les headers COOP/COEP :
  ```bash
  curl -I https://app.repet.ecanasso.org | grep -i "cross-origin"
  ```
  - Doit afficher : `cross-origin-embedder-policy: credentialless`
  - Doit afficher : `cross-origin-opener-policy: same-origin`

### Types MIME
- [ ] Vérifier les types MIME WASM :
  ```bash
  curl -I https://app.repet.ecanasso.org/wasm/ort-wasm-simd.wasm | grep -i "content-type"
  ```
  - Doit afficher : `content-type: application/wasm`

### Tests navigateur (app.repet.ecanasso.org)
- [ ] Ouvrir les DevTools (F12)
- [ ] Console : Aucune erreur rouge
- [ ] Network : Les fichiers .wasm se chargent correctement
- [ ] Network : Les fichiers .onnx se chargent correctement (offline)
- [ ] Application → Service Workers : Le SW est enregistré et actif
- [ ] Application → Manifest : Le manifest est valide
- [ ] Tester la lecture d'un texte avec une voix

### Tests navigateur (ios.repet.ecanasso.org)
- [ ] Ouvrir les DevTools (F12)
- [ ] Console : Aucune erreur rouge
- [ ] Network : Les fichiers .wasm se chargent correctement
- [ ] Application → Service Workers : Le SW est enregistré et actif
- [ ] Tester la lecture d'un texte (les voix doivent se télécharger du CDN)

### Test PWA
- [ ] **Desktop** : Icône "Installer l'application" apparaît dans la barre d'adresse
- [ ] **iOS** (version online) : Safari → Partager → Ajouter à l'écran d'accueil
- [ ] L'application installée se lance correctement

---

## 📝 Informations à documenter

Une fois le setup terminé, noter ces informations :

```
Date du déploiement : ____________________
Hôte FTP : ____________________
Nom d'utilisateur FTP : ____________________

Chemin offline : ____________________
Chemin online : ____________________

URL offline : https://app.repet.ecanasso.org
URL online : https://ios.repet.ecanasso.org

Taille build offline : ______ MB
Taille build online : ______ MB

Temps de build GitHub Actions : ______ minutes
Temps de déploiement rsync : ______ minutes
```

---

## 🆘 En cas de problème

### Le workflow GitHub Actions échoue
1. Vérifier que tous les secrets sont correctement configurés
2. Vérifier le format du nom d'utilisateur FTP (`user@domain.com`)
3. Tester les identifiants FTP manuellement avec lftp
4. Consulter les logs détaillés dans GitHub Actions

### Erreur "Login incorrect" lors du déploiement
1. Vérifier le format: `user@domain.com` (avec le @)
2. Tester le mot de passe avec un client FTP
3. Créer un compte FTP dédié si nécessaire

### Les headers COOP/COEP ne fonctionnent pas
1. Vérifier que le `.htaccess` est présent dans le dossier
2. Vérifier les permissions du `.htaccess` (644)
3. Contacter le support O2switch si mod_headers n'est pas activé

### Les fichiers .wasm ne se chargent pas
1. Vérifier les types MIME dans le `.htaccess`
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier dans Network que le Content-Type est correct

### Documentation complète
Voir `deployment/O2SWITCH_DEPLOYMENT.md` pour le guide détaillé.

---

**✅ Setup terminé avec succès !**