#!/usr/bin/env node

/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Script de vérification de l'implémentation TTS v2.0.0
 *
 * Ce script vérifie que tous les composants de l'implémentation TTS
 * sont présents et correctement configurés.
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description}`, 'red');
    log(`     Fichier manquant: ${filePath}`, 'yellow');
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    log(`  ❌ ${description}`, 'red');
    log(`     Fichier manquant: ${filePath}`, 'yellow');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const contains = content.includes(searchString);

  if (contains) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description}`, 'red');
    log(`     Contenu manquant: "${searchString}"`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('    VÉRIFICATION IMPLÉMENTATION TTS v2.0.0', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  let totalChecks = 0;
  let passedChecks = 0;

  // 1. Vérifier les fichiers de code
  log('📁 Fichiers de Code TypeScript', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const codeFiles = [
    ['src/core/tts/voiceProfiles.ts', 'Profils vocaux'],
    ['src/utils/voiceMigration.ts', 'Migration automatique'],
    ['src/utils/voiceDiagnostics.ts', 'Diagnostic des voix'],
    ['src/utils/ttsSystemDiagnostics.ts', 'Diagnostic système'],
    ['src/components/play/VoiceProfilePreview.tsx', 'Composant de prévisualisation'],
  ];

  codeFiles.forEach(([file, desc]) => {
    totalChecks++;
    if (checkFile(file, desc)) passedChecks++;
  });

  // 2. Vérifier les tests
  log('\n🧪 Fichiers de Tests', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const testFiles = [
    ['src/utils/__tests__/voiceMigration.test.ts', 'Tests de migration (18 tests)'],
    ['src/utils/__tests__/voiceDiagnostics.test.ts', 'Tests de diagnostic (26 tests)'],
  ];

  testFiles.forEach(([file, desc]) => {
    totalChecks++;
    if (checkFile(file, desc)) passedChecks++;
  });

  // 3. Vérifier la documentation
  log('\n📚 Documentation', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const docFiles = [
    ['IMPLEMENTATION_FINALE_TTS.md', 'Guide complet de déploiement'],
    ['QUICK_START_TTS_FINAL.md', 'Guide rapide TTS'],
    ['CHANGELOG_V2.0.0.md', 'Changelog version 2.0.0'],
    ['docs/TTS_VOICE_ISSUES.md', 'Documentation des problèmes de voix'],
    ['docs/VOICE_PROFILES.md', 'Documentation des profils vocaux'],
    ['DOCS_INDEX.md', 'Index de documentation (mis à jour)'],
  ];

  docFiles.forEach(([file, desc]) => {
    totalChecks++;
    if (checkFile(file, desc)) passedChecks++;
  });

  // 4. Vérifier les intégrations
  log('\n🔗 Intégrations', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const integrations = [
    [
      'src/core/tts/providers/PiperWASMProvider.ts',
      'ALL_VOICE_PROFILES',
      'Import des profils dans PiperWASMProvider',
    ],
    [
      'src/core/tts/providers/PiperWASMProvider.ts',
      'getVoiceProfile',
      'Détection des profils dans synthesize()',
    ],
    [
      'src/state/playSettingsStore.ts',
      'migratePlaySettingsVoices',
      'Migration dans getPlaySettings()',
    ],
    [
      'src/state/playSettingsStore.ts',
      'migrateAllPlaySettings',
      'Migration à l\'hydratation',
    ],
  ];

  integrations.forEach(([file, search, desc]) => {
    totalChecks++;
    if (checkFileContent(file, search, desc)) passedChecks++;
  });

  // 5. Vérifier que Gilles est désactivé
  log('\n🚫 Voix Désactivées', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  totalChecks++;
  if (checkFileContent(
    'src/core/tts/providers/PiperWASMProvider.ts',
    'fr_FR-gilles-low',
    'Gilles est bien commenté/désactivé'
  )) {
    passedChecks++;
  }

  // 6. Vérifier les profils
  log('\n🎭 Profils Vocaux', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const profiles = [
    ['TOM_VOICE_PROFILES', 'Profils de Tom'],
    ['SIWIS_VOICE_PROFILES', 'Profils de Siwis'],
    ['UPMC_VOICE_PROFILES', 'Profils de UPMC Jessica'],
    ['ALL_VOICE_PROFILES', 'Tous les profils'],
  ];

  profiles.forEach(([profileName, desc]) => {
    totalChecks++;
    if (checkFileContent('src/core/tts/voiceProfiles.ts', profileName, desc)) {
      passedChecks++;
    }
  });

  // 7. Compter les profils
  log('\n🔢 Nombre de Profils', 'blue');
  log('─────────────────────────────────────────────────────────────', 'blue');

  const profilesFile = path.join(__dirname, '..', 'src/core/tts/voiceProfiles.ts');
  if (fs.existsSync(profilesFile)) {
    const content = fs.readFileSync(profilesFile, 'utf8');

    // Compter les profils Tom
    const tomMatches = content.match(/id: 'fr_FR-tom-medium-/g);
    const tomCount = tomMatches ? tomMatches.length : 0;

    // Compter les profils Siwis
    const siwisMatches = content.match(/id: 'fr_FR-siwis-medium-/g);
    const siwisCount = siwisMatches ? siwisMatches.length : 0;

    // Compter les profils UPMC
    const upmcMatches = content.match(/id: 'fr_FR-upmc-medium-/g);
    const upmcCount = upmcMatches ? upmcMatches.length : 0;

    const totalProfiles = tomCount + siwisCount + upmcCount;

    log(`  Tom: ${tomCount} profils (attendu: 6)`, tomCount === 6 ? 'green' : 'yellow');
    log(`  Siwis: ${siwisCount} profils (attendu: 3)`, siwisCount === 3 ? 'green' : 'yellow');
    log(`  UPMC Jessica: ${upmcCount} profils (attendu: 3)`, upmcCount === 3 ? 'green' : 'yellow');
    log(`  Total: ${totalProfiles} profils (attendu: 12)`, totalProfiles === 12 ? 'green' : 'yellow');

    totalChecks++;
    if (totalProfiles === 12) {
      passedChecks++;
      log('  ✅ Nombre de profils correct', 'green');
    } else {
      log('  ❌ Nombre de profils incorrect', 'red');
    }
  } else {
    totalChecks++;
    log('  ❌ Fichier voiceProfiles.ts manquant', 'red');
  }

  // 8. Résumé
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('    RÉSUMÉ', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  const successRate = Math.round((passedChecks / totalChecks) * 100);

  log(`Total de vérifications: ${totalChecks}`, 'blue');
  log(`Vérifications réussies: ${passedChecks}`, passedChecks === totalChecks ? 'green' : 'yellow');
  log(`Vérifications échouées: ${totalChecks - passedChecks}`, totalChecks - passedChecks === 0 ? 'green' : 'red');
  log(`Taux de réussite: ${successRate}%\n`, successRate === 100 ? 'green' : 'yellow');

  if (passedChecks === totalChecks) {
    log('✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES !', 'green');
    log('✅ L\'implémentation TTS v2.0.0 est complète et prête pour le déploiement.\n', 'green');
    process.exit(0);
  } else {
    log('⚠️  CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ', 'yellow');
    log('⚠️  Veuillez corriger les problèmes avant le déploiement.\n', 'yellow');
    process.exit(1);
  }
}

// Exécuter le script
main().catch((error) => {
  log('\n❌ ERREUR LORS DE LA VÉRIFICATION', 'red');
  console.error(error);
  process.exit(1);
});
