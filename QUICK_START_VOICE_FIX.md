# Guide de Démarrage Rapide - Correctif Voix Gilles

## 🎯 Résumé en 30 secondes

- ❌ **Voix Gilles désactivée** - Causait des erreurs ONNX Runtime
- ✅ **Migration automatique vers Tom** - Vos personnages seront réassignés automatiquement
- ✅ **Aucune action requise** - Tout se fait automatiquement au prochain chargement

## 📌 Ce qui a changé

### Voix Retirée
```
fr_FR-gilles-low (Gilles) → DÉSACTIVÉE
```

**Raison** : Erreurs `ONNX Runtime: indices element out of data bounds`

### Voix de Remplacement
```
fr_FR-gilles-low → fr_FR-tom-medium (Tom)
```

Tom est fiable à ~100% et fonctionne avec tous les types de texte.

## 🚀 Que va-t-il se passer ?

### Au Prochain Démarrage de l'App

1. **Détection automatique** des personnages utilisant Gilles
2. **Migration automatique** vers Tom
3. **Logs dans la console** pour tracer les changements
4. **Sauvegarde automatique** des nouvelles assignations

### Exemple de Logs

```
[VoiceMigration] 🔄 Migration de voix: fr_FR-gilles-low → fr_FR-tom-medium
[VoiceMigration] ⚙️  Personnage "romeo_123": fr_FR-gilles-low → fr_FR-tom-medium
[VoiceMigration] ✅ Migration terminée: 1 pièce(s) mise(s) à jour
```

## ✅ Voix Recommandées

| Voix | Genre | Statut |
|------|-------|--------|
| **Tom** (`fr_FR-tom-medium`) | Homme | ✅ **Recommandée** |
| **Siwis** (`fr_FR-siwis-medium`) | Femme | ✅ Fiable |
| **UPMC Jessica** (`fr_FR-upmc-medium`) | Femme | ✅ Fiable |

## 🔍 Vérifier les Migrations

Si vous voulez voir quels personnages ont été migrés, ouvrez la console du navigateur (F12) :

```javascript
// Voir les paramètres actuels
usePlaySettingsStore.getState().playSettings

// Lancer un diagnostic complet
import('../utils/voiceDiagnostics').then(({ logDiagnosticReport }) => {
  logDiagnosticReport(usePlaySettingsStore.getState().playSettings)
})
```

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `docs/TTS_VOICE_ISSUES.md` - Historique complet et explications techniques
- `GILLES_VOICE_FIX_SUMMARY.md` - Résumé détaillé des corrections
- `CHANGELOG.md` - Entrée de changelog complète

## ❓ FAQ

### Mes personnages vont-ils perdre leur voix ?
Non, ils seront automatiquement réassignés à Tom (voix masculine fiable).

### Puis-je revenir à Gilles ?
Non, Gilles est désactivée car elle cause des erreurs. Si un correctif est trouvé, elle sera réactivée dans une future version.

### Que faire si j'ai des problèmes ?
1. Vérifiez les logs de la console (F12)
2. Utilisez les outils de diagnostic fournis
3. Consultez `docs/TTS_VOICE_ISSUES.md`

### Est-ce que ça affecte les voix Google/Web Speech ?
Non, seulement les voix Piper sont concernées.

## 🧪 Tests Ajoutés

Des tests automatisés ont été ajoutés pour garantir que :
- ✅ Les migrations fonctionnent correctement
- ✅ Les voix obsolètes sont détectées
- ✅ Les patterns problématiques dans le texte sont identifiés

Lancer les tests :
```bash
npm test -- src/utils/__tests__/voiceMigration.test.ts
npm test -- src/utils/__tests__/voiceDiagnostics.test.ts
```

## 📊 Fichiers Modifiés

### Nouveaux Fichiers
- `src/utils/voiceMigration.ts` - Système de migration
- `src/utils/voiceDiagnostics.ts` - Outils de diagnostic
- `src/utils/__tests__/voiceMigration.test.ts` - Tests de migration
- `src/utils/__tests__/voiceDiagnostics.test.ts` - Tests de diagnostic
- `docs/TTS_VOICE_ISSUES.md` - Documentation complète

### Fichiers Modifiés
- `src/core/tts/providers/PiperWASMProvider.ts` - Gilles commentée
- `src/state/playSettingsStore.ts` - Migration automatique intégrée
- `CHANGELOG.md` - Entrée de changelog

## 💡 Avantages de Cette Solution

1. **Automatique** - Aucune intervention utilisateur requise
2. **Transparente** - Logs clairs de ce qui se passe
3. **Réversible** - Code commenté, pas supprimé
4. **Robuste** - Tests unitaires complets
5. **Documentée** - Documentation exhaustive

---

**Dernière mise à jour** : 2025-01-XX  
**Version** : 0.2.0 (Unreleased)  
**Auteur** : Répét Contributors