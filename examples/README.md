# 📚 Exemples d'utilisation

Ce dossier contient des exemples d'utilisation des modèles et types de Répét, ainsi que des exemples de fichiers texte au format théâtral.

## Fichiers

### Exemples de Code

#### `models-usage.ts`

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

### Exemples de Fichiers Texte

Ces fichiers illustrent les différents formats acceptés par le parser de Répét.

#### `ALEGRIA.txt`

Fichier de test principal utilisé pour valider le parser. Contient une pièce complète avec actes, scènes, répliques et didascalies au format classique (avec deux-points).

#### `format-sans-deux-points.txt`

**Exemple du nouveau format de répliques sans deux-points.**

Illustre le format où les noms de personnages ne sont pas suivis de `:` mais doivent être :
- Précédés d'une ligne vierge
- En MAJUSCULES
- Sans indentation (début de ligne)
- Peuvent être des noms composés (ex: `LE PETIT CHAPERON ROUGE`, `MARIE-ANTOINETTE`)

**Extrait** :
```
LE PETIT CHAPERON ROUGE
Quelle belle journée pour aller voir mère-grand !
Je vais lui apporter cette galette et ce petit pot de beurre.

LE LOUP
Bonjour, ma petite demoiselle.
Où allez-vous donc si tôt ce matin ?
```

#### `format-mixte.txt`

**Exemple mélant les deux formats dans le même fichier.**

Démontre que les formats avec et sans deux-points peuvent coexister dans la même pièce :
- `JEAN:` (format classique avec deux-points)
- `MARIE` (format nouveau sans deux-points, après ligne vierge)

**Extrait** :
```
JEAN:
Bonjour ! Cette place est-elle libre ?

MARIE
Oui, je vous en prie, asseyez-vous.

JEAN:
Merci. Vous lisez quoi d'intéressant ?
```

#### `essai.txt` et `essaitest.txt`

Fichiers de test divers pour le développement.

## Notes

- Ces fichiers sont **uniquement à titre d'exemple** et de documentation
- Ils ne sont **pas inclus** dans le bundle de production
- Ils servent de référence pour comprendre comment utiliser les modèles
- Utiles pour tester manuellement les types et interfaces

## Prochaines étapes

D'autres exemples pourront être ajoutés :
- Exemples de stockage IndexedDB
- Exemples de TTS
- Exemples de state management
- Exemples de fichiers complexes avec didascalies avancées

---

**Licence** : MIT  
**Copyright** : 2025 Répét Contributors