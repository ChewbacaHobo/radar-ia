// Juge de la spec 002. Écrit par l'orchestrateur : le codeur ne le modifie pas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genererRapport } from '../../src/radar.js';

const MAINTENANT = new Date('2026-10-16T12:00:00Z');

// Ligne du tableau pour un seul dépôt dont on fait varier la description.
function ligne(description) {
  const depots = [{ nom: 'o/r', categorie: 'C', stargazers_count: 1, pushed_at: '2026-10-15T00:00:00Z', archived: false, description }];
  const md = genererRapport({ date: '2026-10-16', depots, maintenant: MAINTENANT });
  return md.split('\n').find((l) => l.startsWith('| [o/r]'));
}
const attendu = (cellule) => `| [o/r](https://github.com/o/r) | 1 | nouveau | actif | ${cellule} |`;

test('description faite seulement de blancs → —', () => {
  assert.equal(ligne('   '), attendu('—'));
  assert.equal(ligne('\n'), attendu('—'));
  assert.equal(ligne(' \r\n\t '), attendu('—'));
});

test('blancs de début et de fin retirés', () => {
  assert.equal(ligne('  Gas Town  '), attendu('Gas Town'));
});

test('la coupe compte un emoji pour un caractère et ne le casse pas', () => {
  assert.equal(ligne(`${'a'.repeat(98)}😀😀😀`), attendu(`${'a'.repeat(98)}😀…`));
});

test('exactement 100 emoji : pas de coupe', () => {
  const cent = '😀'.repeat(100);
  assert.equal(ligne(cent), attendu(cent));
});
