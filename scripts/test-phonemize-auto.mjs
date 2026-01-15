/**
 * Script de test automatisé pour la phonemization avec Piper
 *
 * Usage: node scripts/test-phonemize-auto.js
 *
 * Ce script utilise Playwright pour tester la phonemization dans un vrai navigateur
 */

import puppeteer from 'puppeteer'

const TEST_CASES = [
  { text: 'Bonjour', voice: 'fr', expected: /^[bɔʒuʁ]/ },
  { text: 'Merci beaucoup', voice: 'fr', expected: /mɛʁsi/ },
  { text: 'Comment allez-vous ?', voice: 'fr', expected: /kɔmɑ̃/ },
  { text: 'Le chat mange une souris', voice: 'fr', expected: /ʃa/ },
]

async function testPhonemization() {
  console.log('🚀 Démarrage des tests de phonemization...\n')

  let browser
  try {
    // Lancer le navigateur
    console.log('📱 Lancement de Chromium...')
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Activer les logs console
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        console.log(`   ❌ [Browser Error] ${text}`)
      } else if (text.includes('[PiperPhonemizer]') || text.includes('[piper_phonemize]')) {
        console.log(`   📝 ${text}`)
      }
    })

    // Aller sur la page de test
    console.log('🌐 Navigation vers http://localhost:5173...')
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    console.log('✅ Page chargée\n')

    // Attendre que l'app soit initialisée
    console.log("⏳ Attente de l'initialisation de l'application...")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Injecter le code de test
    console.log('💉 Injection du code de test...\n')

    const results = await page.evaluate(async (testCases) => {
      const results = []

      // Fonction helper pour logger
      const log = (msg, type = 'info') => {
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
        console.log(`${prefix} ${msg}`)
      }

      try {
        // Charger le script piper_phonemize
        log('Chargement de piper_phonemize.js...')
        const script = document.createElement('script')
        script.src = '/wasm/piper_phonemize.js'

        await new Promise((resolve, reject) => {
          script.onload = () => {
            log('Script chargé', 'success')
            resolve()
          }
          script.onerror = () => {
            log('Échec du chargement du script', 'error')
            reject(new Error('Script load failed'))
          }
          document.head.appendChild(script)
        })

        // Vérifier que la fonction est disponible
        if (!window.createPiperPhonemize) {
          throw new Error('createPiperPhonemize non disponible')
        }
        log('createPiperPhonemize disponible', 'success')

        // Fonction pour créer un module avec stdin/stdout configurés
        const createModule = async (text, stdoutCallback, stderrCallback) => {
          log('Création du module WASM avec stdin/stdout...')

          const stdinContent = text + '\n'
          let stdinPos = 0

          const module = await window.createPiperPhonemize({
            locateFile: (path) => {
              if (path.endsWith('.wasm')) {
                return '/wasm/piper_phonemize.wasm'
              }
              if (path.endsWith('.data')) {
                return '/wasm/piper_phonemize.data'
              }
              return path
            },
            stdin: () => {
              if (stdinPos < stdinContent.length) {
                return stdinContent.charCodeAt(stdinPos++)
              }
              return null // EOF
            },
            print: stdoutCallback,
            printErr: stderrCallback,
            noInitialRun: true,
          })

          // Attendre le FS
          await new Promise((resolve, reject) => {
            let attempts = 0
            const check = () => {
              attempts++
              if (attempts > 200) {
                reject(new Error('Timeout FS'))
                return
              }

              if (!module.FS) {
                setTimeout(check, 50)
                return
              }

              const espeakPath = module.FS.analyzePath('/espeak-ng-data')
              if (!espeakPath.exists) {
                setTimeout(check, 50)
                return
              }

              const langPath = module.FS.analyzePath('/espeak-ng-data/lang')
              if (!langPath.exists) {
                setTimeout(check, 50)
                return
              }

              log('FS prêt', 'success')
              resolve()
            }
            check()
          })

          return module
        }

        // Fonction pour phonemizer en utilisant stdin/stdout
        const phonemize = async (text, voice) => {
          const stdoutLines = []
          const stderrLines = []
          const stdinContent = text + '\n'
          let stdinPos = 0

          // Buffers pour TTY
          const ttyOutputBuffer = []
          const ttyStderrBuffer = []

          const module = await createModule(
            text,
            (line) => stdoutLines.push(line),
            (line) => stderrLines.push(line)
          )

          // Configurer FS.init pour capturer stdout/stderr au niveau TTY
          if (module.FS && module.FS.init) {
            module.FS.init(
              () => {
                // stdin
                if (stdinPos < stdinContent.length) {
                  return stdinContent.charCodeAt(stdinPos++)
                }
                return null
              },
              (char) => {
                // stdout - collecter caractère par caractère
                if (char !== null && char !== 0) {
                  ttyOutputBuffer.push(char)
                  // Flush sur newline
                  if (char === 10) {
                    const line = String.fromCharCode(...ttyOutputBuffer.slice(0, -1))
                    stdoutLines.push(line)
                    ttyOutputBuffer.length = 0
                  }
                }
              },
              (char) => {
                // stderr
                if (char !== null && char !== 0) {
                  ttyStderrBuffer.push(char)
                  if (char === 10) {
                    const line = String.fromCharCode(...ttyStderrBuffer.slice(0, -1))
                    stderrLines.push(line)
                    ttyStderrBuffer.length = 0
                  }
                }
              }
            )
            log('FS.init configuré pour TTY', 'success')
          }

          const args = ['piper_phonemize', '--language', voice, '--espeak_data', '/espeak-ng-data']

          try {
            module.callMain(args)
          } catch (error) {
            // Exception attendue - le programme peut quand même avoir produit du stdout
            log(`callMain exception (peut-être normal): ${error}`)
          }

          // Flush les buffers TTY restants
          if (ttyOutputBuffer.length > 0) {
            const line = String.fromCharCode(...ttyOutputBuffer)
            stdoutLines.push(line)
          }
          if (ttyStderrBuffer.length > 0) {
            const line = String.fromCharCode(...ttyStderrBuffer)
            stderrLines.push(line)
          }

          if (stdoutLines.length === 0) {
            const stderrOutput = stderrLines.join('\n')
            throw new Error(`Pas de stdout. Stderr: ${stderrOutput || '(vide)'}`)
          }

          const outputJson = stdoutLines.join('\n')

          try {
            const result = JSON.parse(outputJson)

            if (!result.phonemes || result.phonemes.length === 0) {
              throw new Error('Pas de phonèmes dans le résultat JSON')
            }

            // Convertir les codes IPA en string
            const phonemesString = result.phonemes.map((code) => String.fromCharCode(code)).join('')
            return phonemesString
          } catch (parseError) {
            throw new Error(
              `Erreur parsing JSON: ${parseError}. JSON: ${outputJson.substring(0, 200)}`
            )
          }
        }

        // Exécuter les tests
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i]
          log(`\nTest ${i + 1}/${testCases.length}: "${testCase.text}"`)

          try {
            const startTime = Date.now()
            const result = await phonemize(testCase.text, testCase.voice)
            const duration = Date.now() - startTime

            log(`Résultat: "${result}" (${duration}ms)`, 'success')

            results.push({
              index: i + 1,
              text: testCase.text,
              voice: testCase.voice,
              result: result,
              duration: duration,
              success: true,
            })
          } catch (error) {
            log(`Erreur: ${error.message}`, 'error')
            results.push({
              index: i + 1,
              text: testCase.text,
              voice: testCase.voice,
              error: error.message,
              success: false,
            })
          }
        }

        return results
      } catch (error) {
        log(`Erreur globale: ${error.message}`, 'error')
        return [{ error: error.message, success: false }]
      }
    }, TEST_CASES)

    // Afficher les résultats
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSULTATS DES TESTS')
    console.log('='.repeat(60) + '\n')

    let successCount = 0
    let failCount = 0

    results.forEach((result) => {
      if (result.success) {
        successCount++
        console.log(`✅ Test ${result.index}: "${result.text}"`)
        console.log(`   Résultat: ${result.result}`)
        console.log(`   Durée: ${result.duration}ms\n`)
      } else {
        failCount++
        console.log(`❌ Test ${result.index}: "${result.text}"`)
        console.log(`   Erreur: ${result.error}\n`)
      }
    })

    console.log('='.repeat(60))
    console.log(`✅ Réussis: ${successCount}/${results.length}`)
    console.log(`❌ Échoués: ${failCount}/${results.length}`)
    console.log('='.repeat(60) + '\n')

    if (failCount === 0) {
      console.log('🎉 Tous les tests ont réussi !')
      return 0
    } else {
      console.log('⚠️ Certains tests ont échoué.')
      return 1
    }
  } catch (error) {
    console.error('❌ Erreur fatale:', error)
    return 1
  } finally {
    if (browser) {
      await browser.close()
      console.log('\n👋 Navigateur fermé')
    }
  }
}

// Exécuter les tests
testPhonemization()
  .then((exitCode) => {
    process.exit(exitCode)
  })
  .catch((error) => {
    console.error('💥 Exception non gérée:', error)
    process.exit(1)
  })
