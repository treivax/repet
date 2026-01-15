#!/bin/bash
# Copyright (c) 2025 Répét Contributors
# Licensed under the MIT License
# See LICENSE file in the project root for full license text

###############################################################################
# Script de suppression de la voix obsolète fr_FR-mls-medium
#
# Cette voix est marquée comme obsolète car elle produit un audio
# distordu/inintelligible sur certaines lignes. Les assignations
# existantes sont automatiquement migrées vers fr_FR-tom-medium.
#
# Gain : -74 MB sur le build offline
#
# Usage: ./scripts/remove-mls-voice.sh [--dry-run]
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

print_header "Suppression de la voix obsolète fr_FR-mls-medium"

# Vérifier qu'on est à la racine du projet
if [[ ! -f "package.json" ]] || [[ ! -d "public/voices" ]]; then
  print_error "Ce script doit être exécuté depuis la racine du projet Répét"
  exit 1
fi

print_success "Racine du projet détectée"

# Afficher les informations sur la voix
print_info "Voix concernée : fr_FR-mls-medium"
print_info "Raison : Audio distordu/inintelligible sur certaines lignes"
print_info "Remplacement automatique : fr_FR-tom-medium"
echo ""

###############################################################################
# Vérification de la présence de la voix
###############################################################################

print_header "Vérification de la présence de la voix"

MLS_EXISTS=false
MLS_SIZE=0

if [[ -d "public/voices/fr_FR-mls-medium" ]]; then
  MLS_EXISTS=true
  MLS_SIZE=$(du -sb public/voices/fr_FR-mls-medium 2>/dev/null | cut -f1)
  print_warning "Dossier trouvé : public/voices/fr_FR-mls-medium/"
  print_info "Taille : $(human_readable_size $MLS_SIZE)"

  echo ""
  print_info "Contenu du dossier :"
  ls -lh public/voices/fr_FR-mls-medium/ | tail -n +2 | while read -r line; do
    echo "  $line"
  done
else
  print_success "Le dossier public/voices/fr_FR-mls-medium n'existe pas (déjà supprimé)"
fi

###############################################################################
# Vérification des références dans le code
###############################################################################

print_header "Vérification des références dans le code"

# Rechercher les références à mls-medium (hors tests, migrations et diagnostics)
REFS_COUNT=$(grep -r "mls-medium" src/ \
  --exclude-dir=__tests__ \
  --exclude="voiceMigration.ts" \
  --exclude="voiceDiagnostics.ts" \
  2>/dev/null | wc -l || echo 0)

if [[ $REFS_COUNT -gt 0 ]]; then
  print_warning "Références trouvées dans le code source ($REFS_COUNT)"
  print_info "Fichiers concernés :"
  grep -r "mls-medium" src/ \
    --exclude-dir=__tests__ \
    --exclude="voiceMigration.ts" \
    --exclude="voiceDiagnostics.ts" \
    2>/dev/null || true
  echo ""
  print_info "Note : Les références dans voiceMigration.ts et voiceDiagnostics.ts sont attendues"
else
  print_success "Aucune référence active dans le code source"
  print_info "Les migrations automatiques sont en place dans voiceMigration.ts"
fi

###############################################################################
# Vérification de la configuration Vite
###############################################################################

print_header "Vérification de vite.config.offline.ts"

if grep -q "fr_FR-mls-medium" vite.config.offline.ts 2>/dev/null; then
  print_warning "Référence trouvée dans vite.config.offline.ts"
  print_info "Ligne(s) concernée(s) :"
  grep -n "fr_FR-mls-medium" vite.config.offline.ts || true
else
  print_success "Pas de référence dans vite.config.offline.ts (déjà nettoyé)"
fi

###############################################################################
# Vérification du manifest
###############################################################################

print_header "Vérification du manifest des voix"

if [[ -f "public/voices/manifest.json" ]]; then
  if grep -q "fr_FR-mls-medium" public/voices/manifest.json; then
    print_warning "Référence trouvée dans public/voices/manifest.json"
  else
    print_success "Pas de référence dans manifest.json (déjà nettoyé)"
  fi
fi

###############################################################################
# Suppression (si pas en dry-run)
###############################################################################

if [[ "$DRY_RUN" == false ]]; then
  print_header "Suppression de la voix"

  if [[ "$MLS_EXISTS" == true ]]; then
    print_info "Suppression de public/voices/fr_FR-mls-medium/..."
    rm -rf public/voices/fr_FR-mls-medium
    print_success "Dossier supprimé (gain : $(human_readable_size $MLS_SIZE))"
  else
    print_info "Rien à supprimer (dossier déjà absent)"
  fi

  # Mettre à jour vite.config.offline.ts si nécessaire
  if grep -q "fr_FR-mls-medium" vite.config.offline.ts 2>/dev/null; then
    print_info "Nettoyage de vite.config.offline.ts..."

    # Créer une sauvegarde
    cp vite.config.offline.ts vite.config.offline.ts.backup

    # Supprimer la section mls-medium (les 4 lignes)
    sed -i '/fr_FR-mls-medium/,+3d' vite.config.offline.ts

    print_success "Référence retirée de vite.config.offline.ts"
    print_info "Sauvegarde créée : vite.config.offline.ts.backup"
  fi

  # Mettre à jour manifest.json si nécessaire
  if [[ -f "public/voices/manifest.json" ]]; then
    if grep -q "fr_FR-mls-medium" public/voices/manifest.json; then
      print_info "Nettoyage de public/voices/manifest.json..."

      # Créer une sauvegarde
      cp public/voices/manifest.json public/voices/manifest.json.backup

      # Retirer l'entrée mls-medium du JSON (approche simple avec sed)
      # Note: Pour une modification JSON robuste, utiliser jq serait préférable
      sed -i '/fr_FR-mls-medium/,/^    },\?$/d' public/voices/manifest.json

      print_success "Référence retirée de manifest.json"
      print_info "Sauvegarde créée : public/voices/manifest.json.backup"
    fi
  fi

  ###############################################################################
  # Rebuild et vérification
  ###############################################################################

  print_header "Rebuild du projet offline"

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

    # Vérifier qu'il n'y a plus de mls
    if find dist-offline -name "*mls-medium*" 2>/dev/null | grep -q .; then
      print_error "Des fichiers mls-medium sont encore présents dans le build"
      find dist-offline -name "*mls-medium*"
    else
      print_success "Aucun fichier mls-medium dans le build"
    fi

    # Recommandations finales
    echo ""
    if [[ $TOTAL_SIZE_MB -le 250 ]]; then
      print_success "Taille optimale atteinte ! (≤ 250 MB)"
      print_info "Le build est prêt pour le déploiement"
      print_info "Gain estimé : ~74 MB par rapport à la version avec MLS"
    elif [[ $TOTAL_SIZE_MB -le 280 ]]; then
      print_success "Bonne optimisation (250-280 MB)"
      print_info "Build prêt pour le déploiement"
    else
      print_info "Taille actuelle : ${TOTAL_SIZE_MB} MB"
    fi

  else
    print_error "Le build a échoué"
    exit 1
  fi

else
  # Mode DRY-RUN
  print_header "Résumé (mode dry-run)"

  echo "Actions qui seraient effectuées :"
  echo ""

  if [[ "$MLS_EXISTS" == true ]]; then
    echo "  1. Suppression de public/voices/fr_FR-mls-medium/"
    echo "     Gain : $(human_readable_size $MLS_SIZE)"
  fi

  if grep -q "fr_FR-mls-medium" vite.config.offline.ts 2>/dev/null; then
    echo "  2. Nettoyage de vite.config.offline.ts"
  fi

  if [[ -f "public/voices/manifest.json" ]] && grep -q "fr_FR-mls-medium" public/voices/manifest.json; then
    echo "  3. Nettoyage de public/voices/manifest.json"
  fi

  echo "  4. Rebuild du projet offline"
  echo "  5. Vérification de l'absence de mls-medium dans le build"
  echo ""
  echo "Pour appliquer ces changements, relancer sans --dry-run :"
  echo "  ./scripts/remove-mls-voice.sh"
fi

###############################################################################
# Résumé
###############################################################################

print_header "Résumé"

if [[ "$DRY_RUN" == true ]]; then
  print_info "Mode DRY-RUN : aucune modification appliquée"
  echo ""
  echo "La voix fr_FR-mls-medium est marquée comme obsolète."
  echo "Les utilisateurs ayant assigné cette voix seront automatiquement"
  echo "migrés vers fr_FR-tom-medium au prochain chargement de leur pièce."
else
  print_success "Suppression terminée !"
  echo ""
  echo "Prochaines étapes :"
  echo "  1. Tester le build : npm run preview:offline"
  echo "  2. Vérifier que les 3 voix principales fonctionnent (siwis, tom, upmc)"
  echo "  3. Tester la migration automatique (si des pièces utilisaient MLS)"
  echo "  4. Déployer sur app.repet.com"
  echo ""
  echo "Note : Les assignations existantes de fr_FR-mls-medium seront"
  echo "       automatiquement migrées vers fr_FR-tom-medium."
fi

echo ""
print_success "Script terminé"
