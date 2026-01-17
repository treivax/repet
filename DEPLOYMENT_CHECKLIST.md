# ✅ Checklist de Déploiement v0.3.0

**Date**: 2025-01-17  
**Version**: 0.3.0  
**Status**: 🟢 PRÊT POUR PRODUCTION

---

## Phase 1: Pré-déploiement ✅ COMPLÉTÉ

- [x] Code mergé dans `main` (depuis `new_annotations`)
- [x] Version bumpée (0.2.3 → 0.3.0)
- [x] CHANGELOG.md mis à jour
- [x] Tag `v0.3.0` créé et poussé
- [x] TypeScript check: 0 erreurs
- [x] ESLint: 0 erreurs
- [x] Build offline: SUCCESS (272 MB)
- [x] Build online: SUCCESS (77 MB)
- [x] Git status: Clean
- [x] Documentation complète ajoutée

---

## Phase 2: Déploiement Production 🎯 À FAIRE

### 2.1 Backup Production

```bash
# Backup app.repet.com
ssh user@app.repet.com
cd /var/www
sudo cp -r app.repet.com app.repet.com.backup-$(date +%Y%m%d-%H%M)

# Backup ios.repet.com
ssh user@ios.repet.com
cd /var/www
sudo cp -r ios.repet.com ios.repet.com.backup-$(date +%Y%m%d-%H%M)
```

- [ ] Backup offline créé
- [ ] Backup online créé

### 2.2 Déployer Version Offline

```bash
# Option 1: Deploy direct depuis local
cd /path/to/repet
rsync -avz --delete dist-offline/ user@app.repet.com:/var/www/app.repet.com/

# Option 2: Deploy depuis serveur
ssh user@app.repet.com
cd /path/to/repet
git fetch origin
git checkout v0.3.0
npm ci
npm run build:offline
sudo rsync -av dist-offline/ /var/www/app.repet.com/
sudo chown -R www-data:www-data /var/www/app.repet.com/
```

- [ ] Fichiers copiés
- [ ] Permissions vérifiées
- [ ] Service web rechargé si nécessaire

### 2.3 Déployer Version Online

```bash
# Option 1: Deploy direct depuis local
cd /path/to/repet
rsync -avz --delete dist-online/ user@ios.repet.com:/var/www/ios.repet.com/

# Option 2: Deploy depuis serveur
ssh user@ios.repet.com
cd /path/to/repet
git fetch origin
git checkout v0.3.0
npm ci
npm run build:online
sudo rsync -av dist-online/ /var/www/ios.repet.com/
sudo chown -R www-data:www-data /var/www/ios.repet.com/
```

- [ ] Fichiers copiés
- [ ] Permissions vérifiées
- [ ] Headers CORS configurés
- [ ] Service web rechargé si nécessaire

### 2.4 Vérifier Headers CORS (iOS)

```bash
# Vérifier que les headers sont appliqués
curl -I https://ios.repet.com/ | grep -i "cross-origin"
curl -I https://ios.repet.com/wasm/ort-wasm-simd-threaded.wasm | grep -i "cross-origin"

# Devrait afficher:
# Cross-Origin-Embedder-Policy: credentialless
# Cross-Origin-Opener-Policy: same-origin
```

- [ ] Headers COEP présents
- [ ] Headers COOP présents
- [ ] Pas d'erreurs CORS dans console

---

## Phase 3: Tests Post-Déploiement 🧪 À FAIRE

### 3.1 Tests Version Offline (app.repet.com)

**Desktop**
- [ ] Site accessible: https://app.repet.com
- [ ] Version affichée: 0.3.0 (vérifier console ou page About)
- [ ] PWA installable (bouton "Installer l'application")
- [ ] Mode offline fonctionne (couper réseau, recharger)

**Fonctionnalités de base**
- [ ] Charger une pièce existante
- [ ] Créer une nouvelle pièce
- [ ] Lecture audio (mode audio)
- [ ] Les 3 voix fonctionnent (siwis, tom, upmc)
- [ ] Mode silencieux (scroll manuel fluide)
- [ ] Mode italiennes (lecture par répliques)

**Nouvelles fonctionnalités (v0.3.0)**
- [ ] Long-press sur réplique → Menu note apparaît
- [ ] Créer une note sur réplique
- [ ] Modifier une note existante
- [ ] Supprimer une note (confirmation apparaît)
- [ ] Note visible avec icône + compteur
- [ ] Créer note sur didascalie
- [ ] Créer note sur titre de scène
- [ ] Export PDF avec notes visibles
- [ ] Notes persistantes après refresh

**Mobile/Tactile**
- [ ] Tester sur smartphone Android
- [ ] Long-press fonctionne correctement
- [ ] Interface responsive

### 3.2 Tests Version Online (ios.repet.com)

**Desktop**
- [ ] Site accessible: https://ios.repet.com
- [ ] Version affichée: 0.3.0
- [ ] PWA installable

**iOS Safari (CRITIQUE)**
- [ ] Ouvrir sur iPhone/iPad
- [ ] Pas d'erreur CORS dans console
- [ ] Téléchargement modèle vocal CDN réussit
- [ ] Synthèse vocale fonctionne
- [ ] Long-press pour annotations fonctionne
- [ ] Installation PWA possible ("Ajouter à l'écran d'accueil")
- [ ] App fonctionne après installation

**Fonctionnalités**
- [ ] Toutes les fonctionnalités offline (liste ci-dessus)
- [ ] Téléchargement voix depuis HuggingFace fonctionne
- [ ] Cache voix persiste entre sessions

### 3.3 Tests Multi-navigateurs

**Desktop**
- [ ] Chrome (Windows)
- [ ] Chrome (macOS)
- [ ] Chrome (Linux)
- [ ] Firefox (toutes plateformes)
- [ ] Safari (macOS)
- [ ] Edge (Windows)

**Mobile**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS 14+)
- [ ] Samsung Internet
- [ ] Firefox Mobile

### 3.4 Tests de Performance

- [ ] Chargement initial < 3 secondes (après cache)
- [ ] Pas de lag lors du scroll
- [ ] Animations fluides (60 FPS)
- [ ] Pas de freeze lors de l'ajout de notes
- [ ] Export PDF rapide (< 5s pour pièce moyenne)

---

## Phase 4: Monitoring Post-Déploiement 📊 À FAIRE

### J+0 (Jour du déploiement)

**Immédiat (0-2h)**
- [ ] Vérifier logs serveur (erreurs 500)
- [ ] Vérifier logs erreurs JS (Sentry/console)
- [ ] Monitorer trafic réseau (CloudFlare/Analytics)
- [ ] Vérifier taux d'erreur < 1%

**Fin de journée (2-8h)**
- [ ] Analyser métriques utilisateurs
- [ ] Collecter premiers retours
- [ ] Vérifier aucune erreur critique

### J+1

- [ ] Analyser logs 24h
- [ ] Vérifier adoption feature annotations
- [ ] Taux de mise à jour PWA
- [ ] Performance globale stable

### J+7

- [ ] Rapport hebdomadaire
- [ ] Feedback utilisateurs consolidé
- [ ] Décision: maintenir ou corriger

---

## Phase 5: Rollback (Si Nécessaire) 🚨

### Rollback Immédiat

```bash
# Si problème critique détecté, restaurer backup

# Offline
ssh user@app.repet.com
cd /var/www
sudo rm -rf app.repet.com
sudo mv app.repet.com.backup-YYYYMMDD-HHMM app.repet.com

# Online
ssh user@ios.repet.com
cd /var/www
sudo rm -rf ios.repet.com
sudo mv ios.repet.com.backup-YYYYMMDD-HHMM ios.repet.com
```

- [ ] Backup restauré
- [ ] Version précédente fonctionnelle
- [ ] Utilisateurs informés

### Communication Rollback

- [ ] Équipe dev notifiée
- [ ] Incident documenté
- [ ] Post-mortem planifié
- [ ] Correctif en cours

---

## Critères de Succès 🎯

Le déploiement est validé si **TOUS** ces critères sont remplis:

1. ✅ Sites accessibles (app + ios)
2. ✅ Version 0.3.0 affichée
3. ✅ PWA installable
4. ✅ Annotations fonctionnelles (tous appareils)
5. ✅ Export PDF avec notes OK
6. ✅ Performance stable
7. ✅ iOS compatible (Safari)
8. ✅ Taux d'erreur < 1%
9. ✅ Aucune régression features existantes
10. ✅ Feedback utilisateurs positif

**Si UN critère échoue → Analyser et décider rollback si critique**

---

## Notes Importantes 📝

### Heures Recommandées

- ✅ Déployer en journée (9h-17h)
- ❌ Éviter vendredis soirs
- ❌ Éviter veilles de jours fériés
- ✅ Prévoir monitoring actif 2-4h après déploiement

### Personnes à Informer

- [ ] Équipe développement
- [ ] Testeurs/QA
- [ ] Support utilisateurs
- [ ] Marketing (si applicable)

### Durée Estimée

- Backup: 5 minutes
- Déploiement: 10 minutes
- Tests de base: 30 minutes
- Tests complets: 2 heures
- **Total: ~3 heures**

---

## Documentation de Référence 📚

- `DEPLOYMENT_READY_v0.3.0.md` - Guide détaillé complet
- `DEPLOYMENT_STATUS.txt` - Status visuel rapide
- `CHANGELOG.md` - Release notes v0.3.0
- `spec_notes.md` - Spécification annotations
- `PHASE_6_TEST_PLAN.md` - Plan de test détaillé

---

## Contact d'Urgence 🆘

En cas de problème critique pendant le déploiement:

1. **STOP** le déploiement
2. Évaluer la gravité
3. Décider: Corriger OU Rollback
4. Documenter l'incident
5. Informer l'équipe

---

**Préparé par**: CI/CD Répét  
**Date**: 2025-01-17  
**Version**: 0.3.0  
**Status**: 🟢 PRÊT

**Bon déploiement! 🚀**
