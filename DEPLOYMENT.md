# Guide de déploiement en production

Ce guide explique comment déployer Répét en production sur différentes plateformes.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Netlify (Recommandé)](#netlify-recommandé)
- [Vercel](#vercel)
- [GitHub Pages](#github-pages)
- [Serveur personnel](#serveur-personnel)
- [Configuration post-déploiement](#configuration-post-déploiement)
- [Vérification](#vérification)

---

## Prérequis

Avant de déployer, assurez-vous que :

- ✅ Le projet compile sans erreur : `npm run build`
- ✅ Les tests TypeScript passent : `npm run type-check`
- ✅ Le code est propre : `npm run lint`
- ✅ Tous les commits sont pushés sur GitHub

---

## Netlify (Recommandé)

Netlify est la solution la plus simple pour déployer Répét avec support PWA complet.

### Déploiement automatique

1. **Connectez-vous à Netlify**
   - Allez sur [netlify.com](https://www.netlify.com)
   - Connectez-vous avec votre compte GitHub

2. **Importez le projet**
   - Cliquez sur "Add new site" → "Import an existing project"
   - Sélectionnez "GitHub"
   - Choisissez votre repository `repet`

3. **Configuration du build**
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
   - Cliquez sur "Deploy site"

4. **Configurez le domaine (optionnel)**
   - Site settings → Domain management
   - Ajoutez un domaine personnalisé ou utilisez le sous-domaine `.netlify.app`

### Configuration netlify.toml (optionnel)

Créez un fichier `netlify.toml` à la racine :

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Déploiements automatiques** : Chaque push sur `main` déclenchera un nouveau déploiement.

---

## Vercel

Alternative populaire avec excellent support React.

### Déploiement via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour production
vercel --prod
```

### Déploiement via Dashboard

1. Allez sur [vercel.com](https://vercel.com)
2. "Add New Project" → Importez depuis GitHub
3. Sélectionnez `repet`
4. Configuration :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
5. Cliquez sur "Deploy"

### Configuration vercel.json (optionnel)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## GitHub Pages

Gratuit et simple pour les projets open-source.

### Méthode 1 : GitHub Actions (automatique)

1. **Créer le workflow**

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. **Activer GitHub Pages**
   - Settings → Pages
   - Source : Deploy from a branch
   - Branch : `gh-pages` / `root`
   - Save

3. **Configurer la base URL**

Dans `vite.config.ts`, ajoutez :

```typescript
export default defineConfig({
  base: '/repet/', // Nom de votre repo
  // ... reste de la config
})
```

### Méthode 2 : Déploiement manuel

```bash
# Installer gh-pages
npm install -D gh-pages

# Ajouter dans package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Déployer
npm run deploy
```

**URL** : `https://votre-username.github.io/repet/`

---

## Serveur personnel

Pour déployer sur votre propre serveur.

### Avec Docker

Créez `Dockerfile` :

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Créez `nginx.conf` :

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /sw.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build et run** :

```bash
docker build -t repet .
docker run -d -p 80:80 repet
```

### Sans Docker

```bash
# Sur le serveur
git clone https://github.com/votre-username/repet.git
cd repet
npm install
npm run build

# Servir avec nginx/apache ou serveur Node
npx serve -s dist -p 80
```

### Avec PM2 et serve

```bash
npm install -g pm2 serve

# Démarrer
pm2 serve dist 80 --spa --name repet

# Sauvegarder
pm2 save
pm2 startup
```

---

## Configuration post-déploiement

### 1. HTTPS (obligatoire pour PWA)

- **Netlify/Vercel** : HTTPS automatique avec Let's Encrypt ✅
- **GitHub Pages** : HTTPS automatique ✅
- **Serveur personnel** : Configurez Let's Encrypt avec Certbot

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d votre-domaine.com
```

### 2. Domaine personnalisé (optionnel)

**Netlify** :
1. Site settings → Domain management
2. Add custom domain
3. Configurez les DNS (A record ou CNAME)

**Vercel** :
1. Project settings → Domains
2. Add domain
3. Configurez les DNS

### 3. Variables d'environnement

Si nécessaire, créez `.env.production` :

```bash
VITE_APP_NAME=Répét
VITE_APP_VERSION=1.0.0
```

⚠️ **Important** : Ne jamais commiter de secrets dans Git !

---

## Vérification

Après déploiement, vérifiez :

### ✅ Checklist

- [ ] **Site accessible** : L'URL fonctionne
- [ ] **HTTPS actif** : Cadenas dans la barre d'adresse
- [ ] **PWA installable** : Icône ⊕ visible dans Chrome
- [ ] **Service Worker** : DevTools → Application → Service Workers actif
- [ ] **Manifest** : DevTools → Application → Manifest chargé
- [ ] **Fonctionnalités** : Import de pièce, lecture, modes fonctionnent
- [ ] **Responsive** : Test sur mobile et desktop
- [ ] **Hors ligne** : Désactivez le réseau, l'app doit fonctionner
- [ ] **Console** : Aucune erreur JavaScript

### Tests PWA

1. **Lighthouse audit**
   ```bash
   # Dans Chrome DevTools
   # Onglet Lighthouse → Progressive Web App → Analyze
   ```
   Score attendu : 90-100

2. **Test d'installation**
   - Desktop : Chrome → Installer l'app
   - Android : Chrome → Menu → Ajouter à l'écran d'accueil
   - iOS : Safari → Partager → Sur l'écran d'accueil

3. **Test hors ligne**
   ```bash
   # Dans DevTools
   # Application → Service Workers → Offline
   # Rechargez la page, elle doit fonctionner
   ```

---

## Mise à jour

### Déploiements automatiques (Netlify/Vercel)

```bash
# Commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# Le déploiement se lance automatiquement
```

### GitHub Pages

```bash
npm run deploy
```

### Serveur personnel

```bash
# Sur le serveur
cd repet
git pull origin main
npm install
npm run build
pm2 restart repet
```

---

## Rollback (retour en arrière)

### Netlify/Vercel

Via le dashboard :
1. Deploys → Historique
2. Sélectionnez un déploiement précédent
3. "Publish deploy"

### GitHub Pages

```bash
git revert HEAD
git push origin main
npm run deploy
```

---

## Monitoring et Analytics (optionnel)

### Google Analytics

Ajoutez dans `index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (erreurs en production)

```bash
npm install @sentry/react @sentry/tracing
```

Dans `main.tsx` :

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "VOTRE_DSN_SENTRY",
  environment: "production",
});
```

---

## Troubleshooting

### L'application ne se charge pas

- Vérifiez les logs de build
- Vérifiez que `dist/index.html` existe
- Vérifiez la configuration du serveur (redirections SPA)

### Service worker ne fonctionne pas

- Assurez-vous que le site est en HTTPS
- Videz le cache : DevTools → Application → Clear storage
- Vérifiez que `sw.js` est accessible

### L'installation PWA ne s'affiche pas

- Vérifiez HTTPS
- Vérifiez que les icônes existent (`/icons/icon-*.png`)
- Audit Lighthouse pour diagnostiquer

---

## Ressources

- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages Docs](https://pages.github.com)
- [PWA Builder](https://www.pwabuilder.com)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## Support

Pour toute question :
- Ouvrez une issue sur GitHub
- Consultez la documentation dans `/docs`
- Vérifiez les logs de déploiement

**Bonne chance avec votre déploiement ! 🚀**