/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

// Script de test manuel du parser
import { parsePlayText } from './src/core/parser/textParser.ts';

console.log('🧪 Test du parser...\n');

// Test 1: Titre simple
console.log('Test 1: Extraction du titre');
const test1 = `Le Malade Imaginaire

Auteur: Molière
Annee: 1673

ACTE I

Scene 1

ARGAN:
Voici ma réplique.`;

try {
  const result1 = parsePlayText(test1, 'test1.txt');
  console.log('✅ Titre:', result1.metadata.title);
  console.log('✅ Auteur:', result1.metadata.author);
  console.log('✅ Année:', result1.metadata.year);
  console.log('✅ Actes:', result1.acts.length);
  console.log('✅ Scènes:', result1.acts[0]?.scenes.length);
  console.log('✅ Personnages:', result1.characters.length);
  console.log();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

// Test 2: Extrait de ALEGRIA
console.log('Test 2: Extrait de ALEGRIA');
const test2 = `ACTE 1 - Alegria

Scène 1 - Présentation

Tous les acteurs sont assis sur scène.

XAVIER:
Mais vous faites quoi ?!!!

ALAIN:
Bah, nous aussi on les voit ahahhahaah !

CHANTAL:
Et nous aussi on les entend ahahhahahah !`;

try {
  const result2 = parsePlayText(test2, 'ALEGRIA.txt');
  console.log('✅ Titre:', result2.metadata.title);
  console.log('✅ Actes:', result2.acts.length);
  console.log('✅ Acte 1 titre:', result2.acts[0]?.title);
  console.log('✅ Scène 1 titre:', result2.acts[0]?.scenes[0]?.title);
  console.log('✅ Personnages:', result2.characters.map(c => c.name).join(', '));
  console.log('✅ Lignes totales:', result2.flatLines.length);
  console.log('✅ Didascalies:', result2.flatLines.filter(l => l.isStageDirection).length);
  console.log('✅ Dialogues:', result2.flatLines.filter(l => !l.isStageDirection).length);
  console.log();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

// Test 3: Répliques multi-lignes
console.log('Test 3: Répliques multi-lignes');
const test3 = `Mon Titre

ACTE I

Scene 1

HAMLET:
Être ou ne pas être,
telle est la question.

Que reste-t-il?

OPHÉLIE:
Autre réplique.`;

try {
  const result3 = parsePlayText(test3, 'test3.txt');
  console.log('✅ Lignes:', result3.flatLines.length);
  console.log('✅ Texte HAMLET:', result3.flatLines[0]?.text.substring(0, 50) + '...');
  console.log();
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

console.log('🎉 Tests terminés!');
