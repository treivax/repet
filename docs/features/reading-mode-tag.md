# Tag de Méthode de Lecture

## Vue d'ensemble

Cette fonctionnalité affiche un tag cliquable dans le header de l'écran de lecture (`PlayScreen`) qui indique la méthode de lecture actuellement active. Le clic sur ce tag permet de naviguer directement vers l'écran de sélection de méthode de lecture sans repasser par l'écran d'accueil.

## Fonctionnalités

### Affichage du Tag

Le tag s'affiche dans le header, à côté du titre de la pièce, avec un style distinct selon le mode de lecture :

#### Mode Silencieux (`silent`)
- **Label** : `LECTURE`
- **Couleur** : Bleu (`bg-blue-100 dark:bg-blue-900`)
- **Texte** : Bleu foncé (`text-blue-800 dark:text-blue-200`)

#### Mode Audio (`audio`)
- **Label** : `LECTURE AUDIO`
- **Couleur** : Vert (`bg-green-100 dark:bg-green-900`)
- **Texte** : Vert foncé (`text-green-800 dark:text-green-200`)

#### Mode Italiennes (`italian`)
- **Label** : `ITALIENNES (PERSONNAGE)`
  - Exemple : `ITALIENNES (ARLEQUIN)`
  - Si aucun personnage n'est sélectionné : `ITALIENNES`
- **Couleur** : Violet (`bg-purple-100 dark:bg-purple-900`)
- **Texte** : Violet foncé (`text-purple-800 dark:text-purple-200`)

### Navigation

Lorsque l'utilisateur clique sur le tag :
1. Navigation vers `/reader/:playId`
2. L'écran de sélection de méthode s'affiche
3. Le contexte de la pièce est conservé (position actuelle, acte, scène)
4. L'utilisateur peut modifier la méthode et revenir directement à la lecture

## Implémentation

### Composant Concerné

- **Fichier** : `src/screens/PlayScreen.tsx`
- **Section** : Header du `PlayScreen`

### Code Principal

```typescript
// Fonction pour obtenir le label du tag de méthode de lecture
const getReadingModeLabel = () => {
  if (!playSettings) return ''

  switch (playSettings.readingMode) {
    case 'silent':
      return 'LECTURE'
    case 'audio':
      return 'LECTURE AUDIO'
    case 'italian':
      return userCharacter ? `ITALIENNES (${userCharacter.name.toUpperCase()})` : 'ITALIENNES'
    default:
      return ''
  }
}

// Fonction pour naviguer vers l'écran de sélection de méthode de lecture
const handleReadingModeClick = () => {
  if (playId) {
    navigate(`/reader/${playId}`)
  }
}
```

### JSX

```tsx
<button
  onClick={handleReadingModeClick}
  className={`text-xs px-2 py-1 rounded font-semibold whitespace-nowrap transition-colors cursor-pointer hover:opacity-80 ${
    playSettings.readingMode === 'silent'
      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
      : playSettings.readingMode === 'audio'
        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
  }`}
  data-testid="reading-mode"
  aria-label="Changer de méthode de lecture"
>
  {getReadingModeLabel()}
</button>
```

## Comportement UX

### Flux Utilisateur

1. **Lecture en cours** : L'utilisateur lit une pièce dans un mode donné
2. **Visualisation** : Le tag indique clairement le mode actif
3. **Changement de mode** : Clic sur le tag → écran de sélection
4. **Choix** : Sélection d'un nouveau mode
5. **Retour** : Retour automatique à la lecture avec le nouveau mode

### Avantages

- **Visibilité** : Le mode actif est toujours visible
- **Accessibilité** : Changement rapide de mode sans navigation complexe
- **Contexte préservé** : Pas de perte de position dans la pièce
- **Cohérence** : Design uniforme avec le reste de l'application

## Tests

### Tests Manuels

#### Test 1 : Affichage du Tag en Mode Silencieux
1. Sélectionner une pièce
2. Choisir le mode "Lecture silencieuse"
3. **Vérifier** : Tag bleu "LECTURE" visible dans le header

#### Test 2 : Affichage du Tag en Mode Audio
1. Sélectionner une pièce
2. Choisir le mode "Lecture audio"
3. **Vérifier** : Tag vert "LECTURE AUDIO" visible dans le header

#### Test 3 : Affichage du Tag en Mode Italiennes
1. Sélectionner une pièce
2. Choisir le mode "Italiennes"
3. Sélectionner un personnage (ex: ARLEQUIN)
4. **Vérifier** : Tag violet "ITALIENNES (ARLEQUIN)" visible dans le header

#### Test 4 : Navigation au Clic
1. En mode lecture, cliquer sur le tag de méthode
2. **Vérifier** : Navigation vers l'écran `/reader/:id`
3. Choisir un autre mode
4. **Vérifier** : Retour à la lecture avec le nouveau mode
5. **Vérifier** : Position dans la pièce préservée

#### Test 5 : Mode Sombre
1. Activer le mode sombre
2. **Vérifier** : Couleurs adaptées (dark:bg-*, dark:text-*)
3. **Vérifier** : Contraste suffisant pour la lisibilité

### Tests Automatisés (À Implémenter)

```typescript
describe('PlayScreen - Reading Mode Tag', () => {
  it('should display "LECTURE" tag in silent mode', () => {
    // Test avec mode silencieux
  })

  it('should display "LECTURE AUDIO" tag in audio mode', () => {
    // Test avec mode audio
  })

  it('should display "ITALIENNES (CHARACTER)" tag in italian mode', () => {
    // Test avec mode italiennes et personnage
  })

  it('should navigate to reader selection on tag click', () => {
    // Test de navigation
  })

  it('should preserve play context after mode change', () => {
    // Test de préservation du contexte
  })
})
```

## Notes Techniques

### Dépendances
- `playSettings` : Fourni par `usePlaySettingsStore`
- `userCharacter` : Fourni par `usePlayStore`
- `navigate` : Fourni par `react-router-dom`

### Accessibilité
- `aria-label="Changer de méthode de lecture"` pour les lecteurs d'écran
- `data-testid="reading-mode"` pour les tests automatisés
- Effet hover visible (`hover:opacity-80`)

### Responsive
- `whitespace-nowrap` empêche le retour à la ligne du texte
- Taille de police réduite (`text-xs`) pour économiser l'espace
- Padding adapté pour le tactile (`px-2 py-1`)

## Évolutions Futures

- [ ] Ajout d'une animation de transition au changement de mode
- [ ] Tooltip explicatif au survol du tag
- [ ] Raccourci clavier pour changer de mode rapidement
- [ ] Historique des modes utilisés par pièce
- [ ] Statistiques d'utilisation par mode

## Historique

- **2025-01-XX** : Corrections de bugs
  - Correction de la route de navigation (`/reader/:playId` au lieu de `/play/:playId/reader`)
  - Correction du clic en mode audio : `onLineClick` passé uniquement en mode audio
- **2025-01-XX** : Implémentation initiale
  - Affichage du tag pour tous les modes
  - Navigation directe vers l'écran de sélection
  - Design avec couleurs distinctes par mode