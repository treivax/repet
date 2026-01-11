
---

## Mise à jour - Suppression page Paramètres (11 janvier 2026)

### Suppressions supplémentaires
- **SettingsScreen.tsx** - Page de paramètres globaux
- **settingsStore.ts** - Store de paramètres globaux
- **ReadingModeSelector.tsx** - Composant non utilisé
- **Route /settings** - Supprimée du router
- **Liens navigation** - Retirés du header
- **useIsAudioEnabled()** - Selector obsolète

### Déplacements
Composants de configuration déplacés de `components/settings/` vers `components/play/` :
- AudioSettings.tsx
- ItalianSettings.tsx  
- VoiceAssignment.tsx

### Justification
Les paramètres globaux n'étaient plus utilisés. Tous les réglages sont maintenant gérés par pièce via **playSettingsStore**, ce qui est plus cohérent avec l'UX de l'application.

### Architecture finale
```
src/
├── components/
│   ├── common/      # Composants réutilisables
│   ├── play/        # Composants pièces + settings par pièce
│   └── reader/      # Composants lecture
├── screens/
│   ├── LibraryScreen.tsx      # ✅ Bibliothèque
│   ├── PlayDetailScreen.tsx   # ✅ Configuration pièce
│   ├── PlayScreen.tsx         # ✅ Lecture audio/italiennes
│   └── ReaderScreen.tsx       # ✅ Lecture silencieuse
└── state/
    ├── playStore.ts            # ✅ État lecture
    ├── playSettingsStore.ts    # ✅ Settings par pièce
    ├── uiStore.ts              # ✅ État UI
    └── selectors.ts            # ✅ Sélecteurs
```

**Nouveau total :** ~76 fichiers supprimés, ~19 500 lignes de code nettoyées
