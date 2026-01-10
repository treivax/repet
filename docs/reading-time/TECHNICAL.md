# Fonctionnalité : Indicateur de temps de lecture

## Vue d'ensemble

Cette fonctionnalité ajoute un indicateur visuel de progression pour afficher le temps restant lors de la lecture audio d'une réplique dans l'écran `PlayScreen`.

## Implémentation

### 1. Estimation du temps de lecture

**Fonction : `estimateLineDuration(text: string, rate: number): number`**

- **Algorithme** :
  - Comptage des mots dans le texte (split sur les espaces)
  - Vitesse de base : 2.5 mots/seconde à `rate=1`
  - Formule : `durée = (nombre de mots / (2.5 × rate)) + 0.3s`
  - Le buffer de 0.3s compense la latence de démarrage

- **Paramètres** :
  - `text` : Le texte de la réplique
  - `rate` : La vitesse de lecture TTS (de l'utterance)

- **Retour** : Durée estimée en secondes

### 2. Tracking de la progression en temps réel

**États ajoutés dans PlayScreen** :
```typescript
const [estimatedDuration, setEstimatedDuration] = useState<number>(0) // en secondes
const [elapsedTime, setElapsedTime] = useState<number>(0) // en secondes
const [progressPercentage, setProgressPercentage] = useState<number>(0) // 0-100
```

**Refs ajoutées** :
```typescript
const startTimeRef = useRef<number>(0)
const progressIntervalRef = useRef<number | null>(null)
```

**Fonctions de tracking** :
- `startProgressTracking(duration: number)` : Initialise le tracking et démarre un interval de 100ms
- `updateProgress()` : Calcule le temps écoulé et met à jour le pourcentage
- `stopProgressTracking()` : Arrête l'interval et réinitialise les états

### 3. Affichage visuel

**Composant : LineRenderer**

L'indicateur est affiché uniquement sur la carte en cours de lecture (`isPlaying === true`) :

```
┌─────────────────────────────────────┐
│ PERSONNAGE                          │
│ Texte de la réplique...             │
│                                     │
│ ⭕ 3s  ← Cercle de progression +    │
│         temps restant               │
└─────────────────────────────────────┘
```

**Éléments visuels** :
- **Cercle de progression SVG** :
  - Cercle de fond gris
  - Cercle de progression coloré (bleu en lecture, jaune en pause)
  - Animation fluide grâce au `strokeDashoffset`
  
- **Temps restant** :
  - Format : `Xs` (secondes restantes)
  - Couleur synchronisée avec le cercle
  - Préfixe `⏸ En pause ·` si la lecture est en pause

### 4. Intégration avec le flux de lecture

**Dans `speakLine()`** :
1. Estimation de la durée basée sur le texte et la vitesse
2. Démarrage du tracking de progression
3. Lors de `utterance.onend` : arrêt du tracking
4. Lors de `utterance.onerror` : arrêt du tracking
5. Lors de l'interruption (clic sur autre carte) : arrêt du tracking

**Dans `stopPlayback()`** :
- Arrêt du tracking de progression

**Nettoyage** :
- L'interval est nettoyé au démontage du composant via `useEffect`

## Flux de données

```
PlayScreen
├─ estimateLineDuration() → calcule durée
├─ startProgressTracking() → démarre interval (100ms)
├─ updateProgress() → met à jour états toutes les 100ms
│  └─ setElapsedTime, setProgressPercentage
│
└─ TextDisplay (props: progressPercentage, elapsedTime, estimatedDuration)
   └─ LineRenderer (pour ligne en lecture uniquement)
      └─ Affichage SVG cercle + temps restant
```

## Précision de l'estimation

### Facteurs affectant la précision :
- ✅ Nombre de mots
- ✅ Vitesse de lecture (rate)
- ⚠️ Complexité linguistique (non pris en compte)
- ⚠️ Ponctuation (pauses naturelles)
- ⚠️ Variations entre voix TTS

### Résultats attendus :
- **Précision** : ±15-20% selon le texte
- **Suffisant** : Pour donner une indication visuelle à l'utilisateur
- **Amélioration future** : Utiliser `utterance.onboundary` pour tracker la progression réelle mot par mot

## Cas d'usage

1. **Lecture normale** :
   - Clic sur carte → affichage du cercle + décompte
   - Progression visuelle fluide
   - Disparition à la fin

2. **Pause/Reprise** :
   - Clic sur carte en lecture → pause
   - Cercle devient jaune avec indicateur `⏸ En pause`
   - Temps restant figé
   - Clic à nouveau → reprise avec cercle bleu

3. **Interruption** :
   - Clic sur autre carte → arrêt immédiat du tracking
   - Nouvelle carte démarre avec nouveau timer

4. **Enchaînement automatique** :
   - À la fin d'une ligne, le tracking s'arrête
   - La ligne suivante démarre avec nouveau timer

## Notes techniques

### Performance
- Interval léger (100ms) pour fluidité visuelle
- Calculs simples (divisions, multiplications)
- Pas d'impact significatif sur les performances

### Accessibilité
- Information visuelle uniquement (pas de ARIA pour le moment)
- Amélioration future : annoncer le temps restant via screen reader

### Compatibilité
- Utilise `performance.now()` pour précision millisecondes
- SVG compatible tous navigateurs modernes
- `strokeDashoffset` pour animation CSS pure

## Tests

### Tests manuels à effectuer :
1. ✅ Vérifier affichage du cercle et du temps
2. ✅ Vérifier progression visuelle fluide
3. ✅ Tester pause (cercle jaune)
4. ✅ Tester interruption (nouveau timer)
5. ✅ Tester enchaînement automatique
6. ✅ Vérifier disparition en fin de lecture

### Tests automatisés recommandés :
```typescript
describe('Reading time tracking', () => {
  it('should estimate duration based on word count and rate')
  it('should update progress percentage during playback')
  it('should stop tracking when playback ends')
  it('should reset tracking when switching to another line')
})
```

## Améliorations futures possibles

1. **Précision accrue** :
   - Utiliser `utterance.onboundary` pour tracker mot par mot
   - Calibration automatique basée sur lectures précédentes

2. **Personnalisation** :
   - Option pour masquer/afficher l'indicateur
   - Choix du format d'affichage (secondes, mm:ss, pourcentage)

3. **Accessibilité** :
   - Attributs ARIA pour annoncer le temps restant
   - Alternative textuelle pour screen readers

4. **Statistiques** :
   - Enregistrer temps réel vs estimé
   - Améliorer l'algorithme d'estimation

5. **Visualisation alternative** :
   - Barre de progression linéaire
   - Animation de vague/pulse
   - Mini-timeline de la scène complète