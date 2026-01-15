# Guide du format flexible de Répét

## 🎯 Introduction

Répét accepte maintenant **tous les formats de pièces de théâtre**, du plus simple au plus structuré. Vous n'êtes plus obligé d'utiliser des actes et des scènes !

## ✨ Ce qui a changé

### Avant (version 0.1.x)
- ❌ Obligation d'avoir au moins un ACTE
- ❌ Pas de section pour décrire les personnages
- ❌ Répliques vides impossibles

### Maintenant (version 0.2.0)
- ✅ Actes et scènes optionnels
- ✅ Section "Personnages" / "Comédiens" / "Rôles"
- ✅ Répliques vides supportées
- ✅ Tous les formats acceptés

## 📖 Formats supportés

### Format 1 : Dialogue simple (sans structure)

Le format le plus simple - juste des répliques :

```
Le Dialogue

ALICE
Bonjour.

BOB
Bonjour à vous.

ALICE
Comment allez-vous ?
```

**Résultat** : Répét crée automatiquement "Acte 1, Scène 1" pour organiser vos répliques.

### Format 2 : Scènes uniquement

Organisez votre pièce en scènes sans découpage en actes :

```
La Rencontre

Scène 1 - Le café

MARIE
Bonjour.

Scène 2 - Le parc

MARIE
Au revoir.
```

**Résultat** : Répét crée un "Acte 1" contenant vos scènes.

### Format 3 : Actes uniquement

Découpez en actes sans scènes explicites :

```
Le Drame

ACTE I

HAMLET
Être ou ne pas être.

ACTE II

OPHÉLIE
Quelle question !
```

**Résultat** : Répét crée une "Scène 1" dans chaque acte.

### Format 4 : Actes et scènes (classique)

Le format traditionnel reste bien sûr supporté :

```
Hamlet

ACTE I

Scène 1 - Les remparts

BERNARDO
Qui va là ?
```

## 👥 Section Personnages

### Pourquoi l'utiliser ?

La section "Personnages" vous permet de :
- Décrire les rôles avant la pièce
- Ajouter du contexte pour les lecteurs
- Documenter les relations entre personnages

### Comment l'utiliser ?

Utilisez l'un de ces mots-clés (avec ou sans deux-points) :
- `Personnages` ou `Personnages:`
- `Comédiens` ou `Comédiens:`
- `Rôles` ou `Rôles:`
- `Présentation` ou `Présentation:`
- `Introduction` ou `Introduction:`

### Exemple complet

```
Le Malade Imaginaire

Auteur: Molière
Année: 1673

Personnages:

ARGAN - Le malade imaginaire, père d'Angélique
TOINETTE - Servante d'Argan, spirituelle et rusée
ANGÉLIQUE - Fille d'Argan, amoureuse de Cléante
CLÉANTE - Jeune homme amoureux d'Angélique

ACTE I

Scène 1

(Argan, seul dans sa chambre, compte ses médicaments.)

ARGAN
Trois et deux font cinq...
```

### Où placer cette section ?

La section Personnages doit être placée **après les métadonnées** (Auteur, Année) et **avant la première scène ou acte**.

## 🤐 Répliques vides

### Qu'est-ce qu'une réplique vide ?

Une réplique vide, c'est quand un personnage est présent mais ne dit rien.

### Comment l'écrire ?

Il suffit d'écrire le nom du personnage sans texte après :

```
HAMLET
Bonjour.

OPHÉLIE

HAMLET
Vous ne dites rien ?
```

Dans cet exemple, OPHÉLIE ne dit rien (silence).

### Cas d'usage

- **Silence significatif** : Un personnage qui refuse de répondre
- **Entrée en scène** : Un personnage arrive mais ne parle pas encore
- **Mise en scène** : Marquer la présence sans dialogue

### Exemple théâtral

```
Le Silence

MARIE
Tu m'écoutes ?

PAUL

MARIE
Paul, réponds-moi !

PAUL

MARIE
Très bien. Je m'en vais.

(Elle sort.)
```

## 📝 Métadonnées

### Métadonnées disponibles

Toutes les métadonnées sont optionnelles :

```
Le Titre de la Pièce

Auteur: Nom de l'auteur
Annee: 2024
Categorie: Comédie

Personnages:
Liste des personnages...
```

### Ordre recommandé

1. **Titre** (premier bloc de texte)
2. **Auteur** (juste après le titre)
3. **Année** (après l'auteur)
4. **Catégorie** (après l'année)
5. **Personnages** (en dernier des métadonnées)

### Variantes acceptées

- `Année` ou `Annee` (avec/sans accent)
- `Catégorie` ou `Categorie` (avec/sans accent)
- `Personnages`, `Comédiens`, `Rôles`, etc. (avec/sans accent)

## ⚠️ Règles importantes

### 1. Noms de personnages

Les noms doivent être :
- **En MAJUSCULES** : `HAMLET` ✅, `Hamlet` ❌
- **Sans indentation** : Commencer au début de la ligne
- **Suivis de `:` OU précédés d'une ligne vide**

### 2. Format avec deux-points

```
HAMLET:
Être ou ne pas être.
```

Pas besoin de ligne vide avant.

### 3. Format sans deux-points

```
(ligne vide obligatoire)
HAMLET
Être ou ne pas être.
```

**Important** : Une ligne vide est obligatoire avant le nom du personnage.

### 4. Pas d'indentation

❌ **Incorrect** :
```
  HAMLET
  Texte
```

✅ **Correct** :
```
HAMLET
Texte
```

## 🎭 Exemples pratiques

### Exemple 1 : Sketch humoristique

```
Les Deux Comédiens

Personnages:
COMÉDIEN 1 - Nerveux
COMÉDIEN 2 - Décontracté

(Sur scène, deux comédiens attendent.)

COMÉDIEN 1
On fait quoi ?

COMÉDIEN 2
On improvise.

COMÉDIEN 1
Mais... je sais pas quoi dire !

COMÉDIEN 2

COMÉDIEN 1
Tu m'aides pas là !

(Noir.)
```

### Exemple 2 : Monologue

```
Solitude

Auteur: Anonyme

(Une chambre. Nuit. Éclairage tamisé.)

LOUISE
Encore seule ce soir.
Encore ces quatre murs.
Encore ce silence assourdissant.

(Elle regarde par la fenêtre.)

LOUISE
Dehors, le monde continue.
Ici, le temps s'arrête.

(Noir.)
```

### Exemple 3 : Dialogue philosophique

```
La Question

Introduction:
Deux philosophes débattent de la nature de la réalité.

SOCRATE
Qu'est-ce que la vérité ?

PLATON
La vérité est ce qui correspond à la réalité.

SOCRATE
Et qu'est-ce que la réalité ?

PLATON

SOCRATE
Exactement.

(Lumière.)
```

## 🚀 Migration depuis l'ancien format

Si vous avez des fichiers au format strict (avec ACTE obligatoire), **aucune modification nécessaire** ! Ils fonctionnent toujours.

### Simplifier un ancien fichier

**Avant** :
```
Ma Pièce

ACTE I

Scene 1

ALICE
Bonjour.
```

**Après** (optionnel) :
```
Ma Pièce

ALICE
Bonjour.
```

Les deux versions fonctionnent, la seconde est juste plus simple.

## 💡 Conseils

### Pour débuter
- Commencez simple : juste un titre et des répliques
- Ajoutez la structure progressivement si besoin

### Pour les pièces courtes
- Pas besoin d'actes ni de scènes
- Une section "Personnages" suffit

### Pour les pièces longues
- Utilisez actes et scènes pour organiser
- Numérotez clairement

### Pour l'enseignement
- Utilisez la section "Personnages" pour expliquer les rôles
- Ajoutez des didascalies explicatives

## 🔍 Résolution de problèmes

### Mon fichier n'est pas reconnu

Vérifiez que :
1. Les noms de personnages sont en MAJUSCULES
2. Il n'y a pas d'indentation (espaces) au début des lignes
3. Pour le format sans deux-points, il y a une ligne vide avant le nom

### Les personnages ne sont pas détectés

Assurez-vous que :
- Le nom commence par une LETTRE en majuscule
- Le nom contient uniquement : lettres, chiffres, espaces, tirets, apostrophes
- Vous utilisez soit `:` après le nom, soit une ligne vide avant

### La section Personnages n'apparaît pas

Vérifiez que :
- Elle est placée AVANT le premier ACTE/Scène/réplique
- Elle utilise un des mots-clés reconnus
- Il n'y a pas trop de lignes vides avant

## 📚 Ressources

- **Exemples** : Consultez le dossier `examples/`
- **Tests** : Voir `src/core/parser/__tests__/parser.test.ts`
- **Documentation technique** : `docs/RELEASE_NOTES_STRUCTURE_OPTIONNELLE.md`

## ❓ Questions fréquentes

**Q : Puis-je mélanger actes et scènes orphelines ?**  
R : Non, une scène appartient toujours à un acte. Si vous déclarez des scènes sans acte, Répét crée un acte par défaut.

**Q : Les répliques vides sont-elles vraiment utiles ?**  
R : Oui ! Elles permettent d'indiquer qu'un personnage est présent mais silencieux, ce qui peut être important pour la mise en scène.

**Q : Combien de personnages puis-je décrire dans la section Personnages ?**  
R : Jusqu'à 100 lignes. Au-delà, la section sera tronquée.

**Q : Puis-je avoir plusieurs sections Personnages ?**  
R : Non, seule la première sera reconnue.

**Q : Les anciens fichiers fonctionnent-ils toujours ?**  
R : Oui ! 100% de rétrocompatibilité.

---

**Version du document** : 1.0  
**Dernière mise à jour** : Janvier 2025  
**Application** : Répét v0.2.0+