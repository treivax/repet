#!/bin/bash

# Copyright (c) 2024 Répét
# Script de validation automatique de la fonctionnalité Notes - Phase 6

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  📋 Validation Automatique - Fonctionnalité Notes (Phase 6)   "
echo "════════════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Fonction pour afficher résultat de test
test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"

    if [ "$result" = "PASS" ]; then
        echo -e "  ${GREEN}✓${NC} ${test_name}"
        ((PASS_COUNT++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "  ${RED}✗${NC} ${test_name}"
        if [ -n "$message" ]; then
            echo -e "    ${RED}→${NC} $message"
        fi
        ((FAIL_COUNT++))
    elif [ "$result" = "WARN" ]; then
        echo -e "  ${YELLOW}⚠${NC} ${test_name}"
        if [ -n "$message" ]; then
            echo -e "    ${YELLOW}→${NC} $message"
        fi
        ((WARN_COUNT++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Tests de Build et Qualité du Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1.1: TypeScript check
echo ""
echo "🔍 Type checking..."
if npm run type-check > /dev/null 2>&1; then
    test_result "TypeScript compilation sans erreur" "PASS"
else
    test_result "TypeScript compilation" "FAIL" "Des erreurs de type existent"
fi

# Test 1.2: Linting
echo ""
echo "🔍 Linting..."
if npm run lint > /dev/null 2>&1; then
    test_result "ESLint sans warnings" "PASS"
else
    test_result "ESLint" "FAIL" "Des warnings/erreurs ESLint existent"
fi

# Test 1.3: Build production
echo ""
echo "🔍 Build production..."
if npm run build > /dev/null 2>&1; then
    test_result "Build production réussit" "PASS"
else
    test_result "Build production" "FAIL" "Le build échoue"
fi

# Test 1.4: Vérifier console.log
echo ""
echo "🔍 Vérification code debug..."
DEBUG_COUNT=$(grep -r "console\.\(log\|debug\|info\)" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$DEBUG_COUNT" -eq 0 ]; then
    test_result "Pas de console.log/debug en production" "PASS"
else
    test_result "Console.log présents" "WARN" "$DEBUG_COUNT occurrences trouvées"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Vérification Fichiers Notes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2.1: Fichiers modèles
if [ -f "src/core/models/note.ts" ]; then
    test_result "Modèle Note existe" "PASS"
else
    test_result "Modèle Note" "FAIL" "Fichier src/core/models/note.ts manquant"
fi

if [ -f "src/core/models/noteConstants.ts" ]; then
    test_result "Constantes Note existent" "PASS"
else
    test_result "Constantes Note" "FAIL" "Fichier src/core/models/noteConstants.ts manquant"
fi

# Test 2.2: Stockage
if [ -f "src/core/storage/notesStorage.ts" ]; then
    test_result "NotesStorage existe" "PASS"
else
    test_result "NotesStorage" "FAIL" "Fichier src/core/storage/notesStorage.ts manquant"
fi

# Test 2.3: Contexte et Hook
if [ -f "src/components/notes/NotesProvider.tsx" ]; then
    test_result "NotesProvider existe" "PASS"
else
    test_result "NotesProvider" "FAIL" "Fichier src/components/notes/NotesProvider.tsx manquant"
fi

if [ -f "src/hooks/useNotes.ts" ]; then
    test_result "Hook useNotes existe" "PASS"
else
    test_result "Hook useNotes" "FAIL" "Fichier src/hooks/useNotes.ts manquant"
fi

# Test 2.4: Composants UI
if [ -f "src/components/notes/Note.tsx" ]; then
    test_result "Composant Note existe" "PASS"
else
    test_result "Composant Note" "FAIL" "Fichier src/components/notes/Note.tsx manquant"
fi

if [ -f "src/components/notes/NoteIcon.tsx" ]; then
    test_result "Composant NoteIcon existe" "PASS"
else
    test_result "Composant NoteIcon" "FAIL" "Fichier src/components/notes/NoteIcon.tsx manquant"
fi

if [ -f "src/hooks/useLongPress.ts" ]; then
    test_result "Hook useLongPress existe" "PASS"
else
    test_result "Hook useLongPress" "FAIL" "Fichier src/hooks/useLongPress.ts manquant"
fi

# Test 2.5: ConfirmDialog
if [ -f "src/components/common/ConfirmDialog.tsx" ]; then
    test_result "ConfirmDialog existe" "PASS"
else
    test_result "ConfirmDialog" "FAIL" "Fichier src/components/common/ConfirmDialog.tsx manquant"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Vérification Intégrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 3.1: PlayScreen intégration
if grep -q "NotesProvider" src/screens/PlayScreen.tsx 2>/dev/null; then
    test_result "PlayScreen intègre NotesProvider" "PASS"
else
    test_result "PlayScreen intégration" "FAIL" "NotesProvider non trouvé dans PlayScreen"
fi

# Test 3.2: PlaybackDisplay intégration
if grep -q "useLongPress\|useNotes" src/components/reader/PlaybackDisplay.tsx 2>/dev/null; then
    test_result "PlaybackDisplay intègre notes" "PASS"
else
    test_result "PlaybackDisplay intégration" "WARN" "Hooks notes non détectés dans PlaybackDisplay"
fi

# Test 3.3: Export PDF intégration
if grep -q "includeNotes\|addNote" src/core/export/pdfExportService.ts 2>/dev/null; then
    test_result "Export PDF supporte notes" "PASS"
else
    test_result "Export PDF" "FAIL" "Support notes non trouvé dans pdfExportService"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Vérification Standards Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4.1: Copyright headers
NOTES_FILES=$(find src/components/notes src/core/storage/notesStorage.ts src/core/models/note*.ts src/hooks/useNotes.ts src/hooks/useLongPress.ts 2>/dev/null -type f)
MISSING_COPYRIGHT=0
for file in $NOTES_FILES; do
    if ! grep -q "Copyright" "$file" 2>/dev/null; then
        ((MISSING_COPYRIGHT++))
    fi
done

if [ "$MISSING_COPYRIGHT" -eq 0 ]; then
    test_result "Headers copyright présents" "PASS"
else
    test_result "Headers copyright" "WARN" "$MISSING_COPYRIGHT fichiers sans copyright"
fi

# Test 4.2: Imports organisés (pas de ..)
RELATIVE_IMPORTS=$(grep -r "\.\./\.\." src/components/notes src/hooks/useNotes.ts src/hooks/useLongPress.ts 2>/dev/null | wc -l)
if [ "$RELATIVE_IMPORTS" -eq 0 ]; then
    test_result "Imports organisés (pas de ../..)" "PASS"
else
    test_result "Imports relatifs" "WARN" "$RELATIVE_IMPORTS imports relatifs profonds détectés"
fi

# Test 4.3: TypeScript strict
if grep -q "strictNullChecks.*true\|strict.*true" tsconfig.json 2>/dev/null; then
    test_result "TypeScript strict mode activé" "PASS"
else
    test_result "TypeScript strict" "WARN" "Strict mode peut-être désactivé"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Vérification Dépendances"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 5.1: Dexie présent
if grep -q "\"dexie\"" package.json; then
    test_result "Dexie installé" "PASS"
else
    test_result "Dexie" "FAIL" "Dexie non trouvé dans package.json"
fi

# Test 5.2: React version
REACT_VERSION=$(grep -o "\"react\": \"[^\"]*\"" package.json | grep -o "[0-9]\+\.[0-9]\+")
if [ -n "$REACT_VERSION" ]; then
    test_result "React installé (v$REACT_VERSION)" "PASS"
else
    test_result "React version" "WARN" "Version React non détectée"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Analyse Bundle Size"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "dist-offline" ]; then
    MAIN_BUNDLE_SIZE=$(find dist-offline/assets -name "index-*.js" -exec stat -c%s {} \; 2>/dev/null | head -1)
    if [ -n "$MAIN_BUNDLE_SIZE" ]; then
        MAIN_BUNDLE_KB=$((MAIN_BUNDLE_SIZE / 1024))
        echo "  📦 Main bundle: ${MAIN_BUNDLE_KB} KB"

        # Warn si > 1MB
        if [ "$MAIN_BUNDLE_KB" -gt 1024 ]; then
            test_result "Bundle size raisonnable" "WARN" "Main bundle > 1MB (${MAIN_BUNDLE_KB} KB)"
        else
            test_result "Bundle size raisonnable" "PASS"
        fi
    else
        test_result "Bundle size" "WARN" "Impossible de mesurer"
    fi
else
    test_result "Bundle size" "WARN" "dist-offline non trouvé, lancer npm run build"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Vérification Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 7.1: Plan d'implémentation
if [ -f "PLAN_IMPLEMENTATION_NOTES.md" ]; then
    test_result "Plan d'implémentation existe" "PASS"
else
    test_result "Plan d'implémentation" "WARN" "PLAN_IMPLEMENTATION_NOTES.md manquant"
fi

# Test 7.2: Progression
if [ -f "NOTES_IMPLEMENTATION_PROGRESS.md" ]; then
    test_result "Document de progression existe" "PASS"
else
    test_result "Document progression" "WARN" "NOTES_IMPLEMENTATION_PROGRESS.md manquant"
fi

# Test 7.3: Phase 6 test plan
if [ -f "PHASE_6_TEST_PLAN.md" ]; then
    test_result "Plan de test Phase 6 existe" "PASS"
else
    test_result "Plan de test Phase 6" "WARN" "PHASE_6_TEST_PLAN.md manquant"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Vérification Git"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 8.1: Branche active
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$CURRENT_BRANCH" = "new_annotations" ]; then
    test_result "Sur branche new_annotations" "PASS"
else
    test_result "Branche Git" "WARN" "Branche actuelle: $CURRENT_BRANCH (attendu: new_annotations)"
fi

# Test 8.2: Statut propre
if git diff --quiet 2>/dev/null; then
    test_result "Working tree propre" "PASS"
else
    test_result "Working tree" "WARN" "Modifications non commitées détectées"
fi

# Test 8.3: Commits Phase 1-5
PHASE_COMMITS=$(git log --oneline --grep="Phase [1-5]" 2>/dev/null | wc -l)
if [ "$PHASE_COMMITS" -ge 5 ]; then
    test_result "Commits Phases 1-5 présents ($PHASE_COMMITS commits)" "PASS"
else
    test_result "Commits phases" "WARN" "Seulement $PHASE_COMMITS commits de phase trouvés"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                        📊 RÉSUMÉ FINAL                         "
echo "════════════════════════════════════════════════════════════════"
echo ""

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
PASS_PERCENT=$((PASS_COUNT * 100 / TOTAL_TESTS))

echo -e "  ${GREEN}✓ PASS${NC}  : $PASS_COUNT tests"
echo -e "  ${YELLOW}⚠ WARN${NC}  : $WARN_COUNT tests"
echo -e "  ${RED}✗ FAIL${NC}  : $FAIL_COUNT tests"
echo -e "  ───────────────────"
echo -e "  📈 Total : $TOTAL_TESTS tests ($PASS_PERCENT% réussite)"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    if [ "$WARN_COUNT" -eq 0 ]; then
        echo -e "${GREEN}🎉 Tous les tests automatiques passent !${NC}"
        echo ""
        echo "✅ Prêt pour tests manuels Phase 6 (checklist complète)"
        echo "✅ Qualité code conforme aux standards"
        echo "✅ Build production fonctionnel"
        echo ""
        echo "➡️  Prochaine étape : Lancer l'app en dev et exécuter la checklist manuelle"
        echo "    $ npm run dev"
        echo ""
        EXIT_CODE=0
    else
        echo -e "${YELLOW}⚠️  Tests passent avec warnings${NC}"
        echo ""
        echo "✅ Aucun test critique échoué"
        echo "⚠️  Quelques warnings à vérifier (non-bloquants)"
        echo ""
        echo "➡️  Prochaine étape : Revoir warnings puis continuer tests manuels"
        EXIT_CODE=0
    fi
else
    echo -e "${RED}❌ Certains tests critiques échouent${NC}"
    echo ""
    echo "❌ $FAIL_COUNT test(s) échoué(s)"
    echo "⚠️  Corriger les erreurs avant de continuer"
    echo ""
    echo "➡️  Prochaine étape : Corriger les FAIL ci-dessus"
    EXIT_CODE=1
fi

echo "════════════════════════════════════════════════════════════════"

exit $EXIT_CODE
