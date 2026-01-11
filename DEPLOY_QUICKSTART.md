# Déploiement rapide de Répét

Guide express pour déployer Répét en production en 5 minutes.

## 🚀 Option 1 : Netlify (Recommandé - Le plus simple)

### Étapes

1. **Créez un compte sur [Netlify](https://www.netlify.com)** (gratuit)

2. **Connectez votre repository GitHub**
   - Cliquez sur "Add new site" → "Import an existing project"
   - Sélectionnez GitHub et autorisez l'accès
   - Choisissez le repository `repet`

3. **Configuration du build** (détection automatique normalement)
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **Déployez !**
   - Cliquez sur "Deploy site"
   - Attendez 1-2 minutes
   - Votre site est en ligne ! 🎉

5. **URL de votre application**
   - `https://random-name-123.netlify.app`
   - Vous pouvez personnaliser le nom dans Site settings → Domain management

### Déploiements automatiques

✅ Chaque push sur `main` déclenchera un nouveau déploiement automatiquement.

---

## 🔷 Option 2 : Vercel

### Via l'interface web

1. **Allez sur [Vercel](https://vercel.com)** (connexion avec GitHub)

2. **Importez le projet**
   - "Add New Project"
   - Sélectionnez le repository `repet`

3. **Configuration** (détection automatique)
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Deploy !**
   - Votre site sera en ligne en 1-2 minutes
   - URL : `https://repet-xxx.vercel.app`

### Via la ligne de commande

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer en production
vercel --prod
```

---

## 📄 Option 3 : GitHub Pages (Gratuit pour projets publics)

### Configuration

1. **Activez GitHub Pages**
   - Allez dans Settings → Pages de votre repository
   - Source : "GitHub Actions"

2. **Le workflow est déjà configuré**
   - Le fichier `.github/workflows/deploy-gh-pages.yml` est présent
   - Chaque push sur `main` déploiera automatiquement

3. **URL de votre application**
   - `https://votre-username.github.io/repet/`

### Note importante

Si vous utilisez GitHub Pages, décommentez dans `vite.config.ts` :

```typescript
export default defineConfig({
  base: '/repet/', // Nom de votre repository
  // ...
})
```

Puis committez et poussez le changement.

---

## 🖥️ Option 4 : Serveur personnel (VPS, Raspberry Pi, etc.)

### Avec Docker

```bash
# Cloner et builder
git clone https://github.com/votre-username/repet.git
cd repet

# Créer le Dockerfile (voir DEPLOYMENT.md)
docker build -t repet .

# Lancer
docker run -d -p 80:80 --name repet-app repet
```

### Sans Docker (avec Node)

```bash
# Sur le serveur
git clone https://github.com/votre-username/repet.git
cd repet

# Installer les dépendances
npm ci --production

# Builder
npm run build

# Servir avec serve
npx serve -s dist -p 80

# Ou avec PM2 pour production
npm install -g pm2
pm2 serve dist 80 --spa --name repet
pm2 save
pm2 startup
```

---

## ✅ Vérification après déploiement

Après avoir déployé, vérifiez que :

1. ✅ **Le site se charge** - Ouvrez l'URL dans votre navigateur
2. ✅ **HTTPS est actif** - Cadenas dans la barre d'adresse
3. ✅ **PWA installable** - Icône ⊕ visible dans Chrome
4. ✅ **Service Worker actif** - DevTools → Application → Service Workers
5. ✅ **Pas d'erreurs** - Console JavaScript propre

### Test d'installation PWA

**Sur Desktop (Chrome)** :
- Cherchez l'icône ⊕ dans la barre d'adresse
- Ou Menu (⋮) → "Installer Répét..."

**Sur Android (Chrome)** :
- Menu (⋮) → "Installer l'application"

**Sur iOS (Safari)** :
- Bouton Partager (□↑) → "Sur l'écran d'accueil"

---

## 🔄 Mises à jour

### Netlify / Vercel

```bash
# C'est automatique !
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → Déploiement automatique en 1-2 minutes
```

### GitHub Pages

```bash
git push origin main
# → Le workflow GitHub Actions se lance automatiquement
```

### Serveur personnel

```bash
# Sur le serveur
cd repet
git pull origin main
npm ci
npm run build
pm2 restart repet
```

---

## 📊 Monitoring (Optionnel)

### Netlify Analytics
- Activez dans le dashboard Netlify (gratuit pour usage basique)

### Vercel Analytics
- Activez dans le dashboard Vercel

### Google Analytics
- Ajoutez votre ID Analytics dans le code (voir DEPLOYMENT.md)

---

## 🆘 Problèmes courants

### Le site ne se charge pas
- Vérifiez les logs de build dans le dashboard
- Assurez-vous que `npm run build` fonctionne localement

### Service Worker ne fonctionne pas
- Le site doit être en HTTPS (automatique sur Netlify/Vercel/GitHub Pages)
- Videz le cache : DevTools → Application → Clear storage

### L'installation PWA ne s'affiche pas
- Attendez quelques secondes après le chargement
- Rechargez la page (Ctrl+Shift+R)
- Vérifiez HTTPS
- Vérifiez le Manifest dans DevTools

---

## 📚 Documentation complète

Pour plus de détails :
- **DEPLOYMENT.md** - Guide complet avec toutes les options
- **TEST_PWA_INSTALLATION.md** - Guide de test PWA local
- **README.md** - Documentation générale du projet

---

## 🎉 C'est tout !

Votre application Répét est maintenant en ligne et accessible au monde entier !

**URL de déploiement** : _________________

**Prochaines étapes** :
1. Testez l'installation PWA
2. Partagez l'URL avec votre troupe de théâtre
3. Récoltez les feedbacks
4. Améliorez et déployez de nouvelles fonctionnalités

Bon spectacle ! 🎭