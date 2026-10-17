import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slugify.js';

test('met en minuscules et remplace les espaces', () => {
  assert.equal(slugify('Bonjour le Monde'), 'bonjour-le-monde');
});

test('retire les accents', () => {
  assert.equal(slugify('Été à Montréal'), 'ete-a-montreal');
});

test('retire la ponctuation en début et en fin', () => {
  assert.equal(slugify('  !Salut, ça va ?  '), 'salut-ca-va');
});

test('refuse ce qui n\'est pas une chaîne', () => {
  assert.throws(() => slugify(42), TypeError);
});
