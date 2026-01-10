# Guide de Déploiement - Répét

Ce guide explique comment déployer l'application Répét sur différentes plateformes.

## 📋 Pré-requis

- Node.js 18+ installé
- Git installé
- Compte sur la plateforme de déploiement choisie
- Build de production validé localement

---

## 🚀 Build de Production

Avant tout déploiement, créer un build de production :

```bash
# Installer les dépendances
npm install

# Vérifier les types
npm run type-check

# Vérifier le linting
npm run lint

# Créer le build
npm run build
```

Le dossier `dist/` contient les fichiers à déployer.

---

## 🌐 Déploiement sur Netlify

### Méthode 1 : Via l'interface web

1. **Créer un compte** sur [netlify.com](https://netlify.com)
2. **Importer le projet** depuis GitHub/GitLab/Bitbucket
3. **Configuration du build** :
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18
4. **Déployer** → Le site est en ligne en quelques minutes

### Méthode 2 : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=dist
```

### Configuration personnalisée

Créer un fichier `netlify.toml` à la racine :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

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
```

---

## 🔷 Déploiement sur Vercel

### Méthode 1 : Via l'interface web

1. **Créer un compte** sur [vercel.com](https://vercel.com)
2. **Importer le projet** depuis GitHub
3. **Configuration automatique** détectée (Vite)
4. **Déployer** → Le site est en ligne

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### Configuration personnalisée

Créer un fichier `vercel.json` :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
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

## 📦 Déploiement sur GitHub Pages

### Configuration

1. **Créer le fichier** `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. **Activer GitHub Pages** :
   - Aller dans Settings > Pages
   - Source : Deploy from a branch
   - Branch : gh-pages / root

3. **Configurer le base path** dans `vite.config.ts` :

```typescript
export default defineConfig({
  base: '/repet/', // Remplacer par le nom du repo
  // ... reste de la config
})
```

---

## 🔶 Déploiement sur Firebase Hosting

### Configuration

1. **Installer Firebase CLI** :

```bash
npm install -g firebase-tools
```

2. **Se connecter** :

```bash
firebase login
```

3. **Initialiser Firebase** :

```bash
firebase init hosting
```

Configuration :
- Public directory: `dist`
- Single-page app: Yes
- GitHub auto-deploy: Optional

4. **Créer `firebase.json`** :

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/manifest.webmanifest",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/manifest+json"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

5. **Déployer** :

```bash
npm run build
firebase deploy --only hosting
```

---

## 🐳 Déploiement avec Docker

### Créer un Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Créer nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /manifest.webmanifest {
        add_header Content-Type "application/manifest+json";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

### Build et Run

```bash
# Build l'image
docker build -t repet .

# Run le container
docker run -p 8080:80 repet
```

L'application est accessible sur `http://localhost:8080`

---

## 🔐 Variables d'Environnement

Répét n'utilise actuellement **aucune variable d'environnement** (tout est local).

Si vous ajoutez des services externes (analytics, API), créer un fichier `.env` :

```env
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=UA-XXXXX-Y
```

Et l'utiliser dans le code :

```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

⚠️ **Important** : Ne jamais committer `.env` avec des secrets !

---

## 🌍 Domaine Personnalisé

### Sur Netlify

1. Aller dans Site settings > Domain management
2. Ajouter un domaine personnalisé
3. Configurer les DNS selon les instructions

### Sur Vercel

1. Aller dans Settings > Domains
2. Ajouter le domaine
3. Configurer les DNS (A record ou CNAME)

### Sur Firebase

```bash
firebase hosting:channel:deploy production --expires 30d
```

---

## 🔄 CI/CD Automatique

### GitHub Actions (exemple complet)

Créer `.github/workflows/ci-cd.yml` :

```yaml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install
        run: npm ci
      
      - name: Type Check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📊 Monitoring Post-Déploiement

### Vérifications à faire après déploiement

- [ ] Application accessible via HTTPS
- [ ] PWA installable (icône dans la barre d'adresse)
- [ ] Service Worker enregistré (DevTools > Application)
- [ ] Manifest valide (DevTools > Application > Manifest)
- [ ] Aucune erreur console
- [ ] IndexedDB fonctionne
- [ ] TTS fonctionne
- [ ] Mode offline fonctionne
- [ ] Performance acceptable (Lighthouse score > 90)

### Outils de monitoring

- **Google Lighthouse** : Performance, Accessibilité, PWA
- **WebPageTest** : Tests de performance
- **Can I Use** : Compatibilité navigateur

---

## 🔧 Troubleshooting

### Problème : Routes 404 après déploiement

**Solution** : Configurer les rewrites pour SPA (voir config Netlify/Vercel ci-dessus)

### Problème : Service Worker ne se met pas à jour

**Solution** : Vider le cache, ou forcer le rechargement (Ctrl+Shift+R)

### Problème : Icônes PWA ne s'affichent pas

**Solution** : Vérifier que `/icons/icon-192.png` et `/icons/icon-512.png` existent

### Problème : TTS ne fonctionne pas en production

**Solution** : TTS nécessite HTTPS (sauf localhost). Vérifier que le site est en HTTPS.

---

## 📚 Ressources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

**Bon déploiement ! 🚀**