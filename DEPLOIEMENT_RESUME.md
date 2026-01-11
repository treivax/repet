# 🚀 Guide de déploiement Répét - Résumé

## 📚 Documentation créée

Vous avez maintenant 3 guides complets :

1. **DEPLOY_QUICKSTART.md** ⚡ - Démarrage rapide (5 minutes)
2. **DEPLOYMENT.md** 📖 - Guide complet et détaillé
3. **README.md** - Section déploiement mise à jour

## 🎯 Méthode recommandée : Netlify

### Pourquoi Netlify ?

✅ Gratuit pour toujours
✅ Configuration zéro (fichier `netlify.toml` déjà créé)
✅ HTTPS automatique
✅ Déploiements automatiques à chaque push
✅ Support PWA parfait
✅ CDN mondial

### Déploiement en 3 minutes

1. **Allez sur https://www.netlify.com**
   - Connectez-vous avec GitHub

2. **Importez le projet**
   - "Add new site" → "Import an existing project"
   - Sélectionnez GitHub → `repet`

3. **Déployez !**
   - La configuration est automatique (grâce à `netlify.toml`)
   - Cliquez sur "Deploy site"
   - Attendez 1-2 minutes

4. **Votre app est en ligne ! 🎉**
   - URL : `https://random-name-123.netlify.app`
   - Personnalisez le nom : Site settings → Domain management

## 🔷 Alternative : Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📄 Alternative : GitHub Pages (gratuit)

Le workflow est déjà configuré :
- `.github/workflows/deploy-gh-pages.yml` ✅
- Activez Pages : Settings → Pages → Source: "GitHub Actions"
- Chaque push déploiera automatiquement

## ✅ Checklist post-déploiement

Après déploiement, vérifiez :

- [ ] Le site se charge (ouvrez l'URL)
- [ ] HTTPS actif (cadenas dans la barre d'adresse)
- [ ] PWA installable (icône ⊕ dans Chrome)
- [ ] Service Worker actif (DevTools → Application → Service Workers)
- [ ] Import de pièce fonctionne
- [ ] Lecture audio fonctionne
- [ ] Mode italien fonctionne
- [ ] Thème sombre/clair fonctionne
- [ ] Aide accessible
- [ ] App fonctionne hors ligne (désactivez le réseau)

## 🔄 Mises à jour automatiques

Netlify et Vercel :
```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → Déploiement automatique en 1-2 minutes !
```

## 📱 Test d'installation PWA

### Desktop (Chrome)
1. Ouvrez votre URL de production
2. Attendez 2-3 secondes
3. Icône ⊕ dans la barre d'adresse
4. Ou Menu (⋮) → "Installer Répét..."

### Android (Chrome)
- Menu (⋮) → "Installer l'application"
- L'icône apparaît sur l'écran d'accueil

### iOS (Safari)
- Partager (□↑) → "Sur l'écran d'accueil"

## 🆘 Problèmes ?

### Le site ne se charge pas
- Vérifiez les logs de build dans le dashboard
- `npm run build` doit fonctionner localement

### PWA ne s'installe pas
- Vérifiez HTTPS (obligatoire)
- Attendez quelques secondes après le chargement
- DevTools → Onglet Application → Manifest

### Service Worker bloqué
- DevTools → Application → Service Workers → Unregister
- Rechargez (Ctrl+Shift+R)

## 📊 Monitoring (optionnel)

- **Netlify Analytics** : Dashboard → Analytics
- **Vercel Analytics** : Dashboard → Analytics
- **Google Analytics** : Voir DEPLOYMENT.md

## 🎉 Prochaines étapes

1. ✅ Déployez sur Netlify/Vercel
2. ✅ Testez l'installation PWA
3. ✅ Partagez l'URL avec votre troupe
4. ✅ Récoltez les feedbacks
5. ✅ Améliorez l'application

---

**Bon spectacle ! 🎭**
