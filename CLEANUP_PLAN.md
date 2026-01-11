# Plan de Nettoyage du Projet Répét

## 1. Fichiers de backup à supprimer
- src/screens/PlayScreen.tsx.bak
- src/screens/ReaderScreen.tsx.bak

## 2. Fichiers de documentation obsolètes/redondants à supprimer
### Racine (garder uniquement essentiels)
- ACCOMPLISSEMENTS_FINAUX.md (redondant avec CHANGELOG)
- CHANGELOG_PROMPTS.md (obsolète)
- COMPLIANCE_GAP_ANALYSIS.md (phase terminée)
- E2E_TESTS_IMPLEMENTATION.md (info dans docs/TESTING.md)
- E2E_TESTS_PROGRESS.md (obsolète)
- E2E_TEST_STATS.md (obsolète)
- EXECUTION_SUMMARY.md (redondant)
- PHASES_FINALES_SUMMARY.md (redondant)
- PHASE_7_*.md (tous - phase terminée)
- PLAN_SUMMARY.txt (obsolète)
- PLAYWRIGHT_VS_CYPRESS.md (décision prise)
- PROGRESS.md (redondant avec PROJECT_STATUS.md)
- PROMPTS_03_04_COMPLETE.md (obsolète)
- PROMPT_05_COMPLETE.md (obsolète)
- RELEASE_NOTES_READING_TIME.md (intégrer dans CHANGELOG)
- RESUME_PHASES_FINALES.md (redondant)
- SESSION_READING_TIME_SUMMARY.md (obsolète)
- STATUS.md (redondant avec PROJECT_STATUS.md)
- WORK_SUMMARY.md (redondant)
- WORK_SUMMARY_PHASES_5_6.md (redondant)

### docs/ (garder uniquement actifs)
- docs/BUG_FIXES_FULL_PLAY_DISPLAY.md (déjà dans CHANGELOG)
- docs/COMMIT_PROMPTS_03_04.md (obsolète)
- docs/DEBUG_CLICK_ISSUE.md (debug terminé)
- docs/DEBUG_CLICK_SIMPLE.md (debug terminé)
- docs/EXECUTION_PROMPTS_03_04.md (obsolète)
- docs/PHASE_7_COMPLETION_SUMMARY.md (obsolète)
- docs/PROMPT_0*_*.md (tous - prompts terminés)

## 3. Composants non utilisés à supprimer
- src/components/reader/LineCue.tsx (remplacé par LineRenderer)
- src/components/reader/NavigationControls.tsx (non utilisé)
- src/components/reader/SceneNavigator.tsx (remplacé par SceneNavigation)
- src/components/reader/TextDisplay.tsx (remplacé par FullPlayDisplay)

## 4. Scripts obsolètes
- check-setup.sh (à vérifier si utilisé)
- migrate-play-access.sh (migration terminée)
- test-parser.js (à vérifier si utilisé)

## 5. Dossiers à nettoyer
- plans/ : conserver INDEX.md, README.md, PROJECT_STRUCTURE.md
- examples/ : vérifier contenu
- spec/ : vérifier si toujours nécessaire

## 6. Documentation à conserver et organiser
### Racine
- README.md
- CHANGELOG.md
- LICENSE
- PROJECT_STATUS.md
- DEVELOPER_QUICKSTART.md
- START_HERE.md
- TESTING.md
- NEXT_STEPS.md

### docs/
- docs/ARCHITECTURE.md
- docs/PARSER.md
- docs/DEPLOYMENT.md
- docs/TESTING.md
- docs/USER_GUIDE.md
- docs/reading-time/ (garder)
- docs/features/ (garder)

### plans/
- plans/INDEX.md
- plans/README.md
- plans/PROJECT_STRUCTURE.md
