# 📊 État du Déploiement - Répét

**Dernière mise à jour** : Janvier 2025  
**Version actuelle** : v0.1.0

---

## 🎯 Statut Global

| Composant | Statut | Notes |
|-----------|--------|-------|
| **Code source** | ✅ Prêt | Nettoyé, 60+ fichiers supprimés |
| **Documentation** | ✅ À jour | Italienne, 4 voix, 3 toggles |
| **Builds** | ✅ Optimisés | 248 MB offline, 54 MB online |
| **Workflow GitHub** | ✅ Configuré | `.github/workflows/deploy-o2switch.yml` |
| **Secrets GitHub** | ⚠️ À configurer | 5 secrets requis |
| **Déploiement** | ⏳ En attente | Attente secrets |
| **Tests** | ⏳ À effectuer | Après déploiement |

---

## ✅ Ce Qui Est Fait

### Code et Documentation
- [x] Nettoyage massif (78 → 25 fichiers documentation)
- [x] Corrections terminologie ("Italienne" au lieu de "Italien")
- [x] Mise à jour nombre de voix (4 voix : Siwis, Tom, Jessica, Pierre)
- [x] Correction paramètres voix off (3 toggles indépendants)
- [x] README.md à jour
- [x] HelpScreen.tsx corrigé
- [x] docs/ organisé et nettoyé

### Build et Configuration
- [x] Build offline optimisé (248 MB)
- [x] Build online optimisé (54 MB)
- [x] Workflow GitHub Actions configuré
- [x] Scripts de déploiement FTP (lftp)
- [x] Génération automatique .htaccess
- [x] Support CORS/WASM headers
- [x] Support SPA routing

### PWA et Auto-Update
- [x] Service Worker configuré (vite-plugin-pwa)
- [x] UpdateManager implémenté
- [x] Check automatique toutes les heures
- [x] Notification utilisateur
- [x] Version tracking (src/config/version.ts)
- [x] registerType: 'autoUpdate'

---

## ⏳ Ce Qui Reste À Faire

### 1. Configuration GitHub (5 min)

**Action** : Créer 5 secrets dans GitHub Settings

Aller sur : `https://github.com/[USER]/repet/settings/secrets/actions`

Créer :
```
O2SWITCH_FTP_HOST         = ftp.ecanasso.org
O2SWITCH_FTP_USERNAME     = [votre_user_cpanel]
O2SWITCH_FTP_PASSWORD     = [votre_mot_de_passe]
O2SWITCH_PATH_OFFLINE     = /public_html/app.repet.ecanasso.org
O2SWITCH_PATH_ONLINE      = /public_html/ios.repet.ecanasso.org
```

**Comment obtenir ces valeurs** :
- Connexion cPanel O2switch
- Section "FTP Accounts" ou "Comptes FTP"
- Créer/utiliser un compte FTP existant
- Noter les credentials

---

### 2. Premier Déploiement (10 min)

**Étapes** :

```bash
# 1. Bumper la version
# Éditer src/config/version.ts
export const APP_VERSION = '0.1.1'  # Au lieu de '0.1.0'

# 2. Commit
git add src/config/version.ts
git commit -m "chore: bump version to 0.1.1 for first deployment"

# 3. Push (déclenche le déploiement automatique)
git push origin main
```

**Suivi** :
- GitHub → Actions → Voir workflow en cours
- Durée : 5-10 minutes
- 2 jobs : deploy-offline + deploy-online

---

### 3. Tests Post-Déploiement (30 min)

**Offline (app.repet.ecanasso.org)** :
- [ ] Ouvrir URL → Page charge
- [ ] Installer PWA
- [ ] Tester mode offline (couper WiFi)
- [ ] Importer pièce
- [ ] Tester 4 voix
- [ ] Tester mode Italienne
- [ ] Tester 3 toggles voix off

**Online (ios.repet.ecanasso.org)** :
- [ ] Ouvrir URL (charge rapide)
- [ ] Installer PWA sur iOS
- [ ] Télécharger voix
- [ ] Vérifier cache OPFS

**Checklist détaillée** : Voir `TESTS_CHECKLIST.md`

---

### 4. Test Auto-Update PWA (2h)

**Scénario** :
1. Installer PWA v0.1.1
2. Bumper version → v0.1.2
3. Push → Déploiement
4. Attendre 1h OU recharger
5. Vérifier notification "Mise à jour disponible"
6. Tester "Mettre à jour"
7. Vérifier logs : `App version updated: 0.1.1 → 0.1.2`

**Guide détaillé** : Voir `DEPLOY_O2SWITCH_PLAN.md` section "Tests Auto-Update PWA"

---

## 📋 Checklist de Validation Finale

Avant de considérer le déploiement comme réussi :

**Infrastructure** :
- [ ] Secrets GitHub configurés (5 secrets)
- [ ] Workflow GitHub Actions passe ✅
- [ ] Build offline uploadé sur O2switch
- [ ] Build online uploadé sur O2switch
- [ ] HTTPS actif sur les 2 domaines
- [ ] .htaccess appliqué (headers CORS/WASM)

**Fonctionnel** :
- [ ] PWA installable (Desktop, Android, iOS)
- [ ] Mode offline fonctionne (build offline)
- [ ] 4 voix fonctionnent (Siwis, Tom, Jessica, Pierre)
- [ ] 3 modes de lecture OK (Silencieux, Audio, Italienne)
- [ ] 3 toggles voix off fonctionnent
- [ ] Stockage local persiste
- [ ] Aucune erreur console

**Auto-Update** :
- [ ] Notification apparaît après déploiement nouvelle version
- [ ] Bouton "Mettre à jour" fonctionne
- [ ] App se recharge avec nouvelle version
- [ ] Version trackée dans localStorage
- [ ] Check automatique toutes les heures fonctionne

**Performance** :
- [ ] Offline : chargement < 10s
- [ ] Online : chargement < 3s
- [ ] Lecture fluide sans lag
- [ ] Pas de freeze UI

---

## 🚨 Points d'Attention

### Secrets GitHub
⚠️ **Les secrets ne seront jamais visibles après création**  
→ Bien noter les valeurs avant de les sauvegarder

### Version Bumping
⚠️ **Toujours bumper `APP_VERSION` avant chaque déploiement**  
→ Sinon l'auto-update ne se déclenchera pas

### Headers CORS/WASM
⚠️ **Les headers COOP/COEP sont critiques pour WASM**  
→ Si WASM ne charge pas, vérifier les headers avec :
```bash
curl -I https://app.repet.ecanasso.org | grep -i "cross-origin"
```

### Cache Service Worker
⚠️ **Le SW se met à jour automatiquement**  
→ Mais nécessite un rechargement de page ou 1h d'attente

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| `DEPLOY_O2SWITCH_PLAN.md` | Plan détaillé de déploiement avec troubleshooting |
| `TESTS_CHECKLIST.md` | Checklist imprimable pour tests manuels |
| `README.md` | Documentation principale du projet |
| `docs/TWO_BUILDS_ARCHITECTURE.md` | Architecture des 2 builds |
| `docs/OFFLINE_MODE.md` | Documentation mode offline |

---

## 🎯 Prochaines Étapes Immédiates

1. **Maintenant** : Configurer les 5 secrets GitHub
2. **Ensuite** : Bumper version + push
3. **Après déploiement** : Exécuter tests (TESTS_CHECKLIST.md)
4. **Enfin** : Tester auto-update PWA

**Temps estimé total** : ~3 heures (config 5 min, déploiement 10 min, tests 2h45)

---

**🚀 Prêt pour le déploiement !**

Une fois les secrets configurés, un simple `git push` déclenchera tout automatiquement.
