# État des workflows GitHub Actions

## ✅ Actions effectuées

### 1. Suppression du workflow GitHub Pages
- **Fichier supprimé** : `.github/workflows/deploy-gh-pages.yml`
- **Raison** : Ce workflow n'est plus nécessaire car nous déployons sur O2switch
- **Impact** : Réduit la confusion et les builds inutiles

### 2. Optimisation du workflow O2switch
- **Fichier modifié** : `.github/workflows/deploy-o2switch.yml`
- **Changements** :
  - Suppression des étapes `type-check` et `lint` explicites
  - Ces vérifications sont déjà exécutées automatiquement par les hooks `prebuild:offline` et `prebuild:online` dans `package.json`
  - Résultat : **Réduction du temps de build** et élimination de la redondance

### 3. Documentation complète
- **Nouveau fichier** : `docs/WORKFLOW_TROUBLESHOOTING.md`
- **Contenu** :
  - Guide de diagnostic rapide
  - Solutions aux problèmes courants
  - Instructions pour configurer les secrets GitHub
  - Procédures de rollback
  - Debug FTP en cas de problème

---

## 🔍 Pourquoi le workflow ne démarre pas

### Diagnostic

Le workflow **démarre bien** mais **échoue immédiatement** à l'étape de déploiement FTP.

### Cause racine : Secrets GitHub manquants

Le workflow vérifie explicitement la présence de 5 secrets nécessaires pour le transfert FTP :

```bash
if [ -z "${{ secrets.O2SWITCH_FTP_HOST }}" ]; then
  echo "❌ Erreur: O2SWITCH_FTP_HOST n'est pas défini"
  exit 1
fi
```

Si **un seul secret manque**, le workflow s'arrête avec une erreur.

---

## 🔧 Solution : Configurer les secrets GitHub

### Étapes à suivre

1. **Allez dans les paramètres du dépôt GitHub** :
   ```
   https://github.com/treivax/repet/settings/secrets/actions
   ```

2. **Cliquez sur "New repository secret"** et ajoutez les 5 secrets suivants :

   | Nom du secret | Description | Exemple de valeur |
   |---------------|-------------|-------------------|
   | `O2SWITCH_FTP_HOST` | Adresse du serveur FTP O2switch | `ftp.ecanasso.org` |
   | `O2SWITCH_FTP_USERNAME` | Nom d'utilisateur FTP | `votre_username_ftp` |
   | `O2SWITCH_FTP_PASSWORD` | Mot de passe FTP | `votre_mot_de_passe` |
   | `O2SWITCH_PATH_OFFLINE` | Chemin vers le dossier de l'app offline | `/public_html/app.repet.ecanasso.org` |
   | `O2SWITCH_PATH_ONLINE` | Chemin vers le dossier de l'app online | `/public_html/ios.repet.ecanasso.org` |

3. **Vérifiez que les 5 secrets sont bien enregistrés**

4. **Relancez le workflow** :
   - Soit en faisant un nouveau `git push`
   - Soit manuellement via `Actions` → `Deploy to O2switch` → `Run workflow`

---

## 📊 Structure du workflow

### Jobs parallèles

Le workflow exécute **2 jobs en parallèle** :

#### Job 1 : `deploy-offline` (app.repet.ecanasso.org)
- Build avec `npm run build:offline`
- Taille finale : **~248 MB**
- Inclut tous les modèles ONNX
- Cible : Desktop et Android
- Fonctionne 100% offline

#### Job 2 : `deploy-online` (ios.repet.ecanasso.org)
- Build avec `npm run build:online`
- Taille finale : **~54 MB**
- Modèles téléchargés à la demande (OPFS)
- Cible : iOS PWA
- Nécessite connexion initiale

### Temps d'exécution estimé

- **Build offline** : 5-8 minutes
- **Build online** : 3-5 minutes
- **Transfert FTP** : 2-5 minutes (selon la taille)
- **Total** : **10-15 minutes**

---

## 🚀 Déclencheurs du workflow

Le workflow se déclenche automatiquement dans les cas suivants :

1. **Push sur `main`** :
   ```bash
   git push origin main
   ```

2. **Déclenchement manuel** :
   - Allez sur GitHub Actions
   - Sélectionnez "Deploy to O2switch"
   - Cliquez sur "Run workflow"

---

## ✅ Checklist avant déploiement

Avant chaque push qui déclenche le workflow, vérifiez :

- [ ] Le code compile localement (`npm run build`)
- [ ] Les tests passent (`npm run type-check`, `npm run lint`)
- [ ] La version a été bumpée dans `src/config/version.ts` (si nécessaire)
- [ ] Les secrets GitHub sont configurés (5 secrets)
- [ ] Vous avez testé localement les deux builds :
  - [ ] `npm run build:offline` → `dist-offline/`
  - [ ] `npm run build:online` → `dist-online/`

---

## 🔄 Cycle de déploiement automatique

```
┌─────────────────────────────────────────────────────────────┐
│  1. Développeur push sur main                               │
│     git push origin main                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. GitHub Actions détecte le push                          │
│     Déclenche "Deploy to O2switch"                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Build parallèle                                         │
│     ├─ Job 1: Build offline (dist-offline/)                 │
│     └─ Job 2: Build online (dist-online/)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Vérification des secrets                                │
│     Si manquants → ❌ ÉCHEC                                 │
│     Si présents → ✅ CONTINUE                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Transfert FTP via lftp                                  │
│     ├─ Offline → app.repet.ecanasso.org                     │
│     └─ Online → ios.repet.ecanasso.org                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Déploiement réussi ✅                                   │
│     Les sites sont mis à jour automatiquement               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Prochaines étapes

### Étape immédiate : Configurer les secrets

1. Obtenez les informations FTP depuis O2switch :
   - Host FTP
   - Username
   - Password
   - Chemins des dossiers (créez-les si nécessaire)

2. Ajoutez les secrets dans GitHub (lien ci-dessus)

3. Testez le déploiement :
   - Faites un petit changement (ex: bump version patch)
   - Push sur `main`
   - Vérifiez que le workflow passe au vert ✅

### Étapes suivantes

1. **Test post-déploiement** :
   - Suivez la checklist dans `TESTS_CHECKLIST.md`
   - Vérifiez les deux sites (offline et online)
   - Testez sur Desktop, Android, iOS

2. **Vérification PWA auto-update** :
   - Installez la PWA (version actuelle)
   - Bumpez `APP_VERSION` dans `src/config/version.ts`
   - Push et vérifiez que l'update est détectée

3. **Monitoring** :
   - Vérifiez régulièrement l'onglet Actions
   - Consultez les logs en cas d'échec
   - Utilisez `docs/WORKFLOW_TROUBLESHOOTING.md` pour diagnostiquer

---

## 📚 Documentation de référence

- **Plan de déploiement** : `DEPLOY_O2SWITCH_PLAN.md`
- **Guide de dépannage** : `docs/WORKFLOW_TROUBLESHOOTING.md`
- **Checklist de tests** : `TESTS_CHECKLIST.md`
- **Optimisations build** : `docs/BUILD_OPTIMIZATION_SUMMARY.md`
- **Statut déploiement** : `DEPLOYMENT_STATUS.md`

---

## 🆘 Support

En cas de problème :

1. **Consultez** : `docs/WORKFLOW_TROUBLESHOOTING.md`
2. **Vérifiez** : Les logs GitHub Actions
3. **Testez** : Connexion FTP locale avec les mêmes identifiants
4. **Contactez** : Support O2switch si problème serveur

---

**État actuel** : ⏸️ Workflow configuré mais en attente des secrets GitHub  
**Version** : 1.0.2  
**Dernière mise à jour** : 2025-01-XX