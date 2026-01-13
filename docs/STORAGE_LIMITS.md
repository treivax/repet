# Limites de stockage PWA : Analyse pour Répét

Guide d'analyse des limites de stockage pour l'application Répét avec fichiers locaux intégrés au build.

---

## 📊 Architecture actuelle de Répét

### Stockage des fichiers vocaux

**IMPORTANT** : Les fichiers ne sont **PAS téléchargés** depuis Internet !

```
┌─────────────────────────────────────────────┐
│           Build de production               │
│                                             │
│  dist/                                      │
│  ├── voices/        (535 MB)                │
│  │   ├── fr_FR-siwis-medium/               │
│  │   │   └── *.onnx (61 MB)                │
│  │   ├── fr_FR-tom-medium/                 │
│  │   │   └── *.onnx (61 MB)                │
│  │   ├── fr_FR-upmc-medium/                │
│  │   │   └── *.onnx (74 MB)                │
│  │   └── fr_FR-mls-medium/                 │
│  │       └── *.onnx (74 MB)                │
│  ├── wasm/          (116 MB)                │
│  └── assets/        (24 MB)                 │
│                                             │
│  TOTAL: ~675 MB                             │
└─────────────────────────────────────────────┘
```

### Comment ça fonctionne

1. **Build** : Les modèles sont copiés dans `dist/voices/` via `vite-plugin-static-copy`
2. **Déploiement** : Les 675 MB sont déployés sur le serveur (Netlify/Vercel/etc.)
3. **Premier accès** : L'utilisateur télécharge l'app depuis le serveur
4. **Chargement des voix** :
   - Le moteur Piper fait `fetch('https://huggingface.co/...')`
   - **NetworkInterceptor** intercepte et redirige vers `/voices/...` (local)
   - Les fichiers sont chargés **depuis le disque local**, pas Internet
5. **Mode offline** : Tout fonctionne car les fichiers sont déjà sur le disque

```javascript
// Exemple de redirection
fetch('https://huggingface.co/.../fr_FR-siwis-medium.onnx')
  ↓ [NetworkInterceptor]
  ↓ Redirigé vers
  ↓
fetch('/voices/fr_FR-siwis-medium/fr_FR-siwis-medium.onnx')
  ↓ [Service Worker / Cache]
  ↓ Fichier local déjà sur le disque
  ↓
✅ Modèle chargé (PAS de connexion Internet)
```

### Taille des fichiers

| Fichier | Taille | Stockage |
|---------|--------|----------|
| **Modèles .onnx** | 270 MB | Cache / Disque |
| **WASM ONNX Runtime** | 88 MB | Cache / Disque |
| **Piper phonemize** | 28 MB | Cache / Disque |
| **JS/CSS assets** | 24 MB | Cache / Disque |
| **Autres** | 265 MB | Cache / Disque |
| **TOTAL** | **675 MB** | **Sur le disque local** |

---

## 🔍 Vraie question : Limites de TÉLÉCHARGEMENT initial

Le vrai problème n'est PAS le stockage en cache, mais le **téléchargement initial** de l'app.

### Premier accès utilisateur

```
Utilisateur visite repet.app
         ↓
Service Worker s'installe
         ↓
Télécharge les assets précachés (~24 MB)
         ↓
Application démarre
         ↓
InitializationModal charge les voix
         ↓
fetch('/voices/fr_FR-siwis-medium.onnx')  ← 61 MB
fetch('/voices/fr_FR-tom-medium.onnx')     ← 61 MB
fetch('/voices/fr_FR-upmc-medium.onnx')    ← 74 MB
         ↓
TOTAL téléchargé: ~220 MB + 24 MB = 244 MB
```

### Limites de téléchargement par plateforme

| Plateforme | Limite téléchargement | Temps (4G) | Risque |
|------------|----------------------|------------|--------|
| **Chrome Desktop** | Aucune limite | ~2 min | 🟢 OK |
| **Firefox Desktop** | Aucune limite | ~2 min | 🟢 OK |
| **Safari Desktop** | Aucune limite | ~2 min | 🟢 OK |
| **Chrome Android** | Aucune limite | ~5 min | 🟡 Long |
| **Safari iOS** | Aucune limite | ~5 min | 🟡 Long |

**Vitesses typiques** :
- Fibre (100 Mbps) : 244 MB en ~20 secondes ✅
- 4G (20 Mbps) : 244 MB en ~2 minutes ⚠️
- 3G (5 Mbps) : 244 MB en ~8 minutes ❌
- WiFi lent (5 Mbps) : 244 MB en ~8 minutes ❌

---

## 💾 Limites de STOCKAGE par plateforme

Une fois téléchargés, les fichiers sont stockés sur le disque local.

### Chrome / Edge / Opera

#### Quotas de stockage

| Type | Limite | Pour Répét (675 MB) |
|------|--------|---------------------|
| **Cache Storage** | 60% disque libre | ✅ OK si > 1.2 GB libre |
| **Garantie minimum** | ~1 GB | ✅ OK (675 MB < 1 GB) |

**Vérification** :

```javascript
const estimate = await navigator.storage.estimate();
const quota = estimate.quota;          // Ex: 60 GB
const usage = estimate.usage;          // Ex: 100 MB
const available = quota - usage;       // Ex: 59.9 GB

// Répét va utiliser 675 MB supplémentaires
const afterInstall = usage + 675 * 1024 * 1024;
const willFit = afterInstall < quota;

console.log(`Quota: ${(quota / 1024**3).toFixed(2)} GB`);
console.log(`Après Répét: ${(afterInstall / 1024**2).toFixed(0)} MB`);
console.log(`Ça rentre: ${willFit ? '✅' : '❌'}`);
```

**Résultat typique** :
- PC avec 100 GB libres → Quota ~60 GB → ✅ **Largement suffisant**
- PC avec 5 GB libres → Quota ~3 GB → ✅ **Suffisant**
- PC avec 1 GB libre → Quota ~600 MB → ❌ **Insuffisant**

#### Éviction automatique

Chrome supprime les caches si :
1. Espace disque < 1 GB libre (critique)
2. Site pas utilisé depuis longtemps (LRU)

**Protection** :

```javascript
// Demander un stockage persistant
const granted = await navigator.storage.persist();
if (granted) {
  console.log('✅ Stockage protégé contre éviction');
} else {
  console.log('⚠️ Stockage temporaire');
}
```

### Firefox

#### Quotas de stockage

| Groupe | Limite | Répét |
|--------|--------|-------|
| **Groupe A** (PWA installée) | 20% disque | ✅ OK |
| **Groupe B** (site normal) | 2 GB max | ✅ OK (675 MB < 2 GB) |

**Calcul typique** :
- PC 100 GB libres → Groupe A : 20 GB → ✅ OK
- PC 10 GB libres → Groupe A : 2 GB → ✅ OK
- PC 2 GB libres → Groupe B : 400 MB → ❌ Insuffisant

### Safari Desktop (macOS)

#### Quotas de stockage

| Type | Limite | Répét |
|------|--------|-------|
| **Cache Storage** | ~1 GB | ⚠️ **JUSTE SUFFISANT** (675 MB) |
| **Éviction** | 7 jours inactivité | ⚠️ **Cache vidé** |

**ATTENTION** : Safari vide le cache après 7 jours sans visite.

### Android

#### Quotas de stockage

Dépend de l'espace libre sur l'appareil :

| Appareil | Stockage | Libre | Quota Chrome | Répét (675 MB) |
|----------|----------|-------|--------------|----------------|
| Haut de gamme | 128 GB | 50 GB | ~30 GB | ✅ OK |
| Milieu gamme | 64 GB | 20 GB | ~12 GB | ✅ OK |
| Milieu gamme | 32 GB | 10 GB | ~6 GB | ✅ OK |
| Bas de gamme | 16 GB | 2 GB | ~1.2 GB | ⚠️ **JUSTE** |
| Très bas | 8 GB | 500 MB | ~300 MB | ❌ **INSUFFISANT** |

**WebAPK** (app installée) : Meilleure protection contre éviction.

#### Risques Android

1. **Appareil plein** : Android peut demander de libérer de l'espace
2. **Utilisateur désinstalle** : Pour gagner 675 MB
3. **Cache vidé** : Si appareil critique

**Recommandation** : Vérifier l'espace avant installation.

### iOS (Safari)

#### ⚠️ LIMITATION CRITIQUE

| Type | Limite | Répét (675 MB) |
|------|--------|----------------|
| **Cache Storage** | **~50 MB** | ❌ **IMPOSSIBLE** |
| **Éviction** | 7 jours | ❌ **Systématique** |

**PROBLÈME MAJEUR** : iOS limite le Cache Storage à **~50 MB maximum**.

**Répét nécessite 675 MB** → **13x la limite iOS** → ❌ **INCOMPATIBLE**

#### Ce qui se passe sur iOS

```
Utilisateur installe Répét sur iOS
         ↓
Visite l'app la première fois
         ↓
Télécharge 24 MB d'assets (OK)
         ↓
InitializationModal démarre
         ↓
fetch('/voices/fr_FR-siwis-medium.onnx') → 61 MB
         ↓
Safari télécharge le fichier
         ↓
Tente de le mettre en cache
         ↓
❌ ERREUR: QuotaExceededError
         ↓
Cache vidé, fichier perdu
         ↓
Utilisateur doit re-télécharger à chaque fois
```

#### Comportement iOS en pratique

1. **Premier chargement** : Télécharge 675 MB depuis le serveur
2. **Mise en cache** : Safari refuse (> 50 MB)
3. **Cache vidé** : Immédiatement ou après 7 jours
4. **Prochain lancement** : Re-télécharge 675 MB
5. **Cycle infini** : Toujours re-télécharger

**Résultat** : 
- ✅ L'app **fonctionne** (avec Internet)
- ❌ **Jamais hors ligne** sur iOS
- ❌ **Toujours re-télécharger** 675 MB
- ❌ **Expérience catastrophique**

---

## 🎯 Analyse des risques

### Desktop

| OS | Navigateur | Quota | Téléchargement | Stockage | Risque |
|----|------------|-------|----------------|----------|--------|
| **Windows** | Chrome | ~60 GB | 2-5 min | ✅ OK | 🟢 **AUCUN** |
| **Windows** | Firefox | ~2 GB | 2-5 min | ✅ OK | 🟢 **FAIBLE** |
| **Windows** | Edge | ~60 GB | 2-5 min | ✅ OK | 🟢 **AUCUN** |
| **macOS** | Chrome | ~60 GB | 2-5 min | ✅ OK | 🟢 **AUCUN** |
| **macOS** | Safari | ~1 GB | 2-5 min | ⚠️ Juste | 🟡 **MOYEN** (éviction 7j) |
| **Linux** | Chrome | ~60 GB | 2-5 min | ✅ OK | 🟢 **AUCUN** |
| **Linux** | Firefox | ~2 GB | 2-5 min | ✅ OK | 🟢 **FAIBLE** |

### Mobile

| OS | Appareil | Quota | Téléchargement | Stockage | Risque |
|----|----------|-------|----------------|----------|--------|
| **Android** | Haut gamme (64GB+) | ~12 GB | 5-10 min | ✅ OK | 🟢 **FAIBLE** |
| **Android** | Milieu (32GB) | ~6 GB | 5-10 min | ✅ OK | 🟢 **FAIBLE** |
| **Android** | Bas (16GB) | ~1.2 GB | 8-15 min | ⚠️ Juste | 🟡 **MOYEN** |
| **Android** | Très bas (8GB) | ~300 MB | 10-20 min | ❌ Insuffisant | 🔴 **ÉLEVÉ** |
| **iOS** | Tous | **50 MB** | 5-10 min | ❌ **Impossible** | 🔴 **CRITIQUE** |

---

## 🚨 Problèmes identifiés

### 1. iOS : Limite de 50 MB (CRITIQUE)

**Impact** : ❌ L'app ne peut PAS stocker les 675 MB en cache

**Symptômes** :
- QuotaExceededError lors de la mise en cache
- Cache vidé immédiatement après téléchargement
- Re-téléchargement de 675 MB à chaque utilisation
- Impossible d'utiliser hors ligne
- Expérience utilisateur catastrophique

**Fréquence** : 🔴 **SYSTÉMATIQUE** sur tous les iPhones/iPads

### 2. Android bas de gamme (8-16 GB)

**Impact** : ⚠️ Risque si l'appareil est plein

**Symptômes** :
- QuotaExceededError si < 1 GB libre
- Éviction du cache si appareil plein
- Re-téléchargement nécessaire

**Fréquence** : 🟡 **OCCASIONNEL** (dépend de l'espace libre)

### 3. Safari Desktop (éviction 7 jours)

**Impact** : ⚠️ Cache vidé après 1 semaine sans visite

**Symptômes** :
- Re-téléchargement hebdomadaire si usage irrégulier
- 675 MB à télécharger à chaque retour

**Fréquence** : 🟡 **RÉGULIER** si usage < 1x/semaine

### 4. Connexion lente (3G, WiFi lent)

**Impact** : ⚠️ Téléchargement initial très long

**Symptômes** :
- 675 MB en 8-15 minutes sur 3G
- Utilisateur peut abandonner
- Consommation data mobile importante

**Fréquence** : 🟡 **DÉPEND** de la connexion

---

## 💡 Solutions recommandées

### Solution 1 : Avertir l'utilisateur iOS (IMMÉDIAT)

```typescript
// src/hooks/useIOSWarning.ts

export function useIOSWarning() {
  useEffect(() => {
    if (!isIOS()) return;

    showPersistentBanner({
      type: 'warning',
      title: 'Limitation iOS',
      message: `
        Sur iOS, les modèles vocaux (675 MB) ne peuvent pas être 
        stockés en cache. Ils seront téléchargés à chaque utilisation.
        
        Pour une meilleure expérience, utilisez Répét sur un ordinateur
        ou un appareil Android.
      `,
      actions: [
        {
          label: 'J\'ai compris',
          onClick: () => localStorage.setItem('ios-warning-seen', 'true'),
        },
      ],
    });
  }, []);
}
```

**Temps** : 1 heure  
**Impact** : Transparence utilisateur

### Solution 2 : Vérification de l'espace (COURT TERME - 1 jour)

```typescript
// src/utils/checkStorage.ts

export async function checkStorageBeforeInstall(): Promise<boolean> {
  const estimate = await navigator.storage.estimate();
  const available = (estimate.quota || 0) - (estimate.usage || 0);
  const needed = 700 * 1024 * 1024; // 700 MB (marge de sécurité)

  if (available < needed) {
    showError({
      title: 'Espace insuffisant',
      message: `
        Répét nécessite environ 700 MB d'espace libre.
        
        Disponible : ${(available / 1024**2).toFixed(0)} MB
        Requis : 700 MB
        
        Libérez de l'espace et réessayez.
      `,
      actions: [
        { label: 'Annuler', onClick: () => window.history.back() },
      ],
    });
    return false;
  }

  return true;
}

// Dans InitializationModal.tsx
const canInstall = await checkStorageBeforeInstall();
if (!canInstall) return;
```

**Temps** : 1 jour  
**Impact** : Évite les erreurs sur Android bas de gamme

### Solution 3 : Demander stockage persistant (COURT TERME - 1 heure)

```typescript
// src/utils/persistentStorage.ts

export async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) return;

  const isPersisted = await navigator.storage.persisted();
  if (isPersisted) {
    console.log('✅ Stockage déjà persistant');
    return;
  }

  const granted = await navigator.storage.persist();
  
  if (granted) {
    console.log('✅ Stockage persistant accordé');
    showToast({
      type: 'success',
      message: 'Les modèles vocaux sont protégés contre la suppression automatique',
    });
  } else {
    console.warn('⚠️ Stockage persistant refusé');
    showToast({
      type: 'info',
      message: 'Utilisez régulièrement Répét pour éviter la suppression du cache',
    });
  }
}

// Appeler au démarrage
await requestPersistentStorage();
```

**Temps** : 1 heure  
**Impact** : Protection contre éviction sur Chrome/Edge

### Solution 4 : Indicateur de progression détaillé (MOYEN TERME - 1 semaine)

```typescript
// src/components/voice-preloader/DetailedProgress.tsx

export function DetailedProgress() {
  const [downloaded, setDownloaded] = useState(0);
  const [total] = useState(675 * 1024 * 1024); // 675 MB

  return (
    <div className="progress-container">
      <h3>Téléchargement des modèles vocaux</h3>
      
      <ProgressBar value={downloaded} max={total} />
      
      <div className="stats">
        <span>{(downloaded / 1024**2).toFixed(0)} MB / 675 MB</span>
        <span>{((downloaded / total) * 100).toFixed(0)}%</span>
      </div>
      
      <div className="info">
        <p>Cette opération ne sera effectuée qu'une seule fois.</p>
        <p className="small">
          Connexion 4G : ~5 minutes | WiFi : ~2 minutes
        </p>
      </div>
    </div>
  );
}
```

**Temps** : 1 semaine  
**Impact** : Meilleure UX pendant le téléchargement

### Solution 5 : Chargement à la demande (MOYEN TERME - 2 semaines)

Au lieu de charger les 3 voix au démarrage, charger uniquement celles utilisées.

```typescript
// src/core/tts/providers/PiperWASMProvider.ts

async synthesize(text: string, options: TTSOptions) {
  const voiceId = options.voiceId || 'fr_FR-tom-medium';
  
  // Vérifier si le modèle est déjà chargé
  if (!this.loadedModels.has(voiceId)) {
    // Charger uniquement ce modèle (61-74 MB au lieu de 270 MB)
    await this.loadModel(voiceId);
  }
  
  // Synthétiser
  return await this.synthesizeWithModel(text, voiceId, options);
}
```

**Avantages** :
- ✅ Téléchargement initial : 61-74 MB au lieu de 270 MB
- ✅ Plus rapide pour démarrer
- ✅ Économie de bande passante

**Inconvénients** :
- ⚠️ Délai lors du premier changement de voix
- ⚠️ iOS : toujours limité à 50 MB (1 seule voix max)

**Temps** : 2 semaines  
**Impact** : Amélioration significative

### Solution 6 : Compression des modèles (LONG TERME - 1 mois)

Compresser les modèles .onnx avec gzip/brotli.

```bash
# Build-time compression
cd public/voices
for file in **/*.onnx; do
  brotli -9 -k "$file"  # Crée .onnx.br (~30-40% plus petit)
done

# Résultat :
# 675 MB → ~420 MB (gain ~38%)
```

**Avantages** :
- ✅ Réduction de 38% de la taille
- ✅ Téléchargement plus rapide
- ✅ Moins de stockage

**Inconvénients** :
- ⚠️ Coût CPU de décompression
- ⚠️ iOS : toujours > 50 MB (420 MB)

**Temps** : 1 mois  
**Impact** : Amélioration modérée

### Solution 7 : App native iOS (LONG TERME - 3 mois)

Développer une vraie app iOS avec Capacitor/React Native pour contourner les limitations PWA.

**Avantages** :
- ✅ Pas de limite de stockage
- ✅ Vraie app native
- ✅ Accès App Store
- ✅ Meilleure performance

**Inconvénients** :
- ❌ Beaucoup de travail (3 mois)
- ❌ Maintenance de 2 codebases
- ❌ Frais Apple Developer ($99/an)

**Temps** : 3 mois  
**Impact** : Solution définitive pour iOS

---

## 📝 Plan d'action recommandé

### Phase 1 : Immédiat (cette semaine)

1. ✅ **Avertissement iOS** (1h)
   - Bannière persistante sur iOS
   - Explique la limitation et le re-téléchargement

2. ✅ **Vérification espace** (1 jour)
   - Check avant téléchargement
   - Erreur claire si insuffisant

3. ✅ **Stockage persistant** (1h)
   - Demander persist() sur Chrome/Android
   - Protection contre éviction

**Temps total** : 2 jours

### Phase 2 : Court terme (mois prochain)

1. ⚠️ **Progression détaillée** (1 semaine)
   - Barre de progression avec MB
   - Estimation temps restant

2. ⚠️ **Chargement à la demande** (2 semaines)
   - Charger uniquement les voix utilisées
   - Réduire téléchargement initial à ~70 MB

**Temps total** : 3 semaines

### Phase 3 : Long terme (3-6 mois)

1. 🔮 **Compression modèles** (1 mois)
   - Réduction 675 MB → 420 MB

2. 🔮 **App native iOS** (3 mois)
   - Capacitor ou React Native
   - Solution définitive pour iOS

**Temps total** : 4 mois

---

## 🎯 Conclusion

### Résumé des limitations

| Plateforme | Limitation | Sévérité | Solution |
|------------|------------|----------|----------|
| **Desktop** | Aucune | 🟢 OK | Aucune action requise |
| **Android haut/milieu** | Aucune | 🟢 OK | Aucune action requise |
| **Android bas** | Espace limité | 🟡 Moyen | Vérifier espace avant installation |
| **iOS** | **50 MB max** | 🔴 **Critique** | Avertir utilisateur + App native (long terme) |

### Points clés

1. **Desktop et Android moderne** : ✅ Aucun problème
2. **Android bas de gamme** : ⚠️ Vérifier l'espace disponible
3. **iOS** : ❌ **INCOMPATIBLE** avec stockage en cache
4. **Solution iOS** : Avertir + téléchargement à chaque fois
5. **Long terme iOS** : App native nécessaire

### Priorisation

1. **URGENT** : Avertissement iOS (transparence utilisateur)
2. **IMPORTANT** : Vérification espace Android
3. **SOUHAITABLE** : Chargement à la demande
4. **LONG TERME** : App native iOS

---

**Auteur** : Analyse des limites de stockage pour Répét (architecture locale)  
**Date** : Janvier 2025  
**Version** : 2.0.0 (corrigée)