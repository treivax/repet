# 📚 Exemples d'utilisation

Ce dossier contient des exemples d'utilisation des modèles et types de Répét.

## Fichiers

### `models-usage.ts`

Exemples complets d'utilisation des modèles de données créés dans le Prompt 02.

**Contenu** :
1. Création de personnages avec `createCharacter()`
2. Création de segments de texte (texte et didascalies)
3. Création de nœuds de contenu (répliques, didascalies, scènes, actes)
4. Création d'une pièce complète
5. Utilisation des type guards (`isActNode`, `isSceneNode`, etc.)
6. Gestion des paramètres avec `Settings` et `DEFAULT_SETTINGS`
7. Recherche et filtrage dans l'AST
8. Validation de la structure d'une pièce

**Comment utiliser** :

```bash
# Transpiler et exécuter (si ts-node est installé)
npx ts-node examples/models-usage.ts

# Ou importer dans votre code
import { hamlet, play } from '../examples/models-usage';
```

## Notes

- Ces fichiers sont **uniquement à titre d'exemple** et de documentation
- Ils ne sont **pas inclus** dans le bundle de production
- Ils servent de référence pour comprendre comment utiliser les modèles
- Utiles pour tester manuellement les types et interfaces

## Prochaines étapes

D'autres exemples seront ajoutés au fur et à mesure des prompts suivants :
- Exemples de parsing (Prompt 03)
- Exemples de stockage IndexedDB (Prompt 04)
- Exemples de TTS (Prompt 05)
- Exemples de state management (Prompt 07)

---

**Licence** : MIT  
**Copyright** : 2025 Répét Contributors