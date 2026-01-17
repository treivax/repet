#!/usr/bin/env node

/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Script de bump de version automatique
 *
 * Ce script incrémente automatiquement la version de l'application
 * et met à jour tous les fichiers concernés :
 * - package.json
 * - src/config/version.ts
 *
 * Usage:
 *   npm run bump-version [patch|minor|major]
 *   node scripts/bump-version.js [patch|minor|major]
 *
 * Exemples:
 *   npm run bump-version patch  # 0.1.0 → 0.1.1
 *   npm run bump-version minor  # 0.1.0 → 0.2.0
 *   npm run bump-version major  # 0.1.0 → 1.0.0
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

/**
 * Parse une version semver
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Version invalide: ${version}`)
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}

/**
 * Incrémente une version selon le type
 */
function bumpVersion(version, type) {
  const parsed = parseVersion(version)

  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
    default:
      throw new Error(`Type de bump invalide: ${type}. Utilisez: patch, minor ou major`)
  }
}

/**
 * Met à jour package.json
 */
function updatePackageJson(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))

  const oldVersion = packageJson.version
  packageJson.version = newVersion

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

  return oldVersion
}

/**
 * Met à jour src/config/version.ts
 */
function updateVersionConfig(newVersion) {
  const versionPath = path.join(__dirname, '..', 'src', 'config', 'version.ts')

  if (!fs.existsSync(versionPath)) {
    logWarning(`Fichier version.ts non trouvé: ${versionPath}`)
    return
  }

  let content = fs.readFileSync(versionPath, 'utf-8')

  // Remplacer APP_VERSION
  content = content.replace(
    /export const APP_VERSION = ['"][\d.]+['"]/,
    `export const APP_VERSION = '${newVersion}'`
  )

  fs.writeFileSync(versionPath, content)
}

/**
 * Crée un fichier CHANGELOG entry (optionnel)
 */
function createChangelogEntry(version) {
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
  const date = new Date().toISOString().split('T')[0]

  const entry = `
## [${version}] - ${date}

### Added
-

### Changed
-

### Fixed
-

`

  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf-8')
    const updatedChangelog = changelog.replace(/# Changelog\n/, `# Changelog\n${entry}`)
    fs.writeFileSync(changelogPath, updatedChangelog)
    logSuccess('CHANGELOG.md mis à jour')
  } else {
    const newChangelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n${entry}`
    fs.writeFileSync(changelogPath, newChangelog)
    logSuccess('CHANGELOG.md créé')
  }
}

/**
 * Affiche un résumé des changements
 */
function showSummary(oldVersion, newVersion, bumpType) {
  console.log()
  log('═══════════════════════════════════════════', colors.bright)
  log('        VERSION BUMP SUMMARY', colors.bright)
  log('═══════════════════════════════════════════', colors.bright)
  console.log()
  logInfo(`Type:          ${bumpType}`)
  logInfo(`Old Version:   ${oldVersion}`)
  logSuccess(`New Version:   ${newVersion}`)
  console.log()
  log('Fichiers mis à jour:', colors.bright)
  log('  • package.json')
  log('  • src/config/version.ts')
  log('  • CHANGELOG.md')
  console.log()
  log('Prochaines étapes:', colors.bright)
  log('  1. Vérifiez les changements avec: git diff')
  log('  2. Complétez le CHANGELOG.md avec vos modifications')
  log('  3. Committez: git add . && git commit -m "chore: bump version to v' + newVersion + '"')
  log('  4. Créez un tag: git tag v' + newVersion)
  log('  5. Poussez: git push && git push --tags')
  log('  6. Déployez: npm run deploy')
  console.log()
  log('═══════════════════════════════════════════', colors.bright)
  console.log()
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  const bumpType = args[0] || 'patch'

  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    logError(`Type de bump invalide: ${bumpType}`)
    console.log()
    log('Usage: node scripts/bump-version.js [patch|minor|major]')
    console.log()
    log('Exemples:')
    log('  npm run bump-version patch  # 0.1.0 → 0.1.1')
    log('  npm run bump-version minor  # 0.1.0 → 0.2.0')
    log('  npm run bump-version major  # 0.1.0 → 1.0.0')
    console.log()
    process.exit(1)
  }

  try {
    // Lire la version actuelle
    const packagePath = path.join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    const currentVersion = packageJson.version

    // Calculer la nouvelle version
    const newVersion = bumpVersion(currentVersion, bumpType)

    console.log()
    log(`🚀 Bump de version ${bumpType}: ${currentVersion} → ${newVersion}`, colors.bright)
    console.log()

    // Mettre à jour les fichiers
    logInfo('Mise à jour de package.json...')
    const oldVersion = updatePackageJson(newVersion)
    logSuccess('package.json mis à jour')

    logInfo('Mise à jour de src/config/version.ts...')
    updateVersionConfig(newVersion)
    logSuccess('src/config/version.ts mis à jour')

    logInfo('Mise à jour de CHANGELOG.md...')
    createChangelogEntry(newVersion)

    // Afficher le résumé
    showSummary(oldVersion, newVersion, bumpType)

    process.exit(0)
  } catch (error) {
    logError(`Erreur: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Exécuter
main()
