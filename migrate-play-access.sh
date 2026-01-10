#!/bin/bash

# Script de migration pour remplacer les accès directs à Play par les helpers

echo "🔄 Migration des accès à Play vers les helpers..."

# Fonction pour remplacer dans un fichier
migrate_file() {
  local file=$1
  echo "  📝 Migration de $file..."

  # Sauvegarder le fichier original
  cp "$file" "$file.bak"

  # Remplacer play.title par getPlayTitle(play)
  sed -i "s/play\.title/getPlayTitle(play)/g" "$file"

  # Remplacer play.author par getPlayAuthor(play)
  sed -i "s/play\.author/getPlayAuthor(play)/g" "$file"

  # Remplacer play.year par getPlayYear(play)
  sed -i "s/play\.year/getPlayYear(play)/g" "$file"

  # Remplacer play.category par getPlayCategory(play)
  sed -i "s/play\.category/getPlayCategory(play)/g" "$file"

  # Remplacer play.characters par getPlayCharacters(play)
  sed -i "s/play\.characters/getPlayCharacters(play)/g" "$file"

  # Remplacer play.lines par getPlayLines(play)
  sed -i "s/play\.lines/getPlayLines(play)/g" "$file"

  # Remplacer play.content par getPlayActs(play) (approximation, à vérifier)
  sed -i "s/play\.content/getPlayActs(play)/g" "$file"

  # Remplacer currentPlay.title par getPlayTitle(currentPlay)
  sed -i "s/currentPlay\.title/getPlayTitle(currentPlay)/g" "$file"

  # Remplacer currentPlay.author par getPlayAuthor(currentPlay)
  sed -i "s/currentPlay\.author/getPlayAuthor(currentPlay)/g" "$file"

  # Remplacer currentPlay.characters par getPlayCharacters(currentPlay)
  sed -i "s/currentPlay\.characters/getPlayCharacters(currentPlay)/g" "$file"

  # Remplacer currentPlay.lines par getPlayLines(currentPlay)
  sed -i "s/currentPlay\.lines/getPlayLines(currentPlay)/g" "$file"

  # Ajouter les imports nécessaires si le fichier contient des helpers
  if grep -q "getPlay" "$file"; then
    # Vérifier si l'import existe déjà
    if ! grep -q "from.*playHelpers" "$file"; then
      # Trouver la première ligne d'import depuis core/models
      if grep -q "from.*core/models" "$file"; then
        # Ajouter l'import après la première importation de models
        sed -i "/from.*core\/models/a import { getPlayTitle, getPlayAuthor, getPlayYear, getPlayCategory, getPlayCharacters, getPlayLines, getPlayActs } from '../core/models/playHelpers'" "$file"
      else
        echo "  ⚠️  Besoin d'ajouter manuellement l'import des helpers dans $file"
      fi
    fi
  fi
}

# Liste des fichiers à migrer
files=(
  "src/screens/PlayScreen.tsx"
  "src/screens/ReaderScreen.tsx"
  "src/state/playStore.ts"
  "src/state/selectors.ts"
)

# Migrer chaque fichier
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    migrate_file "$file"
  else
    echo "  ⚠️  Fichier non trouvé: $file"
  fi
done

echo "✅ Migration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier les fichiers .bak pour comparaison"
echo "  2. Exécuter 'npm run type-check' pour vérifier"
echo "  3. Corriger manuellement les imports si nécessaire"
echo "  4. Supprimer les fichiers .bak une fois validé"
