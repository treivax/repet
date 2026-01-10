# Guide Visuel - Tags de Méthode de Lecture

## Vue d'ensemble

Cette page présente visuellement les différents tags de méthode de lecture affichés dans le header de l'écran de lecture.

---

## 🎨 Apparence des Tags

### Mode Lecture Silencieuse

```
┌─────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [LECTURE]  ?              │
└─────────────────────────────────────────────────────────┘
```

**Couleur** : Bleu  
**Label** : `LECTURE`  
**Usage** : Lecture personnelle sans audio

---

### Mode Lecture Audio

```
┌─────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [LECTURE AUDIO]  ?        │
└─────────────────────────────────────────────────────────┘
```

**Couleur** : Vert  
**Label** : `LECTURE AUDIO`  
**Usage** : Lecture avec synthèse vocale pour toutes les répliques

---

### Mode Italiennes

```
┌─────────────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [ITALIENNES (SGANARELLE)]  ?      │
└─────────────────────────────────────────────────────────────────┘
```

**Couleur** : Violet  
**Label** : `ITALIENNES (PERSONNAGE)`  
**Usage** : Lecture avec audio pour les autres personnages uniquement  
**Note** : Le nom du personnage sélectionné est affiché en majuscules

---

## 🎯 Codes Couleur

| Mode | Couleur fond (clair) | Couleur fond (sombre) | Couleur texte (clair) | Couleur texte (sombre) |
|------|---------------------|----------------------|---------------------|----------------------|
| **Lecture** | `bg-blue-100` | `bg-blue-900` | `text-blue-800` | `text-blue-200` |
| **Lecture Audio** | `bg-green-100` | `bg-green-900` | `text-green-800` | `text-green-200` |
| **Italiennes** | `bg-purple-100` | `bg-purple-900` | `text-purple-800` | `text-purple-200` |

---

## 🖱️ Interaction

### Clic sur le Tag

```
┌─────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [LECTURE AUDIO] ←─── CLIC │
└─────────────────────────────────────────────────────────┘
                                    │
                                    ▼
            ┌───────────────────────────────────┐
            │  Choisir la méthode de lecture    │
            ├───────────────────────────────────┤
            │  ○ Lecture silencieuse            │
            │  ● Lecture audio                  │
            │  ○ Italiennes                     │
            └───────────────────────────────────┘
```

**Action** : Navigation vers `/reader/:id`  
**Effet** : L'écran de sélection de méthode s'affiche  
**Contexte** : Position dans la pièce préservée

---

## 📱 Responsive Design

### Desktop
```
┌─────────────────────────────────────────────────────────────────┐
│  ←      Le Médecin malgré lui  [ITALIENNES (SGANARELLE)]  ?   │
└─────────────────────────────────────────────────────────────────┘
     ↑              ↑                        ↑                  ↑
   Retour         Titre                     Tag               Aide
```

### Mobile
```
┌───────────────────────────────────────┐
│  ←  Le Médecin... [ITALIENNES...]  ? │
└───────────────────────────────────────┘
```

**Note** : Le tag utilise `whitespace-nowrap` pour éviter le retour à la ligne  
**Taille** : Police réduite (`text-xs`) pour optimiser l'espace

---

## 🌓 Mode Sombre

### Avant (Mode Clair)

```
┌─────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [LECTURE AUDIO]  ?        │
│      (fond blanc, tag vert clair)                       │
└─────────────────────────────────────────────────────────┘
```

### Après (Mode Sombre)

```
┌─────────────────────────────────────────────────────────┐
│  ←   Le Médecin malgré lui  [LECTURE AUDIO]  ?        │
│      (fond gris foncé, tag vert foncé)                  │
└─────────────────────────────────────────────────────────┘
```

**Adaptation automatique** : Les couleurs s'ajustent avec les classes Tailwind `dark:`

---

## ✨ États Visuels

### État Normal
```
[LECTURE AUDIO]  ← Opacité 100%
```

### État Hover
```
[LECTURE AUDIO]  ← Opacité 80% (hover:opacity-80)
```

### État Focus (Accessibilité)
```
[LECTURE AUDIO]  ← Bordure de focus pour navigation clavier
```

---

## 📊 Flux Utilisateur Complet

```
1. ÉCRAN D'ACCUEIL
   │
   └─→ Sélectionner une pièce
       │
       ▼
2. SÉLECTION DE MÉTHODE
   │
   ├─→ Choisir "Lecture audio"
   │
   ▼
3. ÉCRAN DE LECTURE
   │
   │  ┌──────────────────────────────────────┐
   │  │  [LECTURE AUDIO] ←── Tag visible    │
   │  └──────────────────────────────────────┘
   │
   ├─→ Clic sur le tag
   │
   ▼
4. RETOUR SÉLECTION
   │
   ├─→ Changer pour "Italiennes"
   ├─→ Choisir personnage "ARLEQUIN"
   │
   ▼
5. RETOUR À LA LECTURE
   │
   │  ┌──────────────────────────────────────────┐
   │  │  [ITALIENNES (ARLEQUIN)] ←── Mis à jour │
   │  └──────────────────────────────────────────┘
   │
   └─→ Position dans la pièce conservée ✓
```

---

## 🎭 Exemples par Pièce

### Le Médecin malgré lui

| Mode | Personnage | Affichage |
|------|-----------|-----------|
| Silencieux | - | `LECTURE` |
| Audio | - | `LECTURE AUDIO` |
| Italiennes | Sganarelle | `ITALIENNES (SGANARELLE)` |
| Italiennes | Martine | `ITALIENNES (MARTINE)` |
| Italiennes | Lucas | `ITALIENNES (LUCAS)` |

### L'Avare

| Mode | Personnage | Affichage |
|------|-----------|-----------|
| Silencieux | - | `LECTURE` |
| Audio | - | `LECTURE AUDIO` |
| Italiennes | Harpagon | `ITALIENNES (HARPAGON)` |
| Italiennes | Cléante | `ITALIENNES (CLÉANTE)` |
| Italiennes | Élise | `ITALIENNES (ÉLISE)` |

---

## 🔧 Détails Techniques

### Classes CSS Utilisées

```css
/* Base du bouton */
.text-xs          /* Petite taille de police */
.px-2 .py-1      /* Padding horizontal et vertical */
.rounded          /* Coins arrondis */
.font-semibold    /* Police semi-grasse */
.whitespace-nowrap /* Pas de retour à la ligne */
.transition-colors /* Animation de transition */
.cursor-pointer   /* Curseur pointeur au survol */

/* État hover */
.hover:opacity-80 /* Réduction opacité au survol */

/* Variantes de couleur */
.bg-blue-100 .text-blue-800      /* Lecture (clair) */
.dark:bg-blue-900 .dark:text-blue-200 /* Lecture (sombre) */

.bg-green-100 .text-green-800    /* Audio (clair) */
.dark:bg-green-900 .dark:text-green-200 /* Audio (sombre) */

.bg-purple-100 .text-purple-800  /* Italiennes (clair) */
.dark:bg-purple-900 .dark:text-purple-200 /* Italiennes (sombre) */
```

### Accessibilité

- **ARIA** : `aria-label="Changer de méthode de lecture"`
- **Sémantique** : Élément `<button>` natif
- **Clavier** : Navigation Tab et activation Entrée/Espace
- **Contraste** : Respecte WCAG AA (minimum 4.5:1)
- **Screen readers** : Label descriptif annoncé

---

## 📝 Notes de Design

### Choix de Couleurs

- **Bleu** (Lecture) : Couleur calme, associée à la lecture
- **Vert** (Audio) : Couleur active, associée à l'action
- **Violet** (Italiennes) : Couleur distinctive, associée à la créativité

### Hiérarchie Visuelle

```
TITRE DE LA PIÈCE  ←── Principal (text-lg font-bold)
[MÉTHODE]          ←── Secondaire (text-xs font-semibold)
```

Le tag est visuellement secondaire mais reste clairement visible et accessible.

---

## 🚀 Améliorations Futures

- [ ] **Animation de transition** lors du changement de mode
- [ ] **Tooltip explicatif** au survol (ex: "Cliquez pour changer")
- [ ] **Icônes** à côté du texte pour renforcer la signification
- [ ] **Notification toast** après changement de mode
- [ ] **Historique** des modes utilisés (persistance locale)

---

## 🐛 Corrections

- **2025-01-XX** : Correction route de navigation (`/reader/:playId`)
- **2025-01-XX** : Correction clic mode audio (onLineClick conditionnel)

---

*Document créé le 2025-01-XX*  
*Dernière mise à jour : 2025-01-XX*