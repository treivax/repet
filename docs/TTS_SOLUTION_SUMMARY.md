# Solutions TTS pour Répét - Résumé Exécutif

## 🎯 Problème

Sur Linux Desktop et Android Chrome, seulement **1-2 voix françaises** sont disponibles via Web Speech API.

## ✅ Solutions Proposées

### Solution Recommandée : Approche Hybride Progressive

```
┌─────────────────┬──────────────────────────────────────────────┐
│ Phase 1 (2 sem) │ Google Cloud TTS (API key utilisateur)      │
│                 │ • 10-20 voix françaises premium              │
│                 │ • Quota gratuit : 1M caractères/mois         │
│                 │ • Cache IndexedDB pour usage hors ligne      │
├─────────────────┼──────────────────────────────────────────────┤
│ Phase 2 (2 mois)│ Piper WASM (gratuit, hors ligne)            │
│                 │ • 3-5 voix françaises de qualité             │
│                 │ • Téléchargement modèles (~30MB par voix)    │
│                 │ • 100% gratuit, 100% hors ligne              │
├─────────────────┼──────────────────────────────────────────────┤
│ Phase 3 (opt.)  │ Backend Répét avec quota gratuit            │
│                 │ • Service managé pour utilisateurs           │
│                 │ • Modèle freemium                            │
└─────────────────┴──────────────────────────────────────────────┘
```

## 📊 Comparaison des Options

| Solution | Coût | Qualité | Hors ligne | Délai |
|----------|------|---------|------------|-------|
| **Web Speech** (actuel) | Gratuit | ⭐⭐ | ✅ | Immédiat |
| **Google Cloud** ⭐ | Gratuit* | ⭐⭐⭐⭐⭐ | ⚠️ Cache | 2 semaines |
| **Piper WASM** ⭐⭐ | Gratuit | ⭐⭐⭐⭐ | ✅ | 2 mois |
| Backend Répét | Variable | ⭐⭐⭐⭐⭐ | ❌ | 3+ mois |

*1M caractères/mois gratuit (~50 lectures complètes)

## 🏗️ Architecture

```typescript
// Interface unifiée pour tous les providers TTS
interface TTSProvider {
  type: 'web-speech' | 'google-cloud' | 'piper-wasm'
  initialize(config?: any): Promise<void>
  getVoices(): Promise<VoiceDescriptor[]>
  synthesize(text, voiceId, options): Promise<SynthesisResult>
  stop(): void
}

// Manager central
class TTSProviderManager {
  async setActiveProvider(type: TTSProviderType): Promise<void>
  async speak(text, voiceId, options): Promise<void>
}
```

## 💡 Recommandation

**Commencer par Phase 1 (Google Cloud TTS)** car :

✅ **Résout le problème immédiatement**  
✅ **Excellente qualité** (voix Neural2)  
✅ **Quota gratuit généreux** (1M chars/mois)  
✅ **Effort limité** (2 semaines)  
✅ **Valide le besoin** utilisateur  
✅ **Pas de coût** pour Répét (API key utilisateur)

Puis investir dans **Phase 2 (Piper WASM)** pour :

✅ **Solution pérenne** et gratuite  
✅ **Autonomie complète** (pas de dépendance externe)  
✅ **Fonctionne hors ligne**  
✅ **Pas de quota** ni limitation

## 📚 Documentation Complète

- `docs/TTS_SOLUTIONS_ANALYSIS.md` - Analyse détaillée de toutes les options
- `docs/TTS_ARCHITECTURE_PROPOSAL.md` - Architecture technique complète

