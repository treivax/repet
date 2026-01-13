#!/bin/bash

# Script de téléchargement des modèles Piper pour TTS offline
# Copyright (c) 2025 Répét Contributors
# Licensed under the MIT License

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$PROJECT_ROOT/public/models/piper"
BASE_URL="https://huggingface.co/diffusionstudio/piper-voices/resolve/main"

# Créer le dossier si nécessaire
mkdir -p "$MODELS_DIR"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Téléchargement des modèles Piper${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${YELLOW}Destination: $MODELS_DIR${NC}"
echo ""

# Liste des voix à télécharger (format: "chemin/sur/huggingface nom_fichier")
VOICES=(
  "fr/fr_FR/siwis/medium fr_FR-siwis-medium"
  "fr/fr_FR/tom/medium fr_FR-tom-medium"
  "fr/fr_FR/upmc/medium fr_FR-upmc-medium"
  "fr/fr_FR/mls/medium fr_FR-mls-medium"
)

# Fonction pour télécharger un fichier avec gestion d'erreur
download_file() {
  local url="$1"
  local output="$2"
  local filename=$(basename "$output")

  if [ -f "$output" ]; then
    echo -e "${YELLOW}  ⏭️  $filename déjà présent, skip${NC}"
    return 0
  fi

  echo -e "${BLUE}  📥 Téléchargement de $filename...${NC}"

  if command -v wget &> /dev/null; then
    wget -q --show-progress -O "$output" "$url" || {
      echo -e "${RED}  ❌ Échec du téléchargement de $filename${NC}"
      rm -f "$output"
      return 1
    }
  elif command -v curl &> /dev/null; then
    curl -L -o "$output" --progress-bar "$url" || {
      echo -e "${RED}  ❌ Échec du téléchargement de $filename${NC}"
      rm -f "$output"
      return 1
    }
  else
    echo -e "${RED}❌ wget ou curl requis pour télécharger les fichiers${NC}"
    exit 1
  fi

  echo -e "${GREEN}  ✅ $filename téléchargé${NC}"
  return 0
}

# Compteurs
total_voices=${#VOICES[@]}
current=0
failed=0

# Télécharger chaque voix
for voice_info in "${VOICES[@]}"; do
  current=$((current + 1))

  # Séparer le chemin et le nom
  hf_path=$(echo "$voice_info" | cut -d' ' -f1)
  file_name=$(echo "$voice_info" | cut -d' ' -f2)

  echo ""
  echo -e "${BLUE}[$current/$total_voices] Voix: $file_name${NC}"

  # Télécharger le modèle .onnx
  model_url="$BASE_URL/$hf_path/$file_name.onnx"
  model_file="$MODELS_DIR/$file_name.onnx"
  download_file "$model_url" "$model_file" || failed=$((failed + 1))

  # Télécharger la config .json
  config_url="$BASE_URL/$hf_path/$file_name.onnx.json"
  config_file="$MODELS_DIR/$file_name.onnx.json"
  download_file "$config_url" "$config_file" || failed=$((failed + 1))
done

echo ""
echo -e "${BLUE}=====================================${NC}"

# Vérification finale
if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les modèles ont été téléchargés avec succès !${NC}"
  echo ""
  echo -e "${BLUE}Fichiers téléchargés :${NC}"
  ls -lh "$MODELS_DIR"/*.onnx 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  echo ""

  # Calculer la taille totale
  total_size=$(du -sh "$MODELS_DIR" | cut -f1)
  echo -e "${GREEN}Taille totale : $total_size${NC}"
  echo ""
  echo -e "${GREEN}🎉 L'application peut maintenant fonctionner en mode offline !${NC}"
else
  echo -e "${RED}⚠️  $failed téléchargement(s) ont échoué${NC}"
  echo -e "${YELLOW}Veuillez vérifier votre connexion internet et réessayer${NC}"
  exit 1
fi

echo -e "${BLUE}=====================================${NC}"
