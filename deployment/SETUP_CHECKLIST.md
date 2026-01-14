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

### SSH
- [ ] Vérifier que l'accès SSH est activé dans cPanel
- [ ] Noter l'hôte SSH : `________________`
- [ ] Noter le port SSH : `________________`
- [ ] Noter le nom d'utilisateur : `________________`
- [ ] Tester la connexion SSH : `ssh user@host -p port`

---

## 🔑 Phase 2 : Clés SSH pour GitHub Actions

### Génération de la clé
- [ ] Générer une paire de clés SSH :
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-deploy-repet" -f ~/.ssh/o2switch_deploy_repet
  ```
- [ ] Ne PAS mettre de passphrase (appuyer sur Entrée)

### Installation sur O2switch
- [ ] Copier le contenu de `~/.ssh/o2switch_deploy_repet.pub`
- [ ] Ajouter la clé publique dans cPanel → Sécurité → Clés SSH
- [ ] Cliquer sur "Autoriser" pour activer la clé

### Test
- [ ] Tester la connexion avec la clé :
  ```bash
  ssh -i ~/.ssh/o2switch_deploy_repet user@host -p port
  ```
- [ ] La connexion doit fonctionner SANS demander de mot de passe

---

## 🔐 Phase 3 : Secrets GitHub

Aller sur GitHub → Settings → Secrets and variables → Actions → Repository secrets

### Créer les 6 secrets suivants :

- [ ] **O2SWITCH_HOST**
  - Valeur : `ecanasso.org` (ou votre hôte SSH)

- [ ] **O2SWITCH_PORT**
  - Valeur : `2222` (ou votre port SSH)

- [ ] **O2SWITCH_USERNAME**
  - Valeur : votre nom d'utilisateur cPanel

- [ ] **O2SWITCH_SSH_KEY**
  - Valeur : Contenu COMPLET de `~/.ssh/o2switch_deploy_repet`
  - ⚠️ Inclure `-----BEGIN OPENSSH PRIVATE KEY-----` et `-----END OPENSSH PRIVATE KEY-----`
  - Commande pour copier :
    ```bash
    cat ~/.ssh/o2switch_deploy_repet
    ```

- [ ] **O2SWITCH_PATH_OFFLINE**
  - Valeur : `/home/VOTRE_USERNAME/public_html/app.repet.ecanasso.org`
  - Pour vérifier le chemin exact :
    ```bash
    ssh user@host -p port
    pwd
    # Résultat : /home/votreuser
    ```

- [ ] **O2SWITCH_PATH_ONLINE**
  - Valeur : `/home/VOTRE_USERNAME/public_html/ios.repet.ecanasso.org`

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
  rsync -avz --progress --delete \
    -e "ssh -i ~/.ssh/o2switch_deploy_repet -p VOTRE_PORT" \
    dist-offline/ \
    VOTRE_USER@VOTRE_HOST:/chemin/vers/app.repet.ecanasso.org/
  ```
- [ ] Vérifier que https://app.repet.ecanasso.org fonctionne

- [ ] Déployer manuellement la version online :
  ```bash
  rsync -avz --progress --delete \
    -e "ssh -i ~/.ssh/o2switch_deploy_repet -p VOTRE_PORT" \
    dist-online/ \
    VOTRE_USER@VOTRE_HOST:/chemin/vers/ios.repet.ecanasso.org/
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
Hôte SSH : ____________________
Port SSH : ____________________
Nom d'utilisateur : ____________________

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
2. Vérifier que la clé SSH est complète (BEGIN et END)
3. Consulter les logs détaillés dans GitHub Actions

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