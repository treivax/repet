# Problème callMain de piper_phonemize et Solution

## 📋 Contexte

Le module `piper_phonemize.wasm` est un programme CLI compilé avec Emscripten. Il convertit du texte en phonèmes IPA en utilisant espeak-ng.

## 🐛 Problème Identifié

### Symptômes

Lors de l'utilisation de Piper Native Provider, des erreurs de phonemization apparaissent :

```
[PiperPhonemizer] Erreur lors de la phonemization: 404048
[PiperPhonemizer] Erreur lors de la phonemization: 391560
[PiperPhonemizer] Erreur lors de la phonemization: 392136
```

Ces codes d'erreur (dans la plage ~390k-410k) sont en réalité des **pointeurs mémoire** lancés comme exceptions C++, et non des codes de sortie valides.

### Cause Racine

**`callMain()` lance une exception C++ au lieu de retourner un code de sortie.**

Le programme `piper_phonemize` est compilé en C++ et utilise des exceptions. Lorsque le programme termine (avec succès ou échec), il lance une exception pour signaler la fin de l'exécution. Cette exception contient un pointeur mémoire (ex: `404048`) au lieu d'un code de sortie traditionnel.

**De plus**, `callMain()` ne peut être appelé qu'une seule fois par instance de module Emscripten :
- Le programme est considéré comme "terminé" après le premier appel
- Les appels suivants retournent des valeurs aléatoires (adresses mémoire)

### Pourquoi des exceptions avec des pointeurs ?

`piper_phonemize` est un programme C++ compilé avec Emscripten. En C++, il utilise probablement :
1. `exit()` ou `throw` pour terminer le programme
2. Emscripten convertit cela en une exception JavaScript
3. L'exception contient un pointeur mémoire (adresse de l'objet d'exception C++)
4. Ce pointeur apparaît comme `404048`, `391560`, etc.

**Important** : Même si une exception est lancée, le fichier de sortie peut avoir été créé avec succès avant la terminaison du programme.

## ✅ Solution Implémentée

### Approche 1 : Ignorer l'Exception et Vérifier le Fichier (Solution Actuelle)

Nous créons une **nouvelle instance du module pour chaque phonemization** et **ignorons l'exception** lancée par `callMain()`, car le fichier de sortie est quand même créé correctement.

```typescript
async textToPhonemes(text: string, voice: string = 'fr'): Promise<string> {
  // Créer une nouvelle instance pour chaque appel
  const module = await this.createModule()
  
  try {
    // callMain lance une exception (attendu)
    module.callMain(args)
  } catch (error) {
    // Ignorer l'exception - le fichier peut être créé malgré tout
    console.warn('Exception capturée (attendu):', error)
  }
  
  // Vérifier si le fichier de sortie existe (vraie vérification de succès)
  const outputExists = module.FS.analyzePath(outputPath).exists
  if (!outputExists) {
    throw new Error('Fichier de sortie non créé')
  }
  
  // Lire et retourner le résultat
  const phonemes = module.FS.readFile(outputPath, { encoding: 'utf8' })
  return phonemes.trim()
}
```

#### Avantages
- ✅ Fonctionne de manière fiable malgré l'exception
- ✅ Chaque appel est isolé (pas de state partagé)
- ✅ Pas de modification du code WASM nécessaire
- ✅ Implémentation simple et robuste
- ✅ Le fichier de sortie est créé correctement avant l'exception

#### Inconvénients
- ⚠️ Overhead de création du module (~50-200ms par appel)
- ⚠️ Chargement du fichier `.data` (18MB) à chaque fois (mais depuis le cache HTTP)
- ⚠️ Consommation mémoire plus élevée pendant la phonemization
- ⚠️ Exception dans les logs (mais attendue et ignorée)

### Approche 2 : Patch Emscripten (Non Implémentée)

Recompiler `piper_phonemize` avec des flags Emscripten pour permettre les appels multiples :

```bash
emcc ... \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXIT_RUNTIME=0  # ← Permet de ne pas "terminer" le programme
```

#### Avantages
- ✅ Performances optimales
- ✅ Une seule instance réutilisable

#### Inconvénients
- ❌ Nécessite recompilation du WASM
- ❌ Setup Emscripten complexe
- ❌ Maintenance du build custom
- ❌ Risques de bugs avec espeak-ng (variables globales, state)

### Approche 3 : Bibliothèque C (Idéale à Long Terme)

Créer une interface de bibliothèque au lieu d'un CLI :

```c
// Au lieu de main(argc, argv)
EMSCRIPTEN_KEEPALIVE
char* phonemize_text(const char* text, const char* voice) {
  // ...
  return phonemes;
}
```

Puis exposer via `cwrap` :

```typescript
const phonemize = module.cwrap('phonemize_text', 'string', ['string', 'string'])
const result = phonemize("Bonjour", "fr")
```

#### Avantages
- ✅ Performances optimales
- ✅ API propre et réutilisable
- ✅ Pas de limitation sur le nombre d'appels

#### Inconvénients
- ❌ Nécessite fork et modification de piper_phonemize
- ❌ Gestion mémoire manuelle (malloc/free)
- ❌ Maintenance à long terme

## 🔍 Détails d'Implémentation

### Chargement du Fichier .data

Le fichier `piper_phonemize.data` (18MB) contient le système de fichiers virtuel avec `espeak-ng-data`. 

Emscripten le charge automatiquement lors de la création du module :

```typescript
const module = await createPiperPhonemize({
  locateFile: (path) => {
    if (path.endsWith('.data')) {
      return '/wasm/piper_phonemize.data'
    }
    return path
  }
})
```

Le fichier est chargé depuis le cache HTTP du navigateur après le premier téléchargement.

### Attente du Système de Fichiers

Nous devons attendre que le fichier `.data` soit complètement chargé et monté :

```typescript
await new Promise<void>((resolve, reject) => {
  const check = () => {
    if (!module.FS) {
      setTimeout(check, 50)
      return
    }
    
    const espeakPath = module.FS.analyzePath('/espeak-ng-data')
    if (!espeakPath.exists) {
      setTimeout(check, 50)
      return
    }
    
    resolve()
  }
  check()
})
```

## 📊 Benchmarks

### Performances Mesurées (Chrome 120, Linux)

| Opération | Temps | Notes |
|-----------|-------|-------|
| Chargement script initial | ~100ms | Une seule fois au démarrage |
| Création module (première fois) | ~300ms | Téléchargement .data |
| Création module (cache) | ~80-150ms | .data depuis cache HTTP |
| Phonemization | ~5-15ms | Dépend de la longueur du texte |
| **Total par appel (cache)** | **~100-180ms** | Acceptable pour TTS |

### Optimisations Possibles

1. **Pool de modules pré-créés** : Créer 2-3 instances en avance
2. **Web Worker** : Créer les modules dans un worker dédié
3. **Streaming .data** : Charger partiellement selon la langue utilisée
4. **Service Worker** : Précacher le .data

## 🧪 Tests

Un fichier de test HTML standalone est disponible pour diagnostiquer les problèmes :

```bash
# Copier dans public/
cp scripts/test-phonemize/test.html public/test-phonemize.html

# Démarrer le serveur de dev
npm run dev

# Ouvrir http://localhost:5173/test-phonemize.html
```

Le test permet de :
- Vérifier le chargement du module
- Inspecter le système de fichiers
- Tester la phonemization avec différents textes
- Observer les logs détaillés

## 📝 Recommandations

### Court Terme (Actuel)
✅ Utiliser l'approche "module par appel" pour la fiabilité

### Moyen Terme
- [ ] Implémenter un pool de modules pré-créés
- [ ] Mesurer l'impact performance en production
- [ ] Optimiser le cache du .data

### Long Terme
- [ ] Évaluer le fork de piper_phonemize avec API bibliothèque
- [ ] Ou migrer vers une solution de phonemization pure JS
- [ ] Ou contribuer upstream pour exposer une API réutilisable

## 🔗 Références

- [Emscripten callMain Documentation](https://emscripten.org/docs/api_reference/module.html#Module.callMain)
- [Emscripten EXIT_RUNTIME](https://emscripten.org/docs/api_reference/module.html#Module.noExitRuntime)
- [Piper Phonemize Source](https://github.com/rhasspy/piper-phonemize)
- [espeak-ng](https://github.com/espeak-ng/espeak-ng)

## 🐛 Troubleshooting

### "Échec de la phonemization: 404048" ou "Exception: 404048"
- ✅ Exception C++ attendue - le programme fonctionne correctement
- ✅ Le fichier de sortie est créé malgré l'exception
- ✅ L'exception est capturée et ignorée
- ✅ Résolu par la vérification du fichier de sortie au lieu du code de sortie

### "Timeout: /espeak-ng-data non monté"
- Vérifier que `/wasm/piper_phonemize.data` est accessible
- Vérifier la console réseau (fichier doit faire ~18MB)
- Vider le cache du navigateur

### Performances dégradées
- Vérifier que le .data est bien en cache HTTP (Status 304)
- Considérer l'implémentation d'un pool de modules
- Profiler avec Chrome DevTools Performance

---

## 🎯 Résumé

Le problème de phonemization avec `piper_phonemize.wasm` est **résolu** :

1. **Problème** : `callMain()` lance une exception C++ (pointeur mémoire)
2. **Cause** : Programme C++ qui utilise `exit()` ou exceptions pour terminer
3. **Solution** : Ignorer l'exception et vérifier si le fichier de sortie existe
4. **Résultat** : ✅ Phonemization fonctionnelle et fiable

**Auteurs** : Équipe Répét  
**Date** : Janvier 2025  
**Version** : 1.1 (Solution finale avec gestion d'exception)