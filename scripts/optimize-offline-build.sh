#!/bin/bash
# Copyright (c) 2025 Répét Contributors
# Licensed under the MIT License
# See LICENSE file in the project root for full license text

###############################################################################
# Script d'optimisation automatique du build offline
# Réduit la taille de ~929 MB → ~330 MB (-64%)
#
# Usage: ./scripts/optimize-offline-build.sh [--dry-run]
###############################################################################

set -e

# Couleurs pour affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Mode dry-run
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo -e "${YELLOW}🔍 Mode DRY-RUN activé (aucune modification)${NC}\n"
fi

###############################################################################
# Fonctions utilitaires
###############################################################################

print_header() {
  echo -e "\n${BLUE}===================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===================================================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

human_readable_size() {
  local size=$1
  if command -v numfmt &> /dev/null; then
    numfmt --to=iec-i --suffix=B --format="%.1f" "$size"
  else
    echo "$((size / 1024 / 1024)) MB"
  fi
}

###############################################################################
# Vérifications préalables
###############################################################################

print_header "Vérifications préalables"

# Vérifier qu'on est à la racine du projet
if [[ ! -f "package.json" ]] || [[ ! -d "public" ]]; then
  print_error "Ce script doit être exécuté depuis la racine du projet Répét"
  exit 1
fi

print_success "Racine du projet détectée"

# Vérifier que public/voices existe
if [[ ! -d "public/voices" ]]; then
  print_error "Le dossier public/voices n'existe pas"
  exit 1
fi

print_success "Structure de base valide"

###############################################################################
# Analyse de l'état actuel
###############################################################################

print_header "Analyse de l'état actuel"

# Compter les modèles .onnx dans public/
PUBLIC_MODELS_COUNT=0
PUBLIC_MODELS_SIZE=0

if [[ -d "public/models" ]]; then
  PUBLIC_MODELS_COUNT=$(find public/models -name "*.onnx" 2>/dev/null | wc -l)
  PUBLIC_MODELS_SIZE=$(du -sb public/models 2>/dev/null | cut -f1)
  print_warning "Ancienne structure détectée : public/models/ ($(human_readable_size $PUBLIC_MODELS_SIZE), $PUBLIC_MODELS_COUNT fichiers .onnx)"
else
  print_success "Pas d'ancienne structure public/models/"
fi

# Compter les modèles dans public/voices
VOICES_COUNT=$(find public/voices -name "*.onnx" 2>/dev/null | wc -l)
VOICES_SIZE=$(du -sb public/voices 2>/dev/null | cut -f1)
print_info "Structure actuelle : public/voices/ ($(human_readable_size $VOICES_SIZE), $VOICES_COUNT fichiers .onnx)"

# Vérifier la duplication (fichiers à la racine ET dans sous-dossiers)
VOICES_ROOT_COUNT=$(find public/voices -maxdepth 1 -name "*.onnx" 2>/dev/null | wc -l)
VOICES_SUBDIR_COUNT=$(find public/voices -mindepth 2 -name "*.onnx" 2>/dev/null | wc -l)

if [[ $VOICES_ROOT_COUNT -gt 0 ]] && [[ $VOICES_SUBDIR_COUNT -gt 0 ]]; then
  print_warning "Duplication détectée : $VOICES_ROOT_COUNT fichiers à la racine + $VOICES_SUBDIR_COUNT dans sous-dossiers"
fi

###############################################################################
# OPTIMISATION #1 : Supprimer public/models (ancienne structure)
###############################################################################

print_header "Optimisation #1 : Suppression de l'ancienne structure"

if [[ -d "public/models" ]]; then
  # Vérifier qu'aucun code ne référence models/piper
  REFERENCES=$(grep -r "models/piper" src/ 2>/dev/null | wc -l || echo 0)

  if [[ $REFERENCES -gt 0 ]]; then
    print_error "Le code source référence encore 'models/piper' ($REFERENCES occurrences)"
    print_info "Fichiers concernés :"
    grep -rn "models/piper" src/ || true
    print_warning "Correction manuelle requise avant suppression"
  else
    print_success "Aucune référence à 'models/piper' dans le code source"

    if [[ "$DRY_RUN" == true ]]; then
      print_info "[DRY-RUN] Supprimerait : public/models/ ($(human_readable_size $PUBLIC_MODELS_SIZE))"
    else
      print_info "Suppression de public/models/..."
      rm -rf public/models
      print_success "public/models/ supprimé (gain : $(human_readable_size $PUBLIC_MODELS_SIZE))"
    fi
  fi
else
  print_success "public/models/ n'existe pas (déjà optimisé)"
fi

###############################################################################
# OPTIMISATION #2 : Éliminer duplication dans public/voices
###############################################################################

print_header "Optimisation #2 : Élimination de la duplication dans voices/"

if [[ $VOICES_ROOT_COUNT -gt 0 ]]; then
  print_warning "Fichiers .onnx trouvés à la racine de public/voices/ : $VOICES_ROOT_COUNT"

  # Lister les fichiers
  print_info "Fichiers à supprimer :"
  find public/voices -maxdepth 1 -name "*.onnx" -o -name "*.onnx.json" | while read -r file; do
    echo "  - $file"
  done

  if [[ "$DRY_RUN" == true ]]; then
    DUPLICATE_SIZE=$(find public/voices -maxdepth 1 \( -name "*.onnx" -o -name "*.onnx.json" \) -exec du -sb {} + | awk '{sum+=$1} END {print sum}')
    print_info "[DRY-RUN] Supprimerait $(human_readable_size $DUPLICATE_SIZE) de fichiers dupliqués"
  else
    # Supprimer les fichiers .onnx et .onnx.json à la racine (garder manifest.json et .gitkeep)
    find public/voices -maxdepth 1 \( -name "*.onnx" -o -name "*.onnx.json" \) -delete
    print_success "Fichiers dupliqués supprimés"
  fi
else
  print_success "Pas de duplication détectée (fichiers uniquement dans sous-dossiers)"
fi

###############################################################################
# OPTIMISATION #3 : Vérification de la config Vite
###############################################################################

print_header "Optimisation #3 : Vérification de vite.config.offline.ts"

# Vérifier que le config filtre bien les fichiers WASM
if grep -q "node_modules/onnxruntime-web/dist/\*\.wasm" vite.config.offline.ts 2>/dev/null; then
  print_warning "La config Vite copie TOUS les fichiers .wasm d'ONNX Runtime"
  print_info "Recommandation : modifier vite.config.offline.ts pour ne copier que :"
  echo "  - ort-wasm-simd-threaded.wasm"
  echo "  - ort-wasm-simd-threaded.mjs"
  print_info "Voir docs/OFFLINE_BUILD_OPTIMIZATION.md pour le code à appliquer"
elif grep -q "ort-wasm-simd-threaded\.wasm" vite.config.offline.ts 2>/dev/null; then
  print_success "Config Vite optimisée (copie sélective des fichiers WASM)"
else
  print_warning "Impossible de déterminer la stratégie de copie WASM"
  print_info "Vérifier manuellement vite.config.offline.ts"
fi

###############################################################################
# Rebuild et vérification
###############################################################################

if [[ "$DRY_RUN" == false ]]; then
  print_header "Rebuild du projet"

  print_info "Nettoyage de l'ancien build..."
  rm -rf dist-offline

  print_info "Lancement du build offline..."
  npm run build:offline

  if [[ -d "dist-offline" ]]; then
    print_success "Build terminé"

    # Analyse du résultat
    print_header "Analyse du build optimisé"

    TOTAL_SIZE=$(du -sb dist-offline 2>/dev/null | cut -f1)
    TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))

    echo -e "${BLUE}Répartition de l'espace :${NC}"
    du -sh dist-offline/* 2>/dev/null | sort -h | while read -r line; do
      echo "  $line"
    done

    echo ""
    print_info "Taille totale : ${TOTAL_SIZE_MB} MB"

    # Vérifier le nombre de fichiers .onnx
    ONNX_COUNT=$(find dist-offline -name "*.onnx" 2>/dev/null | wc -l)
    echo ""
    print_info "Nombre de fichiers .onnx dans le build : $ONNX_COUNT"

    # Recommandations finales
    echo ""
    if [[ $TOTAL_SIZE_MB -gt 400 ]]; then
      print_warning "Taille encore élevée (> 400 MB)"
      print_info "Actions recommandées :"
      echo "  1. Vérifier qu'il n'y a pas de duplication des .onnx (attendu : 4 fichiers)"
      echo "  2. Optimiser vite.config.offline.ts pour filtrer les fichiers WASM"
      echo "  3. Voir docs/OFFLINE_BUILD_OPTIMIZATION.md pour plus de détails"
    elif [[ $TOTAL_SIZE_MB -le 350 ]]; then
      print_success "Taille optimale atteinte ! (≤ 350 MB)"
      print_info "Le build est prêt pour le déploiement"
    else
      print_success "Bonne optimisation (350-400 MB)"
      print_info "Optimisations supplémentaires possibles, voir la doc"
    fi

  else
    print_error "Le build a échoué"
    exit 1
  fi
fi

###############################################################################
# Résumé
###############################################################################

print_header "Résumé des optimisations"

if [[ "$DRY_RUN" == true ]]; then
  echo "Mode DRY-RUN : aucune modification appliquée"
  echo ""
  echo "Actions qui seraient effectuées :"
  [[ -d "public/models" ]] && echo "  - Suppression de public/models/"
  [[ $VOICES_ROOT_COUNT -gt 0 ]] && echo "  - Suppression des fichiers .onnx dupliqués dans public/voices/"
  echo ""
  echo "Pour appliquer les changements, relancer sans --dry-run :"
  echo "  ./scripts/optimize-offline-build.sh"
else
  print_success "Optimisations terminées !"
  echo ""
  echo "Prochaines étapes :"
  echo "  1. Tester le build : npm run preview:offline"
  echo "  2. Vérifier le fonctionnement des 3 voix principales"
  echo "  3. Tester en mode offline (DevTools → Network → Offline)"
  echo "  4. Déployer sur app.repet.com"
  echo ""
  echo "Documentation complète : docs/OFFLINE_BUILD_OPTIMIZATION.md"
fi

echo ""
print_success "Script terminé"
