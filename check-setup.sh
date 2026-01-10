#!/bin/bash

echo "🔍 Vérification du setup Répét"
echo "================================"
echo ""

echo "📦 Node.js version:"
node --version
echo ""

echo "📦 npm version:"
npm --version
echo ""

echo "🔧 Type-check TypeScript..."
npm run type-check
echo ""

echo "🔧 Linting..."
npm run lint
echo ""

echo "✅ Si aucune erreur ci-dessus, le setup est OK !"
echo "➡️  Prochaine étape : Exécuter le Prompt 02"
