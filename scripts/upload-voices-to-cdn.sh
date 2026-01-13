#!/bin/bash

###############################################################################
# Copyright (c) 2025 Répét Contributors
# Licensed under the MIT License
# See LICENSE file in the project root for full license text
###############################################################################

#
# Script d'upload des fichiers vocaux vers le CDN
#
# Supporte plusieurs backends :
# - Cloudflare R2 (recommandé, gratuit)
# - AWS S3 + CloudFront
# - GitHub Releases + jsDelivr
#
# Usage:
#   ./scripts/upload-voices-to-cdn.sh [backend] [version]
#
# Exemples:
#   ./scripts/upload-voices-to-cdn.sh r2 v1
#   ./scripts/upload-voices-to-cdn.sh s3 v1
#   ./scripts/upload-voices-to-cdn.sh github v1.0.0
#

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VOICES_DIR="public/voices"
BACKEND="${1:-r2}"
VERSION="${2:-v1}"

# Vérifier que le dossier voices existe
if [ ! -d "$VOICES_DIR" ]; then
  echo -e "${RED}❌ Erreur: Le dossier $VOICES_DIR n'existe pas${NC}"
  echo "Exécutez d'abord: npm run download-models"
  exit 1
fi

# Vérifier qu'il y a des fichiers
if [ -z "$(ls -A $VOICES_DIR)" ]; then
  echo -e "${RED}❌ Erreur: Le dossier $VOICES_DIR est vide${NC}"
  echo "Exécutez d'abord: npm run download-models"
  exit 1
fi

# Afficher les fichiers à uploader
echo -e "${BLUE}📦 Fichiers à uploader depuis $VOICES_DIR:${NC}"
ls -lh "$VOICES_DIR"
echo ""

# Calculer la taille totale
TOTAL_SIZE=$(du -sh "$VOICES_DIR" | cut -f1)
echo -e "${BLUE}📊 Taille totale: $TOTAL_SIZE${NC}"
echo ""

# Demander confirmation
read -p "Continuer l'upload vers $BACKEND ($VERSION) ? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Annulé."
  exit 0
fi

###############################################################################
# Backend: Cloudflare R2
###############################################################################
if [ "$BACKEND" = "r2" ]; then
  echo -e "${BLUE}🌐 Upload vers Cloudflare R2...${NC}"

  # Vérifier que rclone est installé
  if ! command -v rclone &> /dev/null; then
    echo -e "${RED}❌ rclone n'est pas installé${NC}"
    echo "Installez-le avec:"
    echo "  macOS: brew install rclone"
    echo "  Linux: apt install rclone ou yum install rclone"
    exit 1
  fi

  # Vérifier que le remote R2 est configuré
  if ! rclone listremotes | grep -q "r2:"; then
    echo -e "${YELLOW}⚠️  Remote 'r2' non configuré${NC}"
    echo "Configurez-le avec: rclone config"
    echo "Choisissez: Cloudflare R2"
    exit 1
  fi

  BUCKET_NAME="${R2_BUCKET:-repet-voices}"
  REMOTE_PATH="r2:$BUCKET_NAME/$VERSION"

  echo -e "${BLUE}📤 Upload vers $REMOTE_PATH${NC}"

  # Upload avec rclone (affiche la progression)
  rclone copy "$VOICES_DIR/" "$REMOTE_PATH/" \
    --progress \
    --transfers 4 \
    --checkers 8 \
    --stats 1s \
    --stats-one-line

  echo ""
  echo -e "${GREEN}✅ Upload terminé !${NC}"
  echo -e "${BLUE}🔗 URL publique:${NC}"
  echo "   https://pub-[ID].r2.dev/$VERSION/"
  echo ""
  echo -e "${YELLOW}⚠️  N'oubliez pas de:${NC}"
  echo "   1. Activer l'accès public dans le dashboard R2"
  echo "   2. Configurer CORS (voir docs/CDN_SETUP.md)"
  echo "   3. Mettre à jour l'URL dans src/core/tts/offline/NetworkInterceptor.ts"

###############################################################################
# Backend: AWS S3
###############################################################################
elif [ "$BACKEND" = "s3" ]; then
  echo -e "${BLUE}🌐 Upload vers AWS S3...${NC}"

  # Vérifier que aws-cli est installé
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ aws-cli n'est pas installé${NC}"
    echo "Installez-le avec:"
    echo "  macOS: brew install awscli"
    echo "  Linux: apt install awscli"
    exit 1
  fi

  BUCKET_NAME="${S3_BUCKET:-repet-voices}"
  S3_PATH="s3://$BUCKET_NAME/$VERSION/"

  echo -e "${BLUE}📤 Upload vers $S3_PATH${NC}"

  # Upload avec aws s3 sync
  aws s3 sync "$VOICES_DIR/" "$S3_PATH" \
    --acl public-read \
    --cache-control "max-age=31536000" \
    --content-type "application/octet-stream" \
    --metadata-directive REPLACE

  echo ""
  echo -e "${GREEN}✅ Upload terminé !${NC}"
  echo -e "${BLUE}🔗 URL publique:${NC}"
  echo "   https://$BUCKET_NAME.s3.amazonaws.com/$VERSION/"
  echo ""
  echo -e "${YELLOW}⚠️  N'oubliez pas de:${NC}"
  echo "   1. Configurer CORS (voir docs/CDN_SETUP.md)"
  echo "   2. Configurer CloudFront (optionnel mais recommandé)"
  echo "   3. Mettre à jour l'URL dans src/core/tts/offline/NetworkInterceptor.ts"

###############################################################################
# Backend: GitHub Releases
###############################################################################
elif [ "$BACKEND" = "github" ]; then
  echo -e "${BLUE}🌐 Upload vers GitHub Releases...${NC}"

  # Vérifier que gh est installé
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) n'est pas installé${NC}"
    echo "Installez-le avec:"
    echo "  macOS: brew install gh"
    echo "  Linux: apt install gh"
    exit 1
  fi

  # Vérifier l'authentification
  if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Non authentifié avec GitHub${NC}"
    echo "Exécutez: gh auth login"
    exit 1
  fi

  # Créer la release avec les fichiers
  echo -e "${BLUE}📤 Création de la release $VERSION...${NC}"

  cd "$VOICES_DIR"

  # Liste des fichiers à uploader
  FILES=$(ls -1 *.onnx *.json 2>/dev/null)

  if [ -z "$FILES" ]; then
    echo -e "${RED}❌ Aucun fichier .onnx ou .json trouvé${NC}"
    exit 1
  fi

  # Créer la release
  gh release create "$VERSION" \
    $FILES \
    --title "Voice Models $VERSION" \
    --notes "Modèles vocaux Piper pour Répét

Voix incluses:
- fr_FR-siwis-medium (61 MB)
- fr_FR-tom-medium (61 MB)
- fr_FR-upmc-medium (74 MB)
- fr_FR-mls-medium (74 MB)

Taille totale: ~268 MB

Utilisation via jsDelivr CDN:
https://cdn.jsdelivr.net/gh/OWNER/REPO@$VERSION/[fichier]
"

  cd - > /dev/null

  echo ""
  echo -e "${GREEN}✅ Release créée !${NC}"
  echo -e "${BLUE}🔗 URL publique (via jsDelivr):${NC}"
  echo "   https://cdn.jsdelivr.net/gh/OWNER/REPO@$VERSION/"
  echo ""
  echo -e "${YELLOW}⚠️  N'oubliez pas de:${NC}"
  echo "   1. Remplacer OWNER/REPO par votre repository GitHub"
  echo "   2. Mettre à jour l'URL dans src/core/tts/offline/NetworkInterceptor.ts"

###############################################################################
# Backend inconnu
###############################################################################
else
  echo -e "${RED}❌ Backend '$BACKEND' inconnu${NC}"
  echo ""
  echo "Backends supportés:"
  echo "  r2      - Cloudflare R2 (recommandé, gratuit)"
  echo "  s3      - AWS S3 + CloudFront"
  echo "  github  - GitHub Releases + jsDelivr"
  echo ""
  echo "Usage:"
  echo "  $0 [backend] [version]"
  echo ""
  echo "Exemples:"
  echo "  $0 r2 v1"
  echo "  $0 s3 v1"
  echo "  $0 github v1.0.0"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 Processus terminé !${NC}"

###############################################################################
# Tests recommandés
###############################################################################
echo ""
echo -e "${BLUE}🧪 Tests recommandés:${NC}"
echo "  1. Tester l'accès HTTP:"
echo "     curl -I [URL]/fr_FR-siwis-medium.onnx"
echo ""
echo "  2. Tester CORS:"
echo "     curl -I -H \"Origin: https://ios.repet.com\" [URL]/fr_FR-siwis-medium.onnx"
echo "     (doit retourner: Access-Control-Allow-Origin: *)"
echo ""
echo "  3. Tester depuis le navigateur:"
echo "     fetch('[URL]/fr_FR-siwis-medium.onnx')"
echo "       .then(r => console.log('OK'))"
echo "       .catch(e => console.error(e))"
echo ""
echo -e "${BLUE}📚 Documentation complète:${NC}"
echo "   docs/CDN_SETUP.md"
echo ""
