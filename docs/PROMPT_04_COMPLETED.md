# Prompt 04 : Stockage Local (IndexedDB avec Dexie.js) - ✅ TERMINÉ

**Date de complétion** : 2025-01-XX  
**Durée estimée** : ~1h30  
**Durée réelle** : ~1h

---

## 📋 Résumé

La couche de stockage local avec IndexedDB via Dexie.js a été implémentée avec succès. Elle permet de persister les pièces de théâtre et les paramètres utilisateur côté client de manière fiable et performante.

---

## ✅ Livrables créés

### Fichiers principaux

- ✅ `src/core/storage/database.ts` - Configuration Dexie et initialisation DB
- ✅ `src/core/storage/plays.ts` - Repository CRUD pour les pièces
- ✅ `src/core/storage/settings.ts` - Repository pour les paramètres
- ✅ `src/core/storage/index.ts` - Exports centralisés

### Fichiers modifiés

- ✅ `src/main.tsx` - Ajout de l'initialisation de la base de données au démarrage

---

## 🎯 Fonctionnalités implémentées

### 1. Configuration de la base de données

**Classe `RepetDatabase`** :
- Hérite de `Dexie`
- Définit 2 tables : `plays` et `settings`
- Schema version 1 avec index appropriés
- Instance singleton exportée (`db`)

**Fonction `initializeDatabase()`** :
- Vérifie l'existence des paramètres
- Crée les paramètres par défaut si absents
- Gestion d'erreurs explicite
- Appelée automatiquement au démarrage de l'application

### 2. Repository des pièces (`playsRepository`)

API complète pour la gestion des pièces :

#### `getAll(): Promise<Play[]>`
- Récupère toutes les pièces
- Tri par date de création décroissante (plus récentes en premier)
- Gestion d'erreurs avec messages clairs

#### `get(id: string): Promise<Play | undefined>`
- Récupère une pièce par son ID
- Retourne `undefined` si non trouvée
- Gestion d'erreurs

#### `add(play: Play): Promise<string>`
- Ajoute une nouvelle pièce
- Injecte automatiquement `createdAt` et `updatedAt`
- Retourne l'ID de la pièce ajoutée
- Gestion d'erreurs

#### `update(id: string, changes: Partial<Play>): Promise<number>`
- Met à jour une pièce existante
- Récupère d'abord la pièce, fusionne les changements, puis `put`
- Met à jour automatiquement `updatedAt`
- Retourne 1 si succès, 0 si non trouvée
- Solution pour éviter les erreurs de types circulaires avec Dexie

#### `delete(id: string): Promise<void>`
- Supprime une pièce par ID
- Gestion d'erreurs

#### `deleteAll(): Promise<void>`
- Supprime toutes les pièces (pour tests/réinitialisation)
- Utilise `clear()` de Dexie
- Gestion d'erreurs

#### `count(): Promise<number>`
- Retourne le nombre total de pièces
- Gestion d'erreurs

### 3. Repository des paramètres (`settingsRepository`)

API pour la gestion des paramètres globaux :

#### `get(): Promise<Settings>`
- Récupère les paramètres globaux (ID: "global")
- Crée automatiquement les paramètres par défaut si absents
- Gestion d'erreurs

#### `update(changes: Partial<Settings>): Promise<Settings>`
- Met à jour les paramètres
- Retourne les paramètres mis à jour
- Validation (erreur si paramètres introuvables après update)
- Gestion d'erreurs

#### `reset(): Promise<Settings>`
- Réinitialise les paramètres aux valeurs par défaut
- Utilise `put` pour remplacer complètement
- Gestion d'erreurs

### 4. Initialisation automatique

Dans `main.tsx` :
- Appel à `initializeDatabase()` au démarrage
- Gestion d'erreurs avec `console.error`
- N'empêche pas le chargement de l'application (catch silencieux)

---

## 🔍 Validation

### Type-check

```bash
npm run type-check
```

✅ **Résultat** : 0 erreur TypeScript

**Note technique** : Contournement de l'erreur de type circulaire de Dexie dans `plays.update()` en utilisant `get → merge → put` au lieu de `update` directement.

### Linting

```bash
npm run lint
```

✅ **Résultat** : 0 warning, 0 erreur ESLint

**Modifications** : Suppression des `console.log` de succès (seuls `console.error` et `console.warn` sont autorisés par la config ESLint).

### Build production

```bash
npm run build
```

✅ **Résultat** : Build réussi (36 modules, ~243 KB JavaScript)

### Serveur de développement

```bash
npm run dev
```

✅ **Résultat** : Serveur démarre sur http://localhost:5173/

---

## 🧪 Tests manuels recommandés

### Test 1 : Vérification de l'initialisation

Ouvrir DevTools → Application → IndexedDB → RepetDB

- ✅ Base de données `RepetDB` créée
- ✅ Table `plays` présente
- ✅ Table `settings` présente avec entrée `id: "global"`

### Test 2 : CRUD sur pièces (Console navigateur)

```javascript
import { playsRepository } from './core/storage';

// Créer une pièce de test
const testPlay = {
  id: crypto.randomUUID(),
  fileName: 'test.txt',
  title: 'Pièce de Test',
  author: 'Auteur Test',
  characters: [],
  content: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Ajouter
await playsRepository.add(testPlay);

// Récupérer toutes
const plays = await playsRepository.getAll();
console.log('Nombre de pièces:', plays.length); // 1

// Récupérer par ID
const retrieved = await playsRepository.get(testPlay.id);
console.log('Titre:', retrieved?.title); // "Pièce de Test"

// Mettre à jour
await playsRepository.update(testPlay.id, { title: 'Nouveau Titre' });
const updated = await playsRepository.get(testPlay.id);
console.log('Titre mis à jour:', updated?.title); // "Nouveau Titre"

// Compter
const count = await playsRepository.count();
console.log('Nombre:', count); // 1

// Supprimer
await playsRepository.delete(testPlay.id);
const countAfter = await playsRepository.count();
console.log('Nombre après suppression:', countAfter); // 0
```

### Test 3 : Paramètres (Console navigateur)

```javascript
import { settingsRepository } from './core/storage';

// Récupérer (crée les valeurs par défaut si absentes)
const settings = await settingsRepository.get();
console.log('Thème:', settings.theme); // "light"
console.log('Voix off:', settings.voiceOff); // true

// Mettre à jour
const updated = await settingsRepository.update({ theme: 'dark' });
console.log('Nouveau thème:', updated.theme); // "dark"

// Réinitialiser
const reset = await settingsRepository.reset();
console.log('Thème après reset:', reset.theme); // "light"
```

---

## 📊 Statistiques

- **Fichiers créés** : 4
- **Fichiers modifiés** : 1
- **Lignes de code** : ~300 lignes TypeScript
- **Fonctions publiques** : 10 (1 init + 6 plays + 3 settings)
- **Tables IndexedDB** : 2 (plays, settings)

---

## 🔗 Dépendances

- `dexie` (v4.0.11) - ORM pour IndexedDB
- `src/core/models/Play.ts` (Prompt 02)
- `src/core/models/Settings.ts` (Prompt 02)

---

## 📝 Notes techniques

### Choix de conception

1. **Pattern Repository** : Séparation claire entre logique métier et stockage
   - Chaque entité a son repository
   - API cohérente et prévisible
   - Facilite les tests et mocking

2. **Singleton pour DB** : Instance unique `db` exportée
   - Évite les problèmes de connexions multiples
   - Performance optimale
   - Configuration centralisée

3. **Initialisation au démarrage** : Dans `main.tsx`
   - Garantit que la DB est prête avant utilisation
   - Paramètres par défaut créés automatiquement
   - Erreur non bloquante (logged mais n'empêche pas l'app de démarrer)

4. **Timestamps automatiques** : `createdAt` et `updatedAt`
   - Injectés automatiquement par les repositories
   - Cohérence garantie
   - Pas de responsabilité pour l'appelant

5. **Gestion d'erreurs systématique** :
   - Try-catch sur toutes les opérations async
   - Messages d'erreur descriptifs
   - `console.error` pour logging
   - Re-throw avec contexte enrichi

### Problèmes résolus

#### Type circulaire avec Dexie

**Problème** : L'AST récursif (`ContentNode` avec `children`) causait une erreur TypeScript avec `db.plays.update()`.

**Solution** : Utiliser `get → merge → put` au lieu de `update` directement :

```typescript
const existing = await db.plays.get(id);
if (!existing) return 0;

const updated: Play = {
  ...existing,
  ...changes,
  updatedAt: new Date(),
};

await db.plays.put(updated);
return 1;
```

#### Console.log interdit par ESLint

**Problème** : ESLint n'autorise que `console.error` et `console.warn`.

**Solution** : Suppression des logs de succès, conservation uniquement des logs d'erreur.

### Robustesse

- ✅ Gestion d'erreurs explicite sur toutes les opérations
- ✅ Messages d'erreur contextuels
- ✅ Validation des données (ex: settings introuvables après update)
- ✅ Création automatique des paramètres par défaut
- ✅ Type-safety complet (pas de `any` sauf cast nécessaire pour Dexie)

### Performance

- ✅ Index sur `id`, `title`, `createdAt`, `updatedAt` pour les pièces
- ✅ Tri côté DB avec `orderBy()` (pas en mémoire)
- ✅ Opérations atomiques avec Dexie
- ✅ Pas de chargement inutile (lazy loading possible)

---

## 🚀 Prochaines étapes

La couche de stockage est maintenant opérationnelle et prête pour l'intégration.

**Prompt suivant** : Prompt 05 - Text-to-Speech Engine

---

## ✅ Checklist finale

- [x] Tous les fichiers créés
- [x] Copyright headers présents
- [x] JSDoc sur fonctions publiques
- [x] Type-check passe (0 erreur)
- [x] Lint passe (0 warning)
- [x] Build production réussit
- [x] Serveur dev démarre
- [x] Gestion d'erreurs explicite
- [x] Aucun `console.log` (seulement `console.error`)
- [x] API Repository cohérente
- [x] Initialisation DB au démarrage
- [x] Paramètres par défaut créés automatiquement
- [x] Tests manuels possibles dans DevTools
- [x] Documentation complète