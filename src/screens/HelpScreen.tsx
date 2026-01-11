/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

import { useUIStore } from '../state/uiStore'

/**
 * Composant HelpScreen
 * Écran d'aide et documentation utilisateur
 */
export function HelpScreen() {
  const { isHelpOpen, toggleHelp } = useUIStore()

  if (!isHelpOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Aide et Documentation
          </h2>
          <button
            onClick={toggleHelp}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Fermer l'aide"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto px-6 py-6 max-h-[calc(90vh-80px)]">
          <div className="space-y-8">
            {/* Section: Bienvenue */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Bienvenue sur Répét
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Répét est une application de lecture de pièces de théâtre conçue pour vous aider à
                mémoriser vos répliques et à répéter vos scènes.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Elle propose plusieurs modes de lecture adaptés à différentes étapes de votre
                apprentissage.
              </p>
            </section>

            {/* Section: PWA et Installation */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Installation de l'application (PWA)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Répét est une Progressive Web App (PWA) qui peut être installée sur votre appareil
                pour une expérience optimale, même hors ligne.
              </p>

              <div className="space-y-4">
                {/* Installation Desktop */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    💻 Installation sur ordinateur (Chrome, Edge, Brave)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Ouvrez Répét dans votre navigateur</li>
                    <li>
                      Cliquez sur l'icône d'installation dans la barre d'adresse (⊕ ou{' '}
                      <span className="inline-block">⬇️</span>)
                    </li>
                    <li>Ou allez dans le menu (⋮) → "Installer Répét"</li>
                    <li>Confirmez l'installation</li>
                    <li>L'application s'ouvrira dans sa propre fenêtre comme une app native</li>
                  </ol>
                </div>

                {/* Installation Android */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    📱 Installation sur Android (Chrome, Firefox)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Ouvrez Répét dans Chrome ou Firefox</li>
                    <li>Appuyez sur le menu (⋮) en haut à droite</li>
                    <li>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</li>
                    <li>Confirmez l'installation</li>
                    <li>L'icône Répét apparaîtra sur votre écran d'accueil</li>
                    <li>Lancez l'app comme n'importe quelle application Android</li>
                  </ol>
                </div>

                {/* Installation iOS */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    🍎 Installation sur iOS/iPadOS (Safari)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Ouvrez Répét dans Safari</li>
                    <li>Appuyez sur le bouton Partager (□↑) en bas de l'écran</li>
                    <li>Faites défiler et sélectionnez "Sur l'écran d'accueil"</li>
                    <li>Personnalisez le nom si vous le souhaitez</li>
                    <li>Appuyez sur "Ajouter"</li>
                    <li>L'icône Répét apparaîtra sur votre écran d'accueil</li>
                    <li>Lancez l'app comme n'importe quelle application iOS</li>
                  </ol>
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Avantages de l'installation :</strong> Accès rapide depuis votre écran
                  d'accueil, fonctionnement hors ligne, expérience plein écran sans barre d'adresse,
                  notifications possibles.
                </p>
              </div>
            </section>

            {/* Section: Démarrage rapide */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Démarrage rapide
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Importer une pièce :</strong> Cliquez sur le bouton "Importer" dans la
                  bibliothèque et sélectionnez un fichier texte contenant votre pièce.
                </li>
                <li>
                  <strong>Sélectionner votre rôle :</strong> Ouvrez les détails de la pièce et
                  choisissez le personnage que vous jouez.
                </li>
                <li>
                  <strong>Choisir un mode de lecture :</strong> Silencieux, Audio ou Italien selon
                  vos besoins.
                </li>
                <li>
                  <strong>Commencer la lecture :</strong> Cliquez sur "Lire" pour démarrer votre
                  session de répétition.
                </li>
              </ol>
            </section>

            {/* Section: Modes de lecture */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Modes de lecture
              </h3>

              <div className="space-y-4">
                {/* Mode Silencieux */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm">
                      📖 Silencieux
                    </span>
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Mode de lecture classique pour lire la pièce à votre rythme.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Cliquez sur une ligne pour commencer la lecture à partir de ce point</li>
                    <li>Naviguez librement dans le texte</li>
                    <li>Idéal pour la première lecture ou la révision</li>
                  </ul>
                </div>

                {/* Mode Audio */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm text-blue-800 dark:text-blue-200">
                      🔊 Audio
                    </span>
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Lecture audio de toutes les répliques avec synthèse vocale.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Écoute automatique de toutes les répliques</li>
                    <li>Suivi visuel du texte en cours de lecture</li>
                    <li>Contrôles : lecture, pause, ligne suivante/précédente</li>
                    <li>Utile pour mémoriser le rythme et l'enchaînement des répliques</li>
                  </ul>
                </div>

                {/* Mode Italien */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-sm text-green-800 dark:text-green-200">
                      🎭 Italien
                    </span>
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Mode de répétition avancé : les répliques de votre personnage sont masquées pour
                    tester votre mémoire.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Vos répliques sont cachées (••••••) pendant la lecture</li>
                    <li>Les répliques des autres personnages sont lues à voix haute</li>
                    <li>Vous devez dire vos répliques de mémoire</li>
                    <li>
                      Cliquez sur une ligne masquée pour révéler temporairement le texte si besoin
                    </li>
                    <li>Paramètres : afficher vos lignes avant/après la lecture</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section: Paramètres par pièce */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Paramètres par pièce
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Chaque pièce peut être configurée individuellement depuis l'écran de détails :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Votre personnage :</strong> Sélectionnez le rôle que vous jouez
                </li>
                <li>
                  <strong>Voix de synthèse :</strong> Choisissez la voix utilisée pour la lecture
                  audio
                </li>
                <li>
                  <strong>Vitesse de lecture :</strong> Ajustez la vitesse de la synthèse vocale
                  (0.5x à 2x)
                </li>
                <li>
                  <strong>Options mode Italien :</strong>
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1 text-sm">
                    <li>Masquer vos répliques : active/désactive le masquage</li>
                    <li>Afficher avant lecture : montre vos lignes avant qu'elles soient lues</li>
                    <li>Afficher après lecture : montre vos lignes après qu'elles ont été lues</li>
                  </ul>
                </li>
              </ul>
            </section>

            {/* Section: Contrôles de lecture */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Contrôles de lecture
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Modes Audio et Italien
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                    <li>
                      <strong>Lecture/Pause :</strong> Démarre ou met en pause la lecture audio
                    </li>
                    <li>
                      <strong>Ligne suivante :</strong> Passe à la réplique suivante
                    </li>
                    <li>
                      <strong>Ligne précédente :</strong> Retourne à la réplique précédente
                    </li>
                    <li>
                      <strong>Clic sur une ligne :</strong> Commence la lecture à partir de cette
                      ligne
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Navigation
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                    <li>
                      <strong>Sommaire :</strong> Accédez rapidement à n'importe quelle scène via
                      l'icône de sommaire
                    </li>
                    <li>
                      <strong>Badge du mode :</strong> Cliquez sur le badge (📖/🔊/🎭) pour revenir
                      aux détails de la pièce
                    </li>
                    <li>
                      <strong>Retour :</strong> Bouton de retour pour quitter la lecture
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section: Format des fichiers */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Format des fichiers
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Répét accepte les fichiers texte (.txt) avec le format suivant :
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {`Le Malade Imaginaire

Auteur: Molière
Annee: 1673

ACTE I

Scene 1

ARGAN:
Trois et deux font cinq, et cinq font dix, et dix font vingt.
(Il regarde ses papiers)

TOINETTE:
Monsieur, que faites-vous ?

ARGAN:
Je compte mes dépenses.`}
                </pre>
              </div>
              <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Titre</strong> : Premier bloc de texte isolé (suivi d'une ligne vide)
                </li>
                <li>
                  <strong>Auteur</strong> : Ligne commençant par "Auteur:" juste après le titre
                </li>
                <li>
                  <strong>Année</strong> : Ligne commençant par "Annee:" après le titre ou l'auteur
                </li>
                <li>
                  <strong>Actes</strong> : Ligne commençant par "ACTE" ou "Acte" suivi du numéro (I,
                  II, 1, 2...) et optionnellement d'un titre
                </li>
                <li>
                  <strong>Scènes</strong> : Ligne commençant par "Scene" ou "Scène" suivi du numéro
                  et optionnellement d'un titre
                </li>
                <li>
                  <strong>Répliques</strong> : Nom du personnage EN MAJUSCULES suivi de ":" puis un
                  retour à la ligne et le texte de la réplique
                </li>
                <li>
                  <strong>Didascalies</strong> : Texte entre parenthèses dans les répliques (affiché
                  en italique et gris)
                </li>
                <li>
                  Les blocs de texte entre les sections sont aussi considérés comme des didascalies
                </li>
              </ul>
            </section>

            {/* Section: Raccourcis et astuces */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Astuces et conseils
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Progression graduée :</strong> Commencez en mode Silencieux, passez à
                  Audio, puis Italien
                </li>
                <li>
                  <strong>Répétition ciblée :</strong> Utilisez le sommaire pour travailler une
                  scène spécifique
                </li>
                <li>
                  <strong>Mode Italien progressif :</strong> Activez d'abord "Afficher avant" et
                  "Afficher après", puis désactivez-les au fur et à mesure
                </li>
                <li>
                  <strong>Ajustez la vitesse :</strong> Ralentissez pour mémoriser, accélérez pour
                  tester votre réactivité
                </li>
                <li>
                  <strong>Thème sombre :</strong> Activez le mode sombre pour réduire la fatigue
                  visuelle lors de longues sessions
                </li>
              </ul>
            </section>

            {/* Section: Support */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Besoin d'aide ?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Pour toute question, suggestion ou signalement de bug, consultez la documentation
                complète du projet ou contactez l'équipe de développement.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Répét est un projet open-source développé avec ❤️ pour les passionnés de théâtre.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
