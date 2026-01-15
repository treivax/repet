# Guide de dépannage du workflow O2switch

## Pourquoi le workflow ne démarre pas ?

Si le workflow `Deploy to O2switch` ne s'exécute pas ou échoue immédiatement, voici les raisons les plus courantes et leurs solutions.

---

## 🔍 Diagnostic rapide

### 1. Vérifier si le workflow a démarré

1. Allez sur GitHub : `https://github.com/treivax/repet/actions`
2. Cherchez le workflow "Deploy to O2switch"
3. Vérifiez l'état :
   - ✅ **Vert** : Le workflow s'est exécuté avec succès
   - ❌ **Rouge** : Le workflow a échoué (cliquez pour voir les logs)
   - ⏸️ **Gris** : Le workflow est en cours ou en attente
   - 🚫 **Absent** : Le workflow n'a pas été déclenché

---

## 🔧 Problèmes courants et solutions

### Problème 1 : Le workflow ne se déclenche pas du tout

**Symptôme** : Aucune exécution visible dans l'onglet Actions après un push.

**Causes possibles** :
- Le workflow a été désactivé dans GitHub
- Le push n'était pas sur la branche `main`
- Le fichier `.github/workflows/deploy-o2switch.yml` n'existe pas

**Solution** :
1. Vérifiez que le workflow existe : `.github/workflows/deploy-o2switch.yml`
2. Vérifiez que vous avez poussé sur `main` : `git branch --show-current`
3. Activez le workflow dans GitHub :
   - Allez dans `Actions` → `Deploy to O2switch` → `Enable workflow`

---

### Problème 2 : Le workflow échoue immédiatement (secrets manquants)

**Symptôme** : Le workflow démarre mais échoue à l'étape "Sync files via lftp" avec un message d'erreur comme :
```
❌ Erreur: O2SWITCH_FTP_HOST n'est pas défini
```

**Cause** : Les secrets GitHub ne sont pas configurés.

**Solution** : Configurer les secrets dans GitHub

#### Étapes détaillées :

1. **Allez dans les paramètres du dépôt** :
   ```
   https://github.com/treivax/repet/settings/secrets/actions
   ```

2. **Cliquez sur "New repository secret"** et ajoutez les secrets suivants :

   | Nom du secret | Description | Exemple |
   |---------------|-------------|---------|
   | `O2SWITCH_FTP_HOST` | Adresse du serveur FTP | `ftp.ecanasso.org` |
   | `O2SWITCH_FTP_USERNAME` | Nom d'utilisateur FTP | `votre_username` |
   | `O2SWITCH_FTP_PASSWORD` | Mot de passe FTP | `votre_password` |
   | `O2SWITCH_PATH_OFFLINE` | Chemin vers le dossier offline | `/public_html/app.repet.ecanasso.org` |
   | `O2SWITCH_PATH_ONLINE` | Chemin vers le dossier online | `/public_html/ios.repet.ecanasso.org` |

3. **Vérifiez que tous les 5 secrets sont bien enregistrés**

4. **Relancez le workflow** :
   - Allez dans `Actions`
   - Sélectionnez l'exécution échouée
   - Cliquez sur "Re-run all jobs"

---

### Problème 3 : Le workflow échoue lors du build

**Symptôme** : Erreur lors de `npm run build:offline` ou `npm run build:online`

**Causes possibles** :
- Erreurs TypeScript
- Erreurs ESLint
- Dépendances manquantes

**Solution** :

1. **Testez le build localement** :
   ```bash
   npm ci
   npm run build:offline
   npm run build:online
   ```

2. **Si des erreurs apparaissent**, corrigez-les avant de pousser

3. **Vérifiez que `type-check` et `lint` passent** :
   ```bash
   npm run type-check
   npm run lint
   ```

---

### Problème 4 : Le workflow échoue lors du transfert FTP

**Symptôme** : Le build réussit mais le transfert FTP échoue avec des erreurs de connexion.

**Causes possibles** :
- Mauvais identifiants FTP
- Serveur FTP inaccessible
- Chemins de destination incorrects
- Firewall bloquant la connexion

**Solutions** :

1. **Vérifiez les identifiants FTP** :
   - Testez la connexion avec un client FTP (FileZilla, etc.)
   - Vérifiez que le username/password sont corrects

2. **Vérifiez les chemins** :
   - Connectez-vous en FTP et naviguez vers les dossiers
   - Assurez-vous que les chemins dans les secrets sont exacts
   - Format attendu : `/public_html/app.repet.ecanasso.org` (pas de `/` à la fin)

3. **Vérifiez l'accès au serveur** :
   ```bash
   # Testez depuis votre machine locale
   ping ftp.ecanasso.org
   telnet ftp.ecanasso.org 21
   ```

4. **Contactez O2switch** si le problème persiste (support technique)

---

## 🔄 Déclencher manuellement le workflow

Vous pouvez déclencher le workflow sans faire de push :

1. Allez sur `https://github.com/treivax/repet/actions`
2. Cliquez sur "Deploy to O2switch"
3. Cliquez sur "Run workflow"
4. Sélectionnez la branche `main`
5. Cliquez sur "Run workflow" (bouton vert)

---

## 📊 Comprendre les logs du workflow

### Structure du workflow

Le workflow a **2 jobs parallèles** :
- `deploy-offline` : Build et déploiement offline (app.repet.ecanasso.org)
- `deploy-online` : Build et déploiement online (ios.repet.ecanasso.org)

### Étapes de chaque job :

1. ✅ **Checkout code** : Clone le dépôt
2. 📦 **Setup Node.js** : Installe Node.js 18
3. 📥 **Install dependencies** : `npm ci`
4. 🏗️ **Build** : `npm run build:offline` ou `build:online`
   - Cette étape inclut automatiquement `type-check` et `lint` via les hooks `prebuild:*`
5. 📊 **Check build size** : Affiche la taille du build
6. 📝 **Copy .htaccess** : Crée le fichier de configuration Apache
7. 📦 **Sync files via lftp** : Transfert FTP vers O2switch
8. ✅ **Deployment complete** : Résumé du déploiement

### Temps d'exécution attendu :
- **Build offline** : ~5-8 minutes (modèles inclus)
- **Build online** : ~3-5 minutes (modèles exclus)
- **Total** : ~10-15 minutes

---

## 🚀 Checklist de déploiement réussi

Avant chaque déploiement, vérifiez :

- [ ] Le code compile localement (`npm run build`)
- [ ] Les tests passent (`npm run type-check`, `npm run lint`)
- [ ] La version a été bumpée dans `src/config/version.ts`
- [ ] Les secrets GitHub sont configurés (5 secrets)
- [ ] Vous avez accès FTP au serveur O2switch
- [ ] Les chemins de destination existent sur le serveur

---

## 🆘 Aide supplémentaire

### Logs détaillés

Pour obtenir plus de détails lors d'un échec :

1. Cliquez sur l'exécution échouée dans Actions
2. Cliquez sur le job qui a échoué (`deploy-offline` ou `deploy-online`)
3. Développez l'étape qui a échoué (icône rouge ❌)
4. Lisez les logs complets

### Debug local du transfert FTP

Vous pouvez tester le transfert FTP localement :

```bash
# Installer lftp
sudo apt-get install lftp  # Linux
brew install lftp          # macOS

# Créer un script de test
cat > /tmp/test-ftp.txt << 'EOF'
set ftp:ssl-allow no
set ftp:passive-mode on
open -u USERNAME,PASSWORD ftp.ecanasso.org
cd /public_html/app.repet.ecanasso.org
ls
bye
EOF

# Exécuter le script
lftp -f /tmp/test-ftp.txt
```

### Rollback en cas de problème

Si le déploiement échoue après le transfert FTP :

1. **Via Git** :
   ```bash
   git revert HEAD
   git push origin main
   ```
   → Cela relancera le workflow avec la version précédente

2. **Via FTP manuel** :
   - Connectez-vous en FTP
   - Supprimez les fichiers problématiques
   - Téléversez manuellement la version stable depuis `dist-offline/` ou `dist-online/`

---

## 📝 Notes importantes

### Différences entre les deux builds :

| Caractéristique | Offline Build | Online Build |
|----------------|---------------|--------------|
| **URL** | app.repet.ecanasso.org | ios.repet.ecanasso.org |
| **Taille** | ~248 MB | ~54 MB |
| **Modèles** | Inclus dans le build | Téléchargés à la demande |
| **Cible** | Desktop/Android | iOS (PWA optimisé) |
| **Offline** | 100% offline | Nécessite connexion initiale |

### Fréquence de déploiement recommandée :

- **Développement actif** : À chaque feature importante
- **Corrections de bugs** : Immédiatement après le fix
- **Mises à jour PWA** : Bumper `APP_VERSION` à chaque déploiement
- **Mises à jour de modèles** : Bumper `MODEL_VERSION` si les voix changent

---

## 🔗 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation lftp](https://lftp.yar.ru/lftp-man.html)
- [Guide O2switch FTP](https://faq.o2switch.fr/)
- [Plan de déploiement complet](../DEPLOY_O2SWITCH_PLAN.md)
- [Checklist de tests](../TESTS_CHECKLIST.md)

---

**Dernière mise à jour** : 2025-01-XX