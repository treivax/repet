# Deployment Documentation

Ce dossier contient toute la documentation et les fichiers de configuration nécessaires pour déployer Répét sur O2switch.

## 📁 Contenu du dossier

### Documentation

- **[O2SWITCH_DEPLOYMENT.md](O2SWITCH_DEPLOYMENT.md)** - Guide complet de déploiement
  - Configuration détaillée de l'hébergement O2switch
  - Setup des clés SSH et secrets GitHub
  - Procédures de déploiement et dépannage
  - Monitoring et maintenance

- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Checklist rapide
  - Liste de vérification étape par étape
  - À utiliser lors de la première configuration
  - Utile pour vérifier que rien n'a été oublié

### Fichiers de configuration

- **[.htaccess.offline](.htaccess.offline)** - Template Apache pour build offline
  - Headers de sécurité (COOP/COEP)
  - Configuration WASM et PWA
  - Cache et compression
  - Routing SPA

- **[.htaccess.online](.htaccess.online)** - Template Apache pour build online
  - Identique au offline mais optimisé pour la version légère
  - Pas de configuration spécifique pour les fichiers .onnx

## 🚀 Démarrage rapide

### Pour une première installation

1. Lire **[O2SWITCH_DEPLOYMENT.md](O2SWITCH_DEPLOYMENT.md)** en entier
2. Suivre **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** étape par étape
3. Tester le déploiement manuel avant d'activer GitHub Actions

### Pour une mise à jour

Le déploiement est automatique via GitHub Actions :
- Push sur `main` → Déploiement automatique des deux builds
- Workflow : `.github/workflows/deploy-o2switch.yml`

## 📊 Architecture de déploiement

```
GitHub Repository (main branch)
       ↓
   [GitHub Actions]
       ↓
   ┌───────────────┬───────────────┐
   ↓               ↓               ↓
Build Offline  Build Online   Tests
(dist-offline) (dist-online)  (lint/types)
   ↓               ↓
   └───────┬───────┘
           ↓
      [rsync via SSH]
           ↓
   ┌───────────────────────┐
   │   O2switch Server     │
   ├───────────────────────┤
   │ app.repet.ecanasso.org│ ← Build Offline (~675 MB)
   │ ios.repet.ecanasso.org│ ← Build Online (~10 MB)
   └───────────────────────┘
```

## 🔑 Secrets GitHub requis

| Secret | Description | Exemple |
|--------|-------------|---------|
| `O2SWITCH_FTP_HOST` | Hôte FTP | `ftp.ecanasso.org` |
| `O2SWITCH_FTP_USERNAME` | Utilisateur FTP | `user@ecanasso.org` |
| `O2SWITCH_FTP_PASSWORD` | Mot de passe FTP | `votre_mot_de_passe` |
| `O2SWITCH_PATH_OFFLINE` | Chemin build offline | `/public_html/app.repet.ecanasso.org` |
| `O2SWITCH_PATH_ONLINE` | Chemin build online | `/public_html/ios.repet.ecanasso.org` |

## 🛠️ Workflow GitHub Actions

Le fichier `.github/workflows/deploy-o2switch.yml` gère :

1. **Build** : Compilation des deux versions (offline + online)
2. **Tests** : Type-check et lint
3. **Deploy** : Upload via FTP (lftp) vers O2switch
4. **Validation** : Vérification de la taille des builds

### Pourquoi FTP au lieu de SSH ?

O2switch nécessite d'autoriser spécifiquement les adresses IP pour l'accès SSH. Comme GitHub Actions utilise des runners avec IPs dynamiques, **le déploiement utilise FTP** qui est plus adapté à ce cas d'usage.

### Déclencher manuellement

Depuis GitHub :
1. Actions → "Deploy to O2switch"
2. "Run workflow" → Sélectionner `main`
3. Surveiller l'exécution

## ✅ Checklist de vérification

Après chaque déploiement, vérifier :

- [ ] https://app.repet.ecanasso.org est accessible
- [ ] https://ios.repet.ecanasso.org est accessible
- [ ] Les certificats SSL sont valides
- [ ] Les headers COOP/COEP sont présents
- [ ] Le Service Worker s'enregistre correctement
- [ ] La synthèse vocale fonctionne
- [ ] Le mode offline fonctionne (version offline)

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifier les secrets GitHub (Settings → Secrets)
2. Vérifier le format du nom d'utilisateur FTP (`user@domain.com`)
3. Tester les identifiants FTP avec un client FTP
4. Vérifier les logs GitHub Actions
5. Consulter [O2SWITCH_DEPLOYMENT.md](O2SWITCH_DEPLOYMENT.md#dépannage)

### Erreur "Login incorrect" 

1. Vérifier le format du nom d'utilisateur : `user@domain.com` (avec @)
2. Tester le mot de passe avec FileZilla ou un autre client FTP
3. Créer un compte FTP dédié via cPanel si nécessaire

### Les headers ne fonctionnent pas

1. Vérifier que le `.htaccess` est présent sur le serveur
2. Tester avec : `curl -I https://app.repet.ecanasso.org`
3. Vérifier que `mod_headers` est activé chez O2switch

### Les fichiers WASM ne se chargent pas

1. Vérifier les types MIME dans `.htaccess`
2. Tester : `curl -I https://app.repet.ecanasso.org/wasm/file.wasm`
3. Vider le cache du navigateur

## 📚 Ressources

- [Documentation O2switch](https://faq.o2switch.fr/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Apache .htaccess Guide](https://httpd.apache.org/docs/2.4/howto/htaccess.html)
- [PWA Best Practices](https://web.dev/pwa/)

## 🆘 Support

Pour toute question ou problème :
1. Consulter la documentation complète
2. Vérifier les issues GitHub existantes
3. Créer une nouvelle issue si nécessaire

---

**Dernière mise à jour :** 2025-01-XX  
**Mainteneur :** Équipe Répét