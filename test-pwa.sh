#!/bin/bash

# Script de test PWA pour Répét
# Usage: ./test-pwa.sh

set -e

echo "🔨 Building production version..."
npm run build

echo ""
echo "🚀 Starting preview server..."
echo ""
echo "📱 Pour tester l'installation PWA :"
echo "   1. Ouvrez http://localhost:4173 dans Chrome"
echo "   2. Attendez quelques secondes"
echo "   3. Cherchez l'icône ⊕ dans la barre d'adresse"
echo "   4. Ou Menu (⋮) → 'Installer Répét...'"
echo ""
echo "🛑 Pour arrêter le serveur : Ctrl+C"
echo ""

npm run preview
