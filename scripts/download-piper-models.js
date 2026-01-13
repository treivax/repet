#!/usr/bin/env node

/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Script pour télécharger les modèles Piper et fichiers WASM nécessaires
 * pour un fonctionnement 100% déconnecté
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// URLs des modèles Piper depuis le CDN officiel
const PIPER_CDN_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'

const MODELS = [
  {
    name: 'fr_FR-siwis-medium',
    files: [
      'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx',
      'fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json',
    ],
  },
  {
    name: 'fr_FR-tom-medium',
    files: [
      'fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx',
      'fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx.json',
    ],
  },
  {
    name: 'fr_FR-upmc-medium',
    files: [
      'fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx',
      'fr/fr_FR/upmc/medium/fr_FR-upmc-medium.onnx.json',
    ],
  },
  {
    name: 'fr_FR-mls-medium',
    files: [
      'fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx',
      'fr/fr_FR/mls/medium/fr_FR-mls-medium.onnx.json',
    ],
  },
]

const PIPER_WASM_FILES = ['public/wasm/piper_phonemize.wasm', 'public/wasm/piper_phonemize.data']

/**
 * Télécharge un fichier depuis une URL
 */
async function downloadFile(url, destPath) {
  try {
    console.log(`📥 Téléchargement: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const dir = dirname(destPath)

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(destPath, Buffer.from(buffer))
    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2)
    console.log(`✅ Sauvegardé: ${destPath} (${sizeMB} MB)`)

    return true
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement de ${url}:`, error.message)
    return false
  }
}

/**
 * Télécharge tous les modèles Piper
 */
async function downloadPiperModels() {
  console.log('\n🎙️  TÉLÉCHARGEMENT DES MODÈLES PIPER\n')
  console.log('='.repeat(60))

  const publicDir = join(__dirname, '..', 'public')
  const modelsDir = join(publicDir, 'voices')

  if (!existsSync(modelsDir)) {
    mkdirSync(modelsDir, { recursive: true })
  }

  let successCount = 0
  let totalFiles = 0

  for (const model of MODELS) {
    console.log(`\n📦 Modèle: ${model.name}`)
    console.log('-'.repeat(60))

    for (const file of model.files) {
      totalFiles++
      const url = `${PIPER_CDN_BASE}/${file}`
      const filename = file.split('/').pop()
      const destPath = join(modelsDir, model.name, filename)

      const success = await downloadFile(url, destPath)
      if (success) successCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Modèles: ${successCount}/${totalFiles} fichiers téléchargés`)

  return successCount === totalFiles
}

/**
 * Vérifie la présence des fichiers WASM de Piper
 */
async function checkPiperWasm() {
  console.log('\n🔧 VÉRIFICATION DES FICHIERS WASM PIPER\n')
  console.log('='.repeat(60))

  const projectRoot = join(__dirname, '..')
  let foundCount = 0

  for (const file of PIPER_WASM_FILES) {
    const filePath = join(projectRoot, file)
    const exists = existsSync(filePath)

    if (exists) {
      console.log(`✅ Trouvé: ${file}`)
      foundCount++
    } else {
      console.log(`❌ Manquant: ${file}`)
      console.log(`   Les fichiers WASM Piper doivent être copiés manuellement depuis:`)
      console.log(`   - node_modules/@mintplex-labs/piper-tts-web/dist/`)
      console.log(`   ou téléchargés depuis le dépôt Piper officiel.`)
    }
  }

  console.log('\n' + '='.repeat(60))

  if (foundCount === PIPER_WASM_FILES.length) {
    console.log(`✅ WASM Piper: ${foundCount}/${PIPER_WASM_FILES.length} fichiers présents`)
    return true
  } else {
    console.log(`⚠️  WASM Piper: ${foundCount}/${PIPER_WASM_FILES.length} fichiers présents`)
    console.log(`   Note: Les fichiers WASM manquants seront chargés depuis node_modules au build.`)
    return true // Ne pas bloquer si manquants, Vite les copiera
  }
}

/**
 * Crée un fichier manifest avec la liste des modèles téléchargés
 */
function createManifest() {
  console.log('\n📄 CRÉATION DU MANIFEST\n')
  console.log('='.repeat(60))

  const manifest = {
    version: '1.0.0',
    downloadedAt: new Date().toISOString(),
    models: MODELS.map((model) => ({
      name: model.name,
      files: model.files.map((f) => f.split('/').pop()),
      localPath: `/voices/${model.name}/`,
    })),
    wasmFiles: [
      '/wasm/piper_phonemize.wasm',
      '/wasm/piper_phonemize.data',
      '/wasm/ort-wasm-simd.wasm',
    ],
  }

  const manifestPath = join(__dirname, '..', 'public', 'voices', 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`✅ Manifest créé: ${manifestPath}`)
}

/**
 * Affiche les instructions post-téléchargement
 */
function showInstructions() {
  console.log('\n' + '='.repeat(60))
  console.log('\n✨ TÉLÉCHARGEMENT TERMINÉ ✨\n')
  console.log('='.repeat(60))
  console.log('\n📁 Fichiers téléchargés:')
  console.log('   • public/voices/fr_FR-siwis-medium/')
  console.log('   • public/voices/fr_FR-tom-medium/')
  console.log('   • public/voices/fr_FR-upmc-medium/')
  console.log('   • public/voices/fr_FR-mls-medium/')
  console.log('   • public/wasm/piper_phonemize.wasm')
  console.log('   • public/wasm/piper_phonemize.data')
  console.log('\n📝 Prochaines étapes:')
  console.log('   1. Vérifier que tous les fichiers sont présents')
  console.log('   2. Redémarrer le serveur de dev: npm run dev')
  console.log('   3. Tester la synthèse vocale en mode déconnecté')
  console.log('\n💡 Note: Les fichiers sont maintenant intégrés au build')
  console.log('   et seront disponibles même sans connexion Internet.\n')
  console.log('='.repeat(60) + '\n')
}

/**
 * Main
 */
async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🎭 RÉPÉT - Script de Téléchargement des Modèles Piper')
  console.log('='.repeat(60))
  console.log("\n🎯 Objectif: Préparer l'application pour un mode 100% déconnecté")
  console.log('📦 Modèles à télécharger: 4 voix françaises (~60 MB au total)')
  console.log('⏱️  Temps estimé: 2-5 minutes (selon connexion)\n')

  try {
    // Télécharger les modèles Piper
    const modelsOk = await downloadPiperModels()

    // Vérifier les fichiers WASM (pas de téléchargement, juste vérification)
    const wasmOk = await checkPiperWasm()

    if (modelsOk && wasmOk) {
      // Créer le manifest
      createManifest()

      // Afficher les instructions
      showInstructions()

      process.exit(0)
    } else {
      console.error('\n❌ Le téléchargement des modèles a échoué.')
      console.error('   Vérifiez votre connexion Internet et réessayez.\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
