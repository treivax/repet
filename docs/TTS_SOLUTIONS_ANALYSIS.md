# Analyse des Solutions TTS pour Répét

**Date** : Janvier 2025  
**Contexte** : Limitation des voix disponibles via Web Speech API sur Linux et Android  
**Contraintes** : SPA/PWA, pas de backend requis, budget limité, support hors ligne souhaitable

---

## 🎯 Problématique

### Situation Actuelle

**Web Speech API** (solution actuelle) :
- ✅ Gratuit, natif, hors ligne
- ❌ **1-2 voix seulement** sur Linux Desktop
- ❌ **1-2 voix seulement** sur Android Chrome
- ❌ Qualité variable selon le système
- ❌ Pas d'API unifiée pour installer des voix supplémentaires

### Besoins

1. **Plus de voix françaises** disponibles
2. **Qualité acceptable** pour usage théâtral
3. **Fonctionnement en PWA/SPA** (pas de serveur obligatoire)
4. **Coût raisonnable** (idéalement gratuit ou très faible)
5. **Support hors ligne** (optionnel mais souhaitable)

---

## 📊 Solutions Analysées

### 1. Services Cloud TTS

#### 1.1 Google Cloud Text-to-Speech

**Description** : API cloud de Google avec voix WaveNet et Neural2

**Avantages** :
- ✅ Excellente qualité (voix très naturelles)
- ✅ Nombreuses voix françaises (fr-FR, fr-CA)
- ✅ Quota gratuit : 1 million de caractères/mois
- ✅ API REST simple à intégrer
- ✅ Support SSML pour contrôle fin

**Inconvénients** :
- ❌ Nécessite connexion internet
- ❌ Payant au-delà du quota ($4-$16/1M caractères selon qualité)
- ❌ Nécessite API key (sécurité à gérer)
- ❌ Latence réseau

**Coût estimé** :
- Pièce moyenne : 20 000 caractères
- 50 lectures = 1M caractères = **GRATUIT**
- Au-delà : ~$0.08 par lecture complète

**Implémentation** :
```typescript
// L'utilisateur fournit sa propre API key
const response = await fetch(
  'https://texttospeech.googleapis.com/v1/text:synthesize',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': userApiKey
    },
    body: JSON.stringify({
      input: { text: lineText },
      voice: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
      audioConfig: { audioEncoding: 'MP3' }
    })
  }
)
```

**Sécurité** :
- Option 1 : L'utilisateur fournit sa propre API key (stockée localement)
- Option 2 : Backend proxy Répét (nécessite serveur)
- Option 3 : API key avec restrictions (domaine, quota)

---

#### 1.2 Amazon Polly

**Description** : Service TTS d'AWS avec voix Neural

**Avantages** :
- ✅ Bonne qualité
- ✅ Voix Neural disponibles
- ✅ 5 millions de caractères/mois gratuits (12 premiers mois)

**Inconvénients** :
- ❌ Nécessite connexion internet
- ❌ Credentials AWS complexes à gérer
- ❌ Payant après période gratuite ($4/1M caractères)
- ❌ Pas adapté pour client-side dans SPA

**Verdict** : ❌ Trop complexe pour une PWA sans backend

---

#### 1.3 Microsoft Azure Speech

**Description** : API TTS de Microsoft

**Avantages** :
- ✅ Bonne qualité
- ✅ Nombreuses voix françaises
- ✅ 500 000 caractères/mois gratuits

**Inconvénients** :
- ❌ Nécessite connexion internet
- ❌ Configuration complexe
- ❌ Payant au-delà du quota

**Verdict** : ⚠️ Possible mais moins simple que Google

---

#### 1.4 ElevenLabs

**Description** : Service de voix IA ultra-réalistes

**Avantages** :
- ✅ Qualité exceptionnelle (voix très naturelles)
- ✅ Clonage de voix possible

**Inconvénients** :
- ❌ Très cher ($5-$99/mois)
- ❌ Quota gratuit très limité (10 000 caractères/mois)
- ❌ Overkill pour usage théâtral

**Verdict** : ❌ Trop cher pour l'usage ciblé

---

### 2. Solutions Open Source Self-Hosted

#### 2.1 Coqui TTS (ex-Mozilla TTS)

**Description** : TTS open source de haute qualité

**Avantages** :
- ✅ Open source
- ✅ Excellente qualité
- ✅ Gratuit
- ✅ Modèles français disponibles

**Inconvénients** :
- ❌ Nécessite serveur pour héberger les modèles
- ❌ Modèles très lourds (plusieurs GB)
- ❌ Complexe à déployer et maintenir
- ❌ Coût serveur (CPU/GPU)

**Verdict** : ⚠️ Nécessite infrastructure backend

---

#### 2.2 Piper TTS

**Description** : TTS léger et rapide, successeur spirituel de Mozilla TTS

**Avantages** :
- ✅ Open source (MIT)
- ✅ Très rapide (temps réel sur CPU)
- ✅ Modèles compacts (10-50 MB)
- ✅ Bonne qualité
- ✅ Voix françaises disponibles
- ✅ **Peut être compilé en WebAssembly**

**Inconvénients** :
- ❌ Qualité inférieure aux voix Neural cloud
- ❌ Compilation WASM nécessaire
- ❌ Téléchargement initial des modèles

**Potentiel** : ⭐⭐⭐⭐⭐ **EXCELLENT pour PWA !**

**Implémentation possible** :
```typescript
// 1. Télécharger le modèle une fois (50MB)
// 2. Stocker dans IndexedDB
// 3. Charger Piper WASM
// 4. Générer audio côté client
const audio = await piperWasm.synthesize(text, voiceModel)
```

**Ressources** :
- Repo : https://github.com/rhasspy/piper
- Modèles : https://huggingface.co/rhasspy/piper-voices

---

#### 2.3 eSpeak-NG

**Description** : TTS compact et léger

**Avantages** :
- ✅ Très léger
- ✅ Open source
- ✅ Support français
- ✅ Peut compiler en WASM (speak.js)

**Inconvénients** :
- ❌ Qualité robotique (synthèse formantique)
- ❌ Pas naturel pour usage théâtral

**Verdict** : ❌ Qualité insuffisante

---

### 3. Solutions Hybrides

#### 3.1 Responsive Voice

**Description** : Service commercial avec API simple

**Avantages** :
- ✅ API simple
- ✅ Gratuit pour usage non-commercial
- ✅ Plusieurs voix françaises

**Inconvénients** :
- ❌ Payant pour usage commercial ($39-$199/an)
- ❌ Nécessite connexion internet
- ❌ Latence

**Verdict** : ⚠️ Option viable si budget disponible

---

#### 3.2 Audio Pré-généré + Cache

**Description** : Générer l'audio à la demande et le mettre en cache

**Avantages** :
- ✅ Pas de régénération après cache
- ✅ Lecture instantanée après cache
- ✅ Fonctionne hors ligne après cache

**Inconvénients** :
- ❌ Nécessite génération initiale (cloud TTS)
- ❌ Stockage important (IndexedDB)
- ❌ Invalide si texte modifié

**Verdict** : ✅ **Excellente stratégie complémentaire**

---

### 4. Solutions WebAssembly Côté Client

#### 4.1 Piper-WASM (recommandé)

**Description** : Piper compilé en WebAssembly pour exécution navigateur

**Architecture** :
```
User                 IndexedDB           WASM Module
  |                     |                     |
  |--Download Model---->|                     |
  |                     |                     |
  |--Request TTS------->|--Load Model-------->|
  |                     |                     |
  |                     |<---Synthesize-------|
  |<---Play Audio-------|                     |
```

**Avantages** :
- ✅ Totalement gratuit
- ✅ Fonctionne hors ligne
- ✅ Pas de serveur requis
- ✅ Pas de coût d'API
- ✅ Basse latence (local)
- ✅ Confidentialité (pas de données envoyées)
- ✅ Compatible PWA/SPA

**Inconvénients** :
- ⚠️ Téléchargement initial modèle (20-50 MB par voix)
- ⚠️ Performance dépend de l'appareil
- ⚠️ Qualité inférieure aux voix cloud Neural

**Faisabilité** :
- Piper peut être compilé avec Emscripten
- ONNX Runtime supporte WebAssembly
- Exemples existants : https://github.com/rhasspy/piper

**Effort de développement** :
- Moyen/Élevé (compilation WASM, intégration)
- Proof of concept : 1-2 semaines
- Production ready : 3-4 semaines

---

#### 4.2 Sherpa-ONNX WASM

**Description** : Framework TTS basé sur ONNX Runtime

**Avantages** :
- ✅ ONNX Runtime officiel supporte WASM
- ✅ Modèles compacts
- ✅ Bonne performance

**Inconvénients** :
- ⚠️ Documentation limitée
- ⚠️ Moins mature que Piper

**Verdict** : ⚠️ Alternative à Piper, moins documenté

---

## 🎯 Recommandations pour Répét

### Solution Hybride Progressive (recommandée)

**Phase 1 : Court terme (1-2 semaines)**

Ajouter **Google Cloud TTS en option** :

1. Garder Web Speech API par défaut
2. Ajouter option "Voix Premium (Google Cloud)"
3. L'utilisateur fournit sa propre API key
4. Mettre en cache les audios générés (IndexedDB)

**UI proposée** :
```
Paramètres Audio
├─ Mode TTS
│  ├─ ○ Voix Système (gratuit, hors ligne)
│  └─ ● Voix Premium (Google Cloud)
│
└─ [Si Voix Premium sélectionné]
   ├─ API Key Google Cloud : [__________]
   ├─ ℹ️ Obtenez une clé gratuite sur console.cloud.google.com
   └─ Quota : 1M caractères/mois gratuit
```

**Avantages** :
- ✅ Rapide à implémenter
- ✅ Donne le choix à l'utilisateur
- ✅ Pas de coût pour Répét
- ✅ Cache = usage hors ligne après génération

**Inconvénients** :
- ⚠️ L'utilisateur doit créer un compte Google Cloud
- ⚠️ Configuration technique requise

---

**Phase 2 : Moyen terme (1-2 mois)**

Intégrer **Piper-WASM** :

1. Compiler Piper en WebAssembly
2. Créer package npm `@repet/piper-wasm`
3. Télécharger modèles vocaux à la demande
4. Stocker dans IndexedDB

**UI proposée** :
```
Paramètres Audio
├─ Mode TTS
│  ├─ ○ Voix Système (gratuit, hors ligne)
│  ├─ ○ Voix Premium (Google Cloud)
│  └─ ● Voix Hors-Ligne (Piper)
│
└─ [Si Piper sélectionné]
   ├─ Voix disponibles :
   │  ├─ □ Française Femme 1 (25 MB) [Télécharger]
   │  ├─ ✓ Française Femme 2 (30 MB) [Téléchargé]
   │  └─ □ Française Homme 1 (28 MB) [Télécharger]
   └─ Stockage utilisé : 30 MB / 500 MB
```

**Avantages** :
- ✅ Totalement gratuit
- ✅ Hors ligne complet
- ✅ Aucune API key nécessaire
- ✅ Confidentialité maximale
- ✅ Meilleure UX que Web Speech API

**Inconvénients** :
- ⚠️ Effort de développement significatif
- ⚠️ Téléchargement initial requis

---

**Phase 3 : Long terme (optionnel)**

Backend Répét avec quota gratuit :

1. Héberger service TTS (Piper ou Coqui)
2. Offrir quota gratuit généreux
3. Monétisation pour usage intensif

**Modèle économique** :
- Gratuit : 100 000 caractères/mois
- Pro : $5/mois = 1M caractères
- Premium : $15/mois = illimité

---

### Comparaison des Solutions

| Solution | Coût | Qualité | Hors ligne | Effort dev | Recommandé |
|----------|------|---------|------------|------------|------------|
| Web Speech API (actuel) | Gratuit | ⭐⭐ | ✅ | Aucun | ⚠️ Limité |
| Google Cloud TTS | $0-4/1M | ⭐⭐⭐⭐⭐ | ❌ | Faible | ✅ Phase 1 |
| Piper-WASM | Gratuit | ⭐⭐⭐⭐ | ✅ | Moyen | ⭐ Phase 2 |
| Coqui Self-hosted | Variable | ⭐⭐⭐⭐⭐ | ❌ | Élevé | ⚠️ Phase 3 |
| Responsive Voice | $39+/an | ⭐⭐⭐ | ❌ | Faible | ❌ |
| ElevenLabs | $5-99/mois | ⭐⭐⭐⭐⭐ | ❌ | Faible | ❌ Trop cher |

---

## 🚀 Plan d'Action Recommandé

### Étape 1 : Google Cloud TTS (2 semaines)

**Objectifs** :
- Offrir des voix de qualité immédiatement
- Validation du besoin utilisateur
- Pas de coût d'infrastructure

**Tâches** :
1. Créer service `GoogleCloudTTSService`
2. Ajouter UI pour saisie API key
3. Implémenter cache audio (IndexedDB)
4. Documentation pour obtenir API key
5. Tests sur différents navigateurs

**Résultat attendu** :
- 10-20 voix françaises disponibles
- Qualité excellente
- Solution opérationnelle

---

### Étape 2 : Piper-WASM (1-2 mois)

**Objectifs** :
- Solution gratuite et hors ligne
- Indépendance totale des services cloud
- Meilleure UX que Web Speech API

**Tâches** :
1. POC : Compiler Piper en WASM
2. Intégrer ONNX Runtime WASM
3. Télécharger et tester modèles français
4. Créer service `PiperWASMService`
5. Implémenter gestion des modèles (download, cache)
6. UI pour sélection et téléchargement voix
7. Benchmark performance
8. Tests sur différents appareils

**Résultat attendu** :
- 3-5 voix françaises hors ligne
- Qualité correcte (⭐⭐⭐⭐)
- Fonctionne sans connexion

---

### Étape 3 : Optimisations (continu)

- Cache intelligent (pré-génération des répliques fréquentes)
- Compression audio (MP3 vs OGG vs Opus)
- Lazy loading des modèles
- UI/UX pour gestion du stockage
- Analytics d'utilisation (quelle solution est préférée ?)

---

## 📝 Références

### Google Cloud TTS
- Docs : https://cloud.google.com/text-to-speech/docs
- Pricing : https://cloud.google.com/text-to-speech/pricing
- Console : https://console.cloud.google.com/

### Piper TTS
- Repo : https://github.com/rhasspy/piper
- Modèles : https://huggingface.co/rhasspy/piper-voices
- Demo : https://rhasspy.github.io/piper-samples/

### ONNX Runtime Web
- Docs : https://onnxruntime.ai/docs/tutorials/web/
- WebAssembly : https://onnxruntime.ai/docs/build/web.html

### Exemples TTS en WASM
- speak.js : https://github.com/kripken/speak.js/
- flite.js : https://github.com/11factory/flite.js

---

## ✅ Conclusion

**Solution recommandée** : **Approche hybride progressive**

1. **Court terme** : Google Cloud TTS (API key utilisateur)
   - Résout le problème immédiatement
   - Excellent rapport qualité/effort
   - Valide le besoin

2. **Moyen terme** : Piper-WASM
   - Solution pérenne et gratuite
   - Autonomie complète
   - Meilleure expérience utilisateur

3. **Long terme** : Backend optionnel si demande
   - Monétisation possible
   - Service managé pour utilisateurs non-techniques

Cette approche permet de :
- ✅ Résoudre le problème rapidement
- ✅ Rester dans l'esprit PWA/SPA
- ✅ Minimiser les coûts
- ✅ Maximiser la flexibilité utilisateur
- ✅ Construire une solution pérenne

---

**Licence** : MIT  
**Copyright** : 2025 Répét Contributors