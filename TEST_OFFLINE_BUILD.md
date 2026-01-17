# Guide de Test - Build Offline v0.3.0

## ✅ Modifications Apportées

### Problème Identifié
- Les fichiers voix (`.onnx`) étaient **exclus du precache** dans `vite.config.offline.ts`
- Stratégie `NetworkFirst` utilisée pour les voix → tentative réseau en priorité
- Conséquences :
  - Barres de progression oscillantes (tentatives réseau avec timeouts)
  - Erreur immédiate en mode offline (pas de fallback cache)

### Corrections Effectuées
1. **Suppression de l'exclusion** : Retiré `'**/voices/**/*.onnx'` de `globIgnores`
2. **Ajout au precache** : Ajouté `.onnx`, `.wasm`, `.data` aux `globPatterns`
3. **Stratégie changée** : `NetworkFirst` → `CacheFirst` pour les voix
4. **Résultat** : 277 MB précachés (3 voix + WASM + app)

## 🧪 Tests à Effectuer

### 1. Vérification du Service Worker (DevTools)

#### A. Vérifier le Precache
```bash
# Ouvrir Chrome DevTools (F12)
# Application → Service Workers
# Vérifier que le SW est actif : sw.js (v0.3.0)
```

Dans la console, exécuter :
```javascript
caches.open('workbox-precache-v2-https://app.repet.com/').then(cache => 
  cache.keys().then(keys => {
    const onnxFiles = keys.filter(r => r.url.includes('.onnx'));
    console.log('Fichiers .onnx précachés:', onnxFiles.length);
    onnxFiles.forEach(f => console.log(' -', f.url));
  })
);
```

**Résultat attendu** : 3 fichiers `.onnx` listés
- `voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx`
- `voices/fr_FR-tom-medium/fr_FR-tom-medium.onnx`
- `voices/fr_FR-upmc-medium/fr_FR-upmc-medium.onnx`

#### B. Vérifier le Cache Storage
```bash
# Application → Cache Storage
# Chercher : workbox-precache-v2-...
# Filtrer par "onnx"
```

**Résultat attendu** : Taille totale du cache ~277 MB

### 2. Test Fonctionnel Offline

#### Test 1 : Premier Chargement (Online)
1. Ouvrir `https://app.repet.com` en navigation privée
2. Ouvrir DevTools → Network
3. Observer le chargement initial du Service Worker
4. Vérifier que les `.onnx` sont chargés depuis le réseau (200)
5. **Attendre la fin du precache** (peut prendre 30-60s selon connexion)
6. Vérifier dans Console : "Service Worker precache complete"

#### Test 2 : Chargement d'une Voix (Online puis Offline)
1. Charger un texte dans l'application
2. Sélectionner une voix (ex: Siwis)
3. **Observer la barre de progression** :
   - ✅ **Attendu** : Progression fluide, pas d'oscillations
   - ❌ **Ancien comportement** : Oscillations erratiques
4. Lancer la lecture TTS
5. Vérifier que la voix fonctionne

#### Test 3 : Mode Offline Complet
1. Application chargée et voix en cache (après Test 1 & 2)
2. **Couper le réseau** :
   - Chrome DevTools → Network → "Offline" checkbox
   - OU désactiver Wi-Fi/Ethernet
3. Rafraîchir la page (F5)
4. **Vérifier** :
   - ✅ Application se charge normalement
   - ✅ Toutes les ressources viennent du Service Worker (from ServiceWorker)
5. Charger un nouveau texte
6. Sélectionner une voix différente
7. **Observer la barre de progression** :
   - ✅ **Attendu** : Chargement instantané depuis le cache, pas d'erreur
   - ❌ **Ancien comportement** : Erreur réseau immédiate
8. Lancer la lecture TTS
9. **Vérifier** :
   - ✅ La voix se joue normalement
   - ✅ Aucune erreur dans la console

#### Test 4 : Réseau Instable (Throttling)
1. Chrome DevTools → Network → Throttling → "Slow 3G"
2. Charger un texte
3. Changer de voix plusieurs fois
4. **Observer** :
   - ✅ **Attendu** : Chargement depuis cache (instantané), pas de délai réseau
   - ❌ **Ancien comportement** : Tentatives réseau lentes avec timeouts

### 3. Vérification des Logs

#### Console Browser (Chrome DevTools → Console)
Filtrer par "voice" ou "cache" :

**Messages attendus** :
```
✅ Service Worker registered
✅ Precaching complete
✅ Voice loaded from cache: fr_FR-siwis-medium
✅ TTS initialized successfully
```

**Messages à NE PAS voir** :
```
❌ Network error loading voice
❌ Failed to fetch
❌ Voice model not found
```

#### Network Tab
En mode offline, filtrer par "onnx" :

**Attendu** :
```
Status: (ServiceWorker)
Type: fetch
Size: (from ServiceWorker)
```

**À NE PAS voir** :
```
Status: (failed) net::ERR_INTERNET_DISCONNECTED
```

### 4. Test de Performance

#### Mesurer le Temps de Chargement des Voix
Dans la console :
```javascript
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.onnx'))
  .forEach(r => console.log(r.name.split('/').pop(), ':', Math.round(r.duration), 'ms'));
```

**Résultats attendus** :
- **Depuis cache (offline)** : < 100 ms par voix
- **Depuis réseau (premier chargement)** : 5-30 secondes par voix (selon connexion)

### 5. Test Multi-Navigateur

Répéter les tests 2-4 sur :
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (si disponible)
- ✅ Chrome Android

## 🐛 Problèmes Potentiels et Solutions

### Problème : "Service Worker update found"
**Cause** : Ancien SW encore actif
**Solution** :
1. DevTools → Application → Service Workers
2. Cliquer "Unregister"
3. Vider tous les caches
4. Hard refresh (Ctrl+Shift+R)

### Problème : Cache incomplet
**Cause** : Precache interrompu
**Solution** :
```javascript
// Vérifier le nombre d'entrées précachées
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => 
      cache.keys().then(keys => 
        console.log(name, ':', keys.length, 'entries')
      )
    );
  });
});
// Attendu: workbox-precache-v2-... : 30 entries
```

### Problème : Fichiers .onnx toujours chargés depuis réseau
**Cause** : Build incorrect
**Solution** :
```bash
# Vérifier le service worker généré
grep -c "\.onnx" dist-offline/sw.js
# Attendu: 6 (3 fichiers × 2 occurrences)

# Vérifier la taille du precache
grep "precache" dist-offline/sw.js
# Doit contenir les 3 fichiers .onnx avec leurs revisions
```

## 📊 Checklist de Validation

Avant de déployer en production :

- [ ] Service Worker s'enregistre correctement
- [ ] 30 fichiers précachés (incluant 3 × .onnx)
- [ ] Taille totale du cache : ~277 MB
- [ ] Chargement des voix fluide (pas d'oscillations)
- [ ] Mode offline complet fonctionnel (après precache)
- [ ] Aucune erreur réseau en mode offline
- [ ] Stratégie CacheFirst active pour `/voices/.*\.onnx`
- [ ] Tests sur Chrome, Firefox, et au moins 1 mobile
- [ ] Performance : chargement voix < 100ms depuis cache
- [ ] Aucune erreur dans la console en mode offline

## 🚀 Commandes de Test Rapide

```bash
# Rebuild complet
cd repet
npm run build:offline

# Vérifier le precache
grep -o "\.onnx" dist-offline/sw.js | wc -l
# Attendu: 6

# Vérifier la taille
du -sh dist-offline/
# Attendu: ~272M

# Servir localement pour test
npx serve dist-offline -p 8080
# Ouvrir http://localhost:8080
# Activer mode offline dans DevTools
# Tester chargement voix
```

## 📝 Rapport de Test (Template)

```markdown
## Test Build Offline v0.3.0 - [DATE]

### Environnement
- Navigateur : [Chrome 131 / Firefox 133 / etc.]
- OS : [Linux / Windows / macOS / Android]
- Connexion : [Fibre / 4G / etc.]

### Résultats

#### ✅ Tests Réussis
- [ ] Precache complet (30 entrées, 277 MB)
- [ ] Voix chargées depuis cache
- [ ] Mode offline fonctionnel
- [ ] Barres de progression fluides
- [ ] TTS lecture OK

#### ❌ Tests Échoués
- [ ] [Décrire le problème]

#### 📊 Métriques
- Temps chargement initial : [XX]s
- Temps chargement voix (cache) : [XX]ms
- Temps chargement voix (réseau) : [XX]s
- Taille cache total : [XXX] MB

### Commentaires
[Notes supplémentaires]
```

---

**Version du Guide** : 1.0  
**Date** : 2025-01-XX  
**Build Testé** : v0.3.0 offline