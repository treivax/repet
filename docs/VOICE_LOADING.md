# Comportement du chargement des voix

## Vue d'ensemble

L'application Répét charge les voix de synthèse vocale (TTS) au premier démarrage. Pour améliorer l'expérience utilisateur, cet état de chargement est **persisté** afin d'éviter de relancer l'écran d'initialisation à chaque visite.

---

## Quand l'écran d'initialisation s'affiche-t-il ?

L'écran d'initialisation (avec la barre de progression) s'affiche **uniquement** dans les cas suivants :

### 1. **Première visite**
- L'utilisateur ouvre l'application pour la première fois
- Les voix n'ont jamais été chargées
- Durée : 5-15 secondes selon le mode (offline/online)

### 2. **Changement de version de l'application**
- L'app a été mise à jour (nouveau `APP_VERSION`)
- Garantit que les voix sont compatibles avec la nouvelle version
- Les voix sont rechargées automatiquement

### 3. **Rechargement forcé**
- L'utilisateur ou le développeur force le rechargement via `window.forceReloadVoices()`
- Utile en cas de problème de cache ou pour le debug

---

## Comportement normal (après le premier chargement)

Une fois les voix chargées :

✅ **L'écran d'initialisation ne s'affiche plus** lors :
- Des rafraîchissements de page (F5)
- De la fermeture/réouverture de l'application
- Du redémarrage de la PWA
- De la navigation dans l'application

✅ **Les voix restent en cache** :
- Build offline : modèles stockés localement
- Build online : modèles en OPFS (Origin Private File System)

✅ **Démarrage instantané** :
- L'application démarre directement sur la bibliothèque
- Pas d'attente de 5-15 secondes à chaque visite

---

## Persistence technique

### Clés localStorage utilisées

```javascript
'repet:voices_loaded'    // État de chargement (true/false)
'repet:voices_version'   // Version de l'app lors du chargement
```

### Logique de vérification

```javascript
// Au démarrage de l'app
if (voix_chargées === true && version_enregistrée === version_actuelle) {
  // ✅ Pas d'écran d'initialisation
  // ✅ Démarrage direct
} else {
  // ⏳ Afficher l'écran d'initialisation
  // ⏳ Charger les voix
}
```

---

## Forcer le rechargement des voix

### En production (utilisateur final)

Si vous rencontrez un problème avec les voix :

1. Ouvrez la console développeur (F12)
2. Tapez : `window.forceReloadVoices()`
3. Appuyez sur Entrée
4. Rafraîchissez la page (F5)
5. L'écran d'initialisation s'affiche et recharge les voix

### En développement

```javascript
// Dans la console navigateur
window.forceReloadVoices()
// Puis rafraîchir (F5)
```

Ou manuellement via localStorage :

```javascript
// Vider le cache de chargement
localStorage.removeItem('repet:voices_loaded')
localStorage.removeItem('repet:voices_version')
// Puis rafraîchir
```

---

## Temps de chargement

### Build offline (app.repet.ecanasso.org)
- **Première visite** : 5-9 secondes (voix principale) + 6-8 secondes (voix secondaires)
- **Total** : ~15-17 secondes
- **Visites suivantes** : instantané (0 seconde)

### Build online (ios.repet.ecanasso.org)
- **Première visite** : Variable selon la connexion (téléchargement depuis CDN)
- **Visites suivantes** : 5-9 secondes (voix en cache OPFS)
- **Après cache complet** : instantané (0 seconde)

---

## Invalidation du cache

Le cache des voix est automatiquement invalidé lors :

1. **Changement de version de l'app**
   - `APP_VERSION` dans `src/config/version.ts` est modifiée
   - Déclenché lors d'un déploiement

2. **Changement de version des modèles** (build online uniquement)
   - `MODEL_VERSION` dans `src/config/version.ts` est modifiée
   - Force le téléchargement de nouveaux modèles depuis le CDN

3. **Rechargement manuel**
   - Via `window.forceReloadVoices()`

---

## Résolution de problèmes

### L'écran d'initialisation s'affiche à chaque fois

**Cause possible** : localStorage désactivé ou en mode privé

**Solution** :
1. Vérifiez que le navigateur autorise le localStorage
2. Désactivez le mode navigation privée
3. Vérifiez les paramètres de confidentialité du navigateur

**Vérification** :
```javascript
// Dans la console
console.log(localStorage.getItem('repet:voices_loaded'))
// Devrait afficher "true" après le premier chargement
```

### Les voix ne se chargent pas

**Solution** :
1. Forcez le rechargement : `window.forceReloadVoices()`
2. Rafraîchissez la page
3. Vérifiez la console pour les erreurs
4. Vérifiez votre connexion internet (build online)

### Cache corrompu

**Solution** :
```javascript
// Nettoyer complètement le cache
localStorage.clear()
// Recharger la page
location.reload()
```

---

## Architecture technique

### Fichiers impliqués

- `src/App.tsx` : Logique de persistence du chargement
- `src/components/voice-preloader/InitializationModal.tsx` : Écran d'initialisation
- `src/config/version.ts` : Gestion des versions (app et modèles)
- `src/core/tts/providers/PiperWASMProvider.ts` : Provider TTS avec cache

### Flux de chargement

```
┌─────────────────────────────────────────────────────────────┐
│  Démarrage de l'application                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Vérification localStorage                                  │
│  - repet:voices_loaded = ?                                  │
│  - repet:voices_version = ?                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ Voix chargées│          │ Rechargement │
│ Version OK   │          │ nécessaire   │
└──────┬───────┘          └──────┬───────┘
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ Démarrage    │          │ Afficher     │
│ instantané   │          │ InitModal    │
└──────────────┘          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Charger voix │
                          │ Phase 1 + 2  │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Sauvegarder  │
                          │ localStorage │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Démarrage    │
                          │ app          │
                          └──────────────┘
```

---

## Compatibilité

### Navigateurs supportés

✅ **Tous les navigateurs modernes** supportant localStorage :
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Modes PWA

✅ **PWA installée** : Fonctionne normalement
✅ **Mode navigateur** : Fonctionne normalement
✅ **Mode hors ligne** : Fonctionne (build offline uniquement)

### Limitations

⚠️ **Mode navigation privée** : Le cache est vidé à la fermeture
⚠️ **localStorage désactivé** : L'écran d'initialisation apparaît à chaque fois
⚠️ **Quota OPFS dépassé** (iOS) : Rechargement automatique des voix

---

## Pour les développeurs

### Tester l'écran d'initialisation

```bash
# Méthode 1 : Via la console
window.forceReloadVoices()
# Puis F5

# Méthode 2 : Vider localStorage
localStorage.clear()
# Puis F5

# Méthode 3 : Mode navigation privée
# Ouvrir une fenêtre privée (Ctrl+Shift+N)
```

### Bumper la version pour forcer le rechargement

```bash
# Modifier src/config/version.ts
export const APP_VERSION = '1.0.3'  # Incrémenter

# Commit et déployer
git add src/config/version.ts
git commit -m "chore: bump version to 1.0.3"
git push origin main
```

### Logs de debug

```javascript
// Les logs sont automatiquement affichés dans la console
[App] ✅ Voix déjà chargées pour la version 1.0.2
[App] 🔄 Chargement initial des voix requis
[App] 💾 Sauvegarde de l'état de chargement des voix
[App] 🔧 Fonction debug exposée: window.forceReloadVoices()
```

---

**Dernière mise à jour** : 2025-01-15