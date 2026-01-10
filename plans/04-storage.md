# 🚀 Prompt 04 : Stockage Local (IndexedDB avec Dexie.js)

**Durée estimée** : ~1h30 | **Dépend de** : Prompts 01-02

---

## ⚠️ PRÉREQUIS OBLIGATOIRE

**AVANT D'EXÉCUTER CE PROMPT**, charge le fichier `.github/prompts/common.md` dans ton contexte.

Ce fichier contient TOUS les standards du projet (TypeScript, React, architecture, conventions).
Sans lui, tu ne pourras pas respecter les exigences du projet.

---

## 📋 Contexte

Tu vas créer la **couche de stockage local** avec IndexedDB via Dexie.js pour persister les pièces de théâtre et les paramètres utilisateur.

IndexedDB permet de stocker des données structurées côté client sans limite de taille (contrairement à localStorage).

**Standards** : Respecte `.github/prompts/common.md` (déjà chargé en prérequis)

### Principes clés à respecter

- ✅ Code simple et lisible (pas de sur-ingénierie)
- ✅ TypeScript strict (pas de `any`, typage complet)
- ✅ Gestion d'erreurs explicite (try-catch + messages clairs)
- ✅ Documentation inline (JSDoc pour fonctions publiques)
- ✅ API repository simple et cohérente
- ❌ PAS de logique métier dans le storage (séparation stricte)
- ❌ PAS d'accès direct à Dexie en dehors de database.ts

---

## 🎯 Objectifs

1. Configurer Dexie.js pour créer la base de données IndexedDB
2. Créer un repository pour les pièces (CRUD complet)
3. Créer un repository pour les paramètres (get/update)
4. Initialiser les paramètres par défaut au premier lancement
5. Gérer les erreurs de stockage de manière explicite

---

## 📦 Tâches

### 1. Configuration de la Base de Données

#### Fichier : `src/core/storage/database.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import Dexie, { Table } from 'dexie';
import { Play } from '../models/Play';
import { Settings, DEFAULT_SETTINGS } from '../models/Settings';

/**
 * Base de données IndexedDB pour Répét
 */
export class RepetDatabase extends Dexie {
  /** Table des pièces de théâtre */
  plays!: Table<Play, string>;

  /** Table des paramètres */
  settings!: Table<Settings, string>;

  constructor() {
    super('RepetDB');

    // Version 1 du schéma
    this.version(1).stores({
      plays: 'id, title, createdAt, updatedAt',
      settings: 'id',
    });
  }
}

/**
 * Instance singleton de la base de données
 */
export const db = new RepetDatabase();

/**
 * Initialise la base de données (paramètres par défaut)
 * À appeler au démarrage de l'application
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Vérifier si les paramètres existent
    const existingSettings = await db.settings.get('global');

    if (!existingSettings) {
      // Créer les paramètres par défaut
      await db.settings.add(DEFAULT_SETTINGS);
      console.log('Base de données initialisée avec paramètres par défaut');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw new Error(
      `Impossible d'initialiser la base de données : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    );
  }
}
```

---

### 2. Repository des Pièces

#### Fichier : `src/core/storage/plays.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { db } from './database';
import { Play } from '../models/Play';

/**
 * Repository pour la gestion des pièces de théâtre
 */
export const playsRepository = {
  /**
   * Récupère toutes les pièces, triées par date de création décroissante
   *
   * @returns Liste des pièces
   */
  async getAll(): Promise<Play[]> {
    try {
      const plays = await db.plays.orderBy('createdAt').reverse().toArray();
      return plays;
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces:', error);
      throw new Error(
        `Impossible de récupérer les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Récupère une pièce par son ID
   *
   * @param id - Identifiant unique de la pièce
   * @returns La pièce ou undefined si non trouvée
   */
  async get(id: string): Promise<Play | undefined> {
    try {
      const play = await db.plays.get(id);
      return play;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la pièce ${id}:`, error);
      throw new Error(
        `Impossible de récupérer la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Ajoute une nouvelle pièce
   *
   * @param play - Pièce à ajouter
   * @returns ID de la pièce ajoutée
   */
  async add(play: Play): Promise<string> {
    try {
      const now = new Date();
      const playWithDates: Play = {
        ...play,
        createdAt: now,
        updatedAt: now,
      };

      await db.plays.add(playWithDates);
      console.log(`Pièce "${play.title}" ajoutée avec succès`);
      return play.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la pièce:', error);
      throw new Error(
        `Impossible d'ajouter la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Met à jour une pièce existante
   *
   * @param id - ID de la pièce à mettre à jour
   * @param changes - Modifications à appliquer
   * @returns Nombre de lignes modifiées (1 si succès, 0 si non trouvée)
   */
  async update(id: string, changes: Partial<Play>): Promise<number> {
    try {
      const updated = await db.plays.update(id, {
        ...changes,
        updatedAt: new Date(),
      });

      if (updated) {
        console.log(`Pièce ${id} mise à jour avec succès`);
      }

      return updated;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la pièce ${id}:`, error);
      throw new Error(
        `Impossible de mettre à jour la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Supprime une pièce
   *
   * @param id - ID de la pièce à supprimer
   */
  async delete(id: string): Promise<void> {
    try {
      await db.plays.delete(id);
      console.log(`Pièce ${id} supprimée avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la pièce ${id}:`, error);
      throw new Error(
        `Impossible de supprimer la pièce : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Supprime toutes les pièces (utilisé pour les tests ou réinitialisation)
   */
  async deleteAll(): Promise<void> {
    try {
      await db.plays.clear();
      console.log('Toutes les pièces ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les pièces:', error);
      throw new Error(
        `Impossible de supprimer toutes les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Compte le nombre total de pièces
   *
   * @returns Nombre de pièces
   */
  async count(): Promise<number> {
    try {
      return await db.plays.count();
    } catch (error) {
      console.error('Erreur lors du comptage des pièces:', error);
      throw new Error(
        `Impossible de compter les pièces : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },
};
```

---

### 3. Repository des Paramètres

#### Fichier : `src/core/storage/settings.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import { db } from './database';
import { Settings, DEFAULT_SETTINGS } from '../models/Settings';

/**
 * Repository pour la gestion des paramètres de l'application
 */
export const settingsRepository = {
  /**
   * Récupère les paramètres de l'application
   * Crée les paramètres par défaut s'ils n'existent pas
   *
   * @returns Paramètres de l'application
   */
  async get(): Promise<Settings> {
    try {
      let settings = await db.settings.get('global');

      if (!settings) {
        // Créer les paramètres par défaut
        await db.settings.add(DEFAULT_SETTINGS);
        settings = DEFAULT_SETTINGS;
        console.log('Paramètres par défaut créés');
      }

      return settings;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      throw new Error(
        `Impossible de récupérer les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Met à jour les paramètres de l'application
   *
   * @param changes - Modifications à appliquer
   * @returns Paramètres mis à jour
   */
  async update(changes: Partial<Settings>): Promise<Settings> {
    try {
      await db.settings.update('global', changes);
      const updated = await db.settings.get('global');

      if (!updated) {
        throw new Error('Paramètres introuvables après mise à jour');
      }

      console.log('Paramètres mis à jour avec succès');
      return updated;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw new Error(
        `Impossible de mettre à jour les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },

  /**
   * Réinitialise les paramètres aux valeurs par défaut
   *
   * @returns Paramètres réinitialisés
   */
  async reset(): Promise<Settings> {
    try {
      await db.settings.put(DEFAULT_SETTINGS);
      console.log('Paramètres réinitialisés aux valeurs par défaut');
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres:', error);
      throw new Error(
        `Impossible de réinitialiser les paramètres : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  },
};
```

---

### 4. Index du Storage

#### Fichier : `src/core/storage/index.ts`

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

export { db, initializeDatabase } from './database';
export { playsRepository } from './plays';
export { settingsRepository } from './settings';
```

---

### 5. Initialisation dans main.tsx

#### Modifier : `src/main.tsx`

Ajouter l'initialisation de la base de données :

```typescript
/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import { initializeDatabase } from './core/storage';

// Initialiser la base de données
initializeDatabase()
  .then(() => {
    console.log('Base de données prête');
  })
  .catch((error) => {
    console.error('Erreur fatale lors de l\'initialisation:', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## ✅ Critères de Validation

**Avant de passer au prompt suivant, valider :**

```bash
npm run type-check  # DOIT retourner 0 erreur
npm run dev         # DOIT démarrer sans erreur
```

### Tests manuels dans la console navigateur

Ouvrir la console (F12) et tester les opérations :

```javascript
import { playsRepository, settingsRepository } from './core/storage';

// Test 1 : Vérifier les paramètres par défaut
const settings = await settingsRepository.get();
console.log('Paramètres:', settings);
// Doit afficher : theme: "light", voiceOff: true, etc.

// Test 2 : Mettre à jour un paramètre
await settingsRepository.update({ theme: 'dark' });
const updated = await settingsRepository.get();
console.log('Thème mis à jour:', updated.theme); // "dark"

// Test 3 : Créer une pièce de test
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

await playsRepository.add(testPlay);
const plays = await playsRepository.getAll();
console.log('Nombre de pièces:', plays.length); // 1

// Test 4 : Récupérer la pièce
const retrieved = await playsRepository.get(testPlay.id);
console.log('Pièce récupérée:', retrieved?.title); // "Pièce de Test"

// Test 5 : Mettre à jour la pièce
await playsRepository.update(testPlay.id, { title: 'Nouveau Titre' });
const updated2 = await playsRepository.get(testPlay.id);
console.log('Titre mis à jour:', updated2?.title); // "Nouveau Titre"

// Test 6 : Supprimer la pièce
await playsRepository.delete(testPlay.id);
const count = await playsRepository.count();
console.log('Nombre de pièces après suppression:', count); // 0
```

### Vérification dans DevTools

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Application** (ou **Storage**)
3. Section **IndexedDB** → **RepetDB**
4. Vérifier les tables `plays` et `settings`
5. Vérifier que `settings` contient une entrée `id: "global"`

### Checklist de validation

- [ ] Fichiers créés sans erreurs TypeScript
- [ ] Aucun type `any` utilisé
- [ ] JSDoc présent sur toutes les fonctions publiques
- [ ] Imports/exports fonctionnent correctement
- [ ] Base de données créée (visible dans DevTools)
- [ ] Paramètres par défaut initialisés automatiquement
- [ ] CRUD complet sur pièces fonctionne
- [ ] Get/Update sur paramètres fonctionne
- [ ] Gestion d'erreurs explicite (try-catch)
- [ ] Messages de log clairs
- [ ] Tests manuels dans console réussis
- [ ] Pas d'erreur dans la console navigateur

---

## 📝 Livrables

- [x] `src/core/storage/database.ts`
- [x] `src/core/storage/plays.ts`
- [x] `src/core/storage/settings.ts`
- [x] `src/core/storage/index.ts`
- [x] `src/main.tsx` modifié (initialisation DB)
- [x] Tests manuels passés
- [x] Vérification DevTools réussie
- [x] Commit avec message : "feat: add IndexedDB storage layer (Prompt 04)"

---

## 🔗 Liens utiles

- Standards : `.github/prompts/common.md`
- Architecture : `plans/PROJECT_STRUCTURE.md`
- Modèles de données : `src/core/models/`
- Documentation Dexie : https://dexie.org

---

## 📌 Notes importantes

- **Singleton** : Une seule instance de `db` pour toute l'application
- **Initialisation** : `initializeDatabase()` doit être appelée au démarrage
- **Erreurs** : Toujours wrapper les appels Dexie dans try-catch
- **Dates** : `createdAt` et `updatedAt` gérées automatiquement par les repositories
- **ID unique** : Les Play doivent avoir un UUID valide avant insertion
- **Pas de logique métier** : Les repositories ne font que du CRUD

---

## ➡️ Prompt suivant

Après validation complète : **Prompt 05 - Text-to-Speech Engine**