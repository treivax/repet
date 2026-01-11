# Guide de test de l'installation PWA

## Pourquoi l'icône d'installation n'apparaît pas en mode dev ?

En mode développement (`npm run dev`), le service worker PWA n'est **pas activé** par défaut pour éviter des problèmes de cache pendant le développement. L'icône d'installation n'apparaîtra donc pas.

## Comment tester l'installation PWA en mode production

### Étape 1 : Build de production

```bash
npm run build
```

Cela génère les fichiers optimisés dans le dossier `dist/` avec le service worker activé.

### Étape 2 : Servir le build en local

```bash
npm run preview
```

L'application sera servie sur `http://localhost:4173` (ou un autre port).

### Étape 3 : Ouvrir dans Chrome

```bash
# Sur Linux
google-chrome http://localhost:4173

# Ou manuellement
# Ouvrez Chrome et allez sur http://localhost:4173
```

### Étape 4 : Vérifier l'icône d'installation

Après quelques secondes, vous devriez voir :

1. **Icône dans la barre d'adresse** : Un petit ⊕ ou une icône d'installation à droite de l'URL
2. **Menu Chrome** : Menu (⋮) → "Installer Répét..."

## Conditions pour que l'icône apparaisse

Chrome affiche l'icône d'installation PWA si :

✅ L'application est servie via **HTTPS** (ou localhost)
✅ Un fichier **manifest.json** valide est présent
✅ Un **service worker** est enregistré
✅ L'application a une **icône** valide
✅ Le manifest spécifie `display: "standalone"`

## Vérification via DevTools

1. Ouvrez DevTools (F12)
2. Onglet **Application**
3. Section **Manifest** : Vérifiez que le manifest est bien chargé
4. Section **Service Workers** : Vérifiez qu'un service worker est actif
5. Section **Storage** : Vérifiez le cache

## Tester sur un vrai domaine (production)

Pour tester en conditions réelles :

1. **Déployez sur un hébergeur** (Netlify, Vercel, GitHub Pages, etc.)
2. **Accédez via HTTPS** (obligatoire pour PWA)
3. L'icône d'installation apparaîtra automatiquement

## Alternative : Forcer le service worker en dev

Si vous voulez vraiment tester en dev, modifiez `vite.config.ts` :

```typescript
VitePWA({
  registerType: 'autoUpdate',
  devOptions: {
    enabled: true  // ← Ajouter cette ligne
  },
  // ... reste de la config
})
```

Puis relancez `npm run dev`.

⚠️ **Attention** : Cela peut causer des problèmes de cache en développement !

## Commandes utiles

```bash
# Build
npm run build

# Preview du build (mode production local)
npm run preview

# Dev avec service worker (si devOptions.enabled: true)
npm run dev
```

## Résolution de problèmes

### L'icône n'apparaît toujours pas

1. **Vérifiez les icônes** : Les fichiers `public/icons/icon-192.png` et `public/icons/icon-512.png` doivent exister
2. **Videz le cache** : DevTools → Application → Clear storage → Clear site data
3. **Vérifiez HTTPS** : L'installation ne fonctionne que sur HTTPS (ou localhost)
4. **Rechargez** : Ctrl+Shift+R (rechargement dur)

### Service worker bloqué

```bash
# Dans DevTools → Application → Service Workers
# Cliquez sur "Unregister" puis rechargez la page
```

## Test rapide complet

```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Ouvrez http://localhost:4173 dans Chrome
# 4. Attendez 2-3 secondes
# 5. L'icône ⊕ devrait apparaître dans la barre d'adresse
```

---

**Résumé** : Utilisez `npm run preview` après `npm run build` pour tester l'installation PWA localement !
