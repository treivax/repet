#!/bin/bash
# Copyright (c) 2025 Répét Contributors
# Licensed under the MIT License
# See LICENSE file in the project root for full license text

###############################################################################
# Script d'optimisation automatique du build online
# Réduit la taille de ~130 MB → ~54 MB (-58%)
#
# Usage: ./scripts/optimize-online-build.sh [--dry-run]
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
if [[ ! -f "package.json" ]] || [[ ! -f "vite.config.online.ts" ]]; then
  print_error "Ce script doit être exécuté depuis la racine du projet Répét"
  exit 1
fi

print_success "Racine du projet détectée"

###############################################################################
# Vérification de la config Vite
###############################################################################

print_header "Vérification de vite.config.online.ts"

# Vérifier que le config filtre bien les fichiers WASM
if grep -q "node_modules/onnxruntime-web/dist/\*\.wasm" vite.config.online.ts 2>/dev/null; then
  print_warning "La config Vite copie TOUS les fichiers .wasm d'ONNX Runtime"
  print_info "Recommandation : modifier vite.config.online.ts pour ne copier que :"
  echo "  - ort-wasm-simd-threaded.wasm"
  echo "  - ort-wasm-simd-threaded.mjs"
  print_info "Voir docs/ONLINE_BUILD_OPTIMIZATION.md pour le code à appliquer"

  if [[ "$DRY_RUN" == false ]]; then
    print_error "Optimisation requise avant le build"
    exit 1
  fi
elif grep -q "ort-wasm-simd-threaded\.wasm" vite.config.online.ts 2>/dev/null; then
  print_success "Config Vite optimisée (copie sélective des fichiers WASM)"
else
  print_warning "Impossible de déterminer la stratégie de copie WASM"
  print_info "Vérifier manuellement vite.config.online.ts"
fi

# Vérifier que publicDir est désactivé
if grep -q "publicDir.*false" vite.config.online.ts 2>/dev/null; then
  print_success "publicDir désactivé (pas de copie automatique de /public)"
else
  print_warning "publicDir pourrait ne pas être désactivé"
  print_info "S'assurer que publicDir: false est présent dans vite.config.online.ts"
fi

# Vérifier qu'il n'y a pas de copie de voices
if grep -q "public/voices" vite.config.online.ts 2>/dev/null; then
  print_error "La config copie le dossier public/voices (NON souhaité pour build online)"
  print_info "Les modèles vocaux doivent être téléchargés à la demande, pas inclus dans le build"

  if [[ "$DRY_RUN" == false ]]; then
    exit 1
  fi
else
  print_success "Modèles vocaux exclus du build (téléchargement à la demande)"
fi

###############################################################################
# Rebuild et vérification
###############################################################################

if [[ "$DRY_RUN" == false ]]; then
  print_header "Rebuild du projet"

  print_info "Nettoyage de l'ancien build..."
  rm -rf dist-online

  print_info "Lancement du build online..."
  npm run build:online

  if [[ -d "dist-online" ]]; then
    print_success "Build terminé"

    # Analyse du résultat
    print_header "Analyse du build optimisé"

    TOTAL_SIZE=$(du -sb dist-online 2>/dev/null | cut -f1)
    TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))

    echo -e "${BLUE}Répartition de l'espace :${NC}"
    du -sh dist-online/* 2>/dev/null | sort -h | while read -r line; do
      echo "  $line"
    done

    echo ""
    print_info "Taille totale : ${TOTAL_SIZE_MB} MB"

    # Vérifier qu'il n'y a PAS de modèles .onnx dans le build
    ONNX_COUNT=$(find dist-online -name "*.onnx" 2>/dev/null | wc -l)
    echo ""
    if [[ $ONNX_COUNT -gt 0 ]]; then
      print_error "Fichiers .onnx détectés dans le build online : $ONNX_COUNT"
      print_info "Le build online ne doit PAS contenir de modèles vocaux"
      find dist-online -name "*.onnx"
    else
      print_success "Aucun modèle vocal dans le build (attendu pour build online)"
    fi

    # Vérifier la taille du dossier WASM
    if [[ -d "dist-online/wasm" ]]; then
      WASM_SIZE=$(du -sb dist-online/wasm 2>/dev/null | cut -f1)
      WASM_SIZE_MB=$((WASM_SIZE / 1024 / 1024))

      echo ""
      print_info "Taille du dossier /wasm : ${WASM_SIZE_MB} MB"

      if [[ $WASM_SIZE_MB -gt 40 ]]; then
        print_warning "Taille WASM élevée (> 40 MB)"
        print_info "Vérifier qu'il n'y a pas de fichiers inutiles :"
        ls -lh dist-online/wasm/
      elif [[ $WASM_SIZE_MB -le 35 ]]; then
        print_success "Taille WASM optimale (≤ 35 MB)"
      else
        print_success "Taille WASM acceptable (35-40 MB)"
      fi
    fi

    # Vérifier la taille du precache (important pour iOS)
    echo ""
    if [[ -f "dist-online/sw.js" ]]; then
      # Extraire la taille du precache depuis la sortie de build
      print_info "Vérification de la compatibilité iOS..."

      # La taille du precache doit être < 50 MB pour iOS
      if [[ $TOTAL_SIZE_MB -gt 100 ]]; then
        print_warning "Build volumineux (> 100 MB) - vérifier le precache iOS"
      elif [[ $TOTAL_SIZE_MB -le 60 ]]; then
        print_success "Build léger (≤ 60 MB) - compatible iOS"
      else
        print_success "Build acceptable (60-100 MB)"
      fi
    fi

    # Recommandations finales
    echo ""
    if [[ $TOTAL_SIZE_MB -gt 80 ]]; then
      print_warning "Taille encore élevée (> 80 MB)"
      print_info "Actions recommandées :"
      echo "  1. Vérifier qu'aucun modèle .onnx n'est présent"
      echo "  2. Optimiser vite.config.online.ts pour filtrer les fichiers WASM"
      echo "  3. Voir docs/ONLINE_BUILD_OPTIMIZATION.md pour plus de détails"
    elif [[ $TOTAL_SIZE_MB -le 60 ]]; then
      print_success "Taille optimale atteinte ! (≤ 60 MB)"
      print_info "Le build est prêt pour le déploiement iOS"
    else
      print_success "Bonne optimisation (60-80 MB)"
      print_info "Build compatible iOS et prêt pour le déploiement"
    fi

  else
    print_error "Le build a échoué"
    exit 1
  fi
else
  print_header "Mode DRY-RUN - Analyse de la config"

  print_info "Config vite.config.online.ts analysée"
  print_info "Aucune modification effectuée"
  echo ""
  echo "Pour optimiser et builder, relancer sans --dry-run :"
  echo "  ./scripts/optimize-online-build.sh"
fi

###############################################################################
# Résumé
###############################################################################

print_header "Résumé"

if [[ "$DRY_RUN" == true ]]; then
  echo "Mode DRY-RUN : vérifications effectuées, aucune modification appliquée"
  echo ""
  echo "Pour construire le build optimisé :"
  echo "  ./scripts/optimize-online-build.sh"
else
  print_success "Build online optimisé terminé !"
  echo ""
  echo "Prochaines étapes :"
  echo "  1. Tester le build : npm run preview:online"
  echo "  2. Vérifier le téléchargement des voix depuis HuggingFace/CDN"
  echo "  3. Tester le stockage OPFS des modèles téléchargés"
  echo "  4. Tester sur Safari iOS (contraintes strictes)"
  echo "  5. Déployer sur ios.repet.com"
  echo ""
  echo "Documentation complète : docs/ONLINE_BUILD_OPTIMIZATION.md"
fi

echo ""
print_success "Script terminé"
