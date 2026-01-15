# 🚀 Guide de déploiement rapide

**Temps estimé** : 2-3 heures  
**Version** : v0.4.1  
**Branche** : `feat/piper-fork-multi-speaker`

---

## ⚡ Déploiement express (étapes minimales)

### 1️⃣ Tests critiques (30 min)

```bash
# Démarrer le serveur de dev
npm run dev:offline

# Ouvrir http://localhost:5174 dans le navigateur
```

**Tests à effectuer** :

- [ ] ✅ Charger la pièce "Alegria"
- [ ] ✅ Cliquer "Lecture audio"
- [ ] ✅ Vérifier que l'audio se lit sans erreur
- [ ] ✅ Console : Pas d'erreur `piper_phonemize`
- [ ] ✅ Tester les 4 voix :
  - Siwis (F)
  - Tom (H)
  - Jessica (F, UPMC)
  - Pierre (H, UPMC) ← **NOUVEAU**

**Si un test échoue** : STOP, voir `DEPLOYMENT_CHECKLIST.md` pour debug

---

### 2️⃣ Build production (10 min)

```bash
# Build offline (PWA complète)
npm run build:offline

# Vérifier que le build a réussi
ls -lh dist/
# Devrait contenir : index.html, assets/, wasm/, models/, sw.js
```

**Build online** (optionnel, modèles chargés depuis Hugging Face) :

```bash
npm run build:online
ls -lh dist-online/
```

**Tester le build localement** :

```bash
npm run preview
# → http://localhost:4173
# → Tester l'audio et le mode offline
```

---

### 3️⃣ Merge dans main (5 min)

```bash
# S'assurer d'être sur la branche feature
git checkout feat/piper-fork-multi-speaker

# Vérifier l'état
git status
git log --oneline -5

# Passer sur main et merger
git checkout main
git pull origin main
git merge feat/piper-fork-multi-speaker

# Pousser sur le remote
git push origin main

# Créer un tag de version
git tag -a v0.4.1 -m "Release v0.4.1 - Pierre voice + audio fix"
git push origin v0.4.1
```

---

### 4️⃣ Déploiement (selon votre hébergeur)

#### Option A : Netlify (RECOMMANDÉ)

1. **Connecter le repo** :
   - Aller sur https://app.netlify.com
   - "Add new site" → "Import from Git"
   - Sélectionner votre repo GitHub

2. **Configurer le build** :
   - Build command : `npm run build:offline`
   - Publish directory : `dist`

3. **Créer `netlify.toml`** à la racine :

```toml
[build]
  command = "npm run build:offline"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"

[[headers]]
  for = "/wasm/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/models/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

4. **Commit et push** :

```bash
git add netlify.toml
git commit -m "chore: add Netlify config"
git push origin main
```

5. **Deploy automatique** : Netlify détectera le push et déploiera automatiquement

---

#### Option B : Vercel

1. **Connecter le repo** :
   - Aller sur https://vercel.com
   - "Add New..." → "Project"
   - Import votre repo GitHub

2. **Configurer le build** :
   - Framework Preset : Vite
   - Build Command : `npm run build:offline`
   - Output Directory : `dist`

3. **Créer `vercel.json`** à la racine :

```json
{
  "buildCommand": "npm run build:offline",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    },
    {
      "source": "/wasm/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/models/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

4. **Commit et push** :

```bash
git add vercel.json
git commit -m "chore: add Vercel config"
git push origin main
```

5. **Deploy automatique** : Vercel détectera le push et déploiera automatiquement

---

#### Option C : GitHub Pages

1. **Créer `.github/workflows/deploy.yml`** :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build:offline
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

2. **Activer GitHub Pages** :
   - Repo Settings → Pages
   - Source : GitHub Actions

3. **Commit et push** :

```bash
git add .github/workflows/deploy.yml
git commit -m "chore: add GitHub Pages deployment workflow"
git push origin main
```

**⚠️ IMPORTANT pour GitHub Pages** : Les headers CORS ne peuvent pas être configurés facilement. Si vous avez des problèmes ONNX Runtime, préférez Netlify/Vercel.

---

#### Option D : Serveur personnalisé (VPS/Nginx)

1. **Build localement** :

```bash
npm run build:offline
```

2. **Upload dist/ vers le serveur** :

```bash
rsync -avz dist/ user@yourserver.com:/var/www/repet/
```

3. **Configuration Nginx** (`/etc/nginx/sites-available/repet`) :

```nginx
server {
    listen 443 ssl http2;
    server_name repet.yourserver.com;

    ssl_certificate /etc/letsencrypt/live/repet.yourserver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repet.yourserver.com/privkey.pem;

    root /var/www/repet;
    index index.html;

    # Headers CORS requis pour ONNX Runtime
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;

    # Cache des fichiers statiques
    location /wasm/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /models/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/wasm;
    gzip_min_length 1000;
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name repet.yourserver.com;
    return 301 https://$server_name$request_uri;
}
```

4. **Activer le site** :

```bash
sudo ln -s /etc/nginx/sites-available/repet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 5️⃣ Validation post-déploiement (15 min)

**Checklist** :

- [ ] ✅ URL accessible (HTTPS)
- [ ] ✅ Page se charge sans erreur
- [ ] ✅ Audio fonctionne
- [ ] ✅ Les 4 voix sont disponibles
- [ ] ✅ Multi-speaker fonctionne (Jessica ≠ Pierre)
- [ ] ✅ PWA installable (bouton "Installer" visible)
- [ ] ✅ Mode offline fonctionne :
  - DevTools > Application > Service Workers → "Activated"
  - DevTools > Application > Storage → IndexedDB présent
  - Cocher "Offline" → App fonctionne toujours

**Tests navigateurs** :

- [ ] Chrome/Edge : OK
- [ ] Firefox : OK
- [ ] Safari (si possible) : OK

**DevTools > Console** :

- [ ] Pas d'erreur `piper_phonemize`
- [ ] Pas d'erreur CORS
- [ ] Logs : `[PiperWASMProvider] Synthèse pour voix: ...`

---

## 🎯 Checklist finale

- [ ] Tests audio : OK
- [ ] Build : OK
- [ ] Merge main : OK
- [ ] Tag v0.4.1 : OK
- [ ] Déploiement : OK
- [ ] Validation prod : OK

**Si tout est ✅** → 🎉 **Déploiement réussi !**

---

## 🐛 Problèmes courants

### Erreur : "SharedArrayBuffer is not defined"

**Cause** : Headers CORS manquants

**Solution** :
- Vérifier que les headers sont bien configurés sur le serveur :
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
- Tester avec : `curl -I https://your-url.com`

---

### Erreur : "Failed to fetch model"

**Cause** : Modèles ONNX non trouvés

**Solution** :
- Build offline : Vérifier que `dist/models/` contient les fichiers `.onnx` et `.json`
- Build online : Vérifier la connexion à Hugging Face

---

### PWA non installable

**Cause** : Manifest ou Service Worker manquant

**Solution** :
- Vérifier `dist/manifest.webmanifest` existe
- Vérifier `dist/sw.js` existe
- DevTools > Application > Manifest : Pas d'erreur
- HTTPS requis (sauf localhost)

---

### Audio ne se lit pas

**Cause** : Fork non utilisé ou WASM manquants

**Solution** :
- Vérifier console : Doit afficher `[PiperWASMProvider]`
- Vérifier `dist/wasm/piper_phonemize.*` existent
- Tester en local d'abord : `npm run preview`

---

## 📚 Ressources

- **Checklist complète** : `DEPLOYMENT_CHECKLIST.md` (10 étapes détaillées)
- **Tests** : `TEST_CHECKLIST.md` (10 scénarios de test)
- **Documentation technique** : `docs/AUDIO_PLAYBACK_FIX.md`
- **Solution résumée** : `SOLUTION_SUMMARY.md`

---

## 🚀 Prochaines étapes (après déploiement)

1. **Annoncer la release** :
   - Blog / réseaux sociaux
   - "Répét v0.4.1 disponible : nouvelle voix Pierre + correction audio"

2. **Collecter feedback** :
   - Installer sur plusieurs appareils
   - Demander retours utilisateurs
   - Noter bugs/améliorations

3. **Planifier v0.5.0** :
   - Roadmap des fonctionnalités
   - Issues GitHub
   - Priorisation

---

**Temps total estimé** : 2-3 heures  
**Dernière mise à jour** : 2025-01-15