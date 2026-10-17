// Tests unitaires de src/radar.js : cas limites hors du juge d'acceptation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  statutActivite,
  evolutionEtoiles,
  formaterNombre,
  formaterEvolution,
  instantane,
  genererRapport,
} from '../src/radar.js';

const MAINTENANT = new Date('2026-10-16T12:00:00Z');
const ilYa = (jours) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

test('statutActivite : bornes à la milliseconde près (Math.floor)', () => {
  const presque31 = new Date(MAINTENANT.getTime() - 31 * 86_400_000 + 1).toISOString();
  assert.equal(statutActivite({ archived: false, pushed_at: presque31 }, MAINTENANT), 'actif');
  const presque91 = new Date(MAINTENANT.getTime() - 91 * 86_400_000 + 1).toISOString();
  assert.equal(statutActivite({ archived: false, pushed_at: presque91 }, MAINTENANT), 'ralenti');
});

test('statutActivite : archivé prioritaire même sans date, pushed_at null ou vide', () => {
  assert.equal(statutActivite({ archived: true }, MAINTENANT), 'archivé');
  assert.equal(statutActivite({ archived: true, pushed_at: ilYa(500) }, MAINTENANT), 'archivé');
  assert.equal(statutActivite({ archived: false, pushed_at: null }, MAINTENANT), 'inconnu');
  assert.equal(statutActivite({ archived: false, pushed_at: '' }, MAINTENANT), 'inconnu');
});

test('evolutionEtoiles : précédent à 0 n\'est pas un nouveau', () => {
  assert.equal(evolutionEtoiles(5, 0), 5);
});

test('formaterNombre : grands nombres et négatifs à trois chiffres', () => {
  assert.equal(formaterNombre(-999), '-999');
  assert.equal(formaterNombre(100000), '100 000');
  assert.equal(formaterNombre(-1234567), '-1 234 567');
});

test('formaterEvolution : grands écarts', () => {
  assert.equal(formaterEvolution(-1500), '-1 500');
  assert.equal(formaterEvolution(1), '+1');
});

test('instantane : tableau vide', () => {
  assert.deepEqual(instantane([]), {});
});

const base = { categorie: 'C', stargazers_count: 1, pushed_at: ilYa(1), archived: false };
const ligneDe = (depot) =>
  genererRapport({ date: '2026-10-16', depots: [{ ...base, ...depot }], precedent: {}, maintenant: MAINTENANT })
    .split('\n')
    .find((l) => l.startsWith('| ['));

test('genererRapport : description de 100 caractères gardée entière', () => {
  const ligne = ligneDe({ nom: 'a/b', description: 'y'.repeat(100) });
  assert.ok(ligne.endsWith(`| ${'y'.repeat(100)} |`));
});

test('genererRapport : description vide ou absente → tiret cadratin', () => {
  assert.ok(ligneDe({ nom: 'a/b', description: '' }).endsWith('| — |'));
  assert.ok(ligneDe({ nom: 'a/b' }).endsWith('| — |'));
});

test('genererRapport : retours à la ligne Windows et barres multiples', () => {
  assert.ok(ligneDe({ nom: 'a/b', description: 'a\r\nb|c|d' }).endsWith('| a b\\|c\\|d |'));
});

test('genererRapport : html_url vide → lien par défaut', () => {
  assert.ok(ligneDe({ nom: 'a/b', html_url: '' }).startsWith('| [a/b](https://github.com/a/b) |'));
});

test('genererRapport : catégorie unique, structure exacte et \\n final unique', () => {
  const md = genererRapport({
    date: '2026-10-16',
    depots: [{ ...base, nom: 'a/b', description: 'd', html_url: 'https://github.com/a/b' }],
    precedent: { 'a/b': 1 },
    maintenant: MAINTENANT,
  });
  assert.equal(
    md,
    [
      '# Radar IA — 2026-10-16',
      '',
      'Dépôts suivis : 1 · Nouveaux : 0 · Inactifs ou archivés : 0',
      '',
      '## C',
      '',
      '| Dépôt | Étoiles | Évolution | Activité | Description |',
      '|---|---|---|---|---|',
      '| [a/b](https://github.com/a/b) | 1 | = | actif | d |',
      '',
    ].join('\n'),
  );
});

test('genererRapport : ne modifie pas le tableau reçu', () => {
  const depots = [
    { ...base, nom: 'a/petit', stargazers_count: 1 },
    { ...base, nom: 'b/grand', stargazers_count: 9 },
  ];
  genererRapport({ date: '2026-10-16', depots, maintenant: MAINTENANT });
  assert.deepEqual(depots.map((d) => d.nom), ['a/petit', 'b/grand']);
});

test('genererRapport : TypeError pour un objet ou undefined', () => {
  assert.throws(() => genererRapport({ date: '2026-10-16', depots: {}, maintenant: MAINTENANT }), TypeError);
  assert.throws(() => genererRapport({ date: '2026-10-16', maintenant: MAINTENANT }), TypeError);
});
