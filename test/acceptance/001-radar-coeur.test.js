// Juge de la spec 001. Écrit par l'orchestrateur : le codeur ne le modifie pas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  statutActivite,
  evolutionEtoiles,
  formaterNombre,
  formaterEvolution,
  instantane,
  genererRapport,
} from '../../src/radar.js';

const MAINTENANT = new Date('2026-10-16T12:00:00Z');
const ilYa = (jours) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

test('statutActivite : bornes 30 / 31 / 90 / 91 jours', () => {
  assert.equal(statutActivite({ archived: false, pushed_at: ilYa(30) }, MAINTENANT), 'actif');
  assert.equal(statutActivite({ archived: false, pushed_at: ilYa(31) }, MAINTENANT), 'ralenti');
  assert.equal(statutActivite({ archived: false, pushed_at: ilYa(90) }, MAINTENANT), 'ralenti');
  assert.equal(statutActivite({ archived: false, pushed_at: ilYa(91) }, MAINTENANT), 'inactif');
});

test('statutActivite : archivé prioritaire, date future, date illisible', () => {
  assert.equal(statutActivite({ archived: true, pushed_at: ilYa(1) }, MAINTENANT), 'archivé');
  assert.equal(statutActivite({ archived: false, pushed_at: ilYa(-3) }, MAINTENANT), 'actif');
  assert.equal(statutActivite({ archived: false, pushed_at: 'pas une date' }, MAINTENANT), 'inconnu');
  assert.equal(statutActivite({ archived: false }, MAINTENANT), 'inconnu');
});

test('evolutionEtoiles : nouveau, hausse, baisse, stable', () => {
  assert.equal(evolutionEtoiles(100, null), null);
  assert.equal(evolutionEtoiles(100, undefined), null);
  assert.equal(evolutionEtoiles(150, 100), 50);
  assert.equal(evolutionEtoiles(90, 100), -10);
  assert.equal(evolutionEtoiles(100, 100), 0);
});

test('formaterNombre : groupes de trois chiffres séparés par une espace', () => {
  assert.equal(formaterNombre(141571), '141 571');
  assert.equal(formaterNombre(999), '999');
  assert.equal(formaterNombre(1000), '1 000');
  assert.equal(formaterNombre(0), '0');
  assert.equal(formaterNombre(-1500), '-1 500');
  assert.equal(formaterNombre(1234567), '1 234 567');
});

test('formaterEvolution : nouveau, =, +, -', () => {
  assert.equal(formaterEvolution(null), 'nouveau');
  assert.equal(formaterEvolution(0), '=');
  assert.equal(formaterEvolution(1234), '+1 234');
  assert.equal(formaterEvolution(-56), '-56');
});

test('instantane : { nom: étoiles }', () => {
  const depots = [
    { nom: 'a/x', stargazers_count: 10 },
    { nom: 'b/y', stargazers_count: 0 },
  ];
  assert.deepEqual(instantane(depots), { 'a/x': 10, 'b/y': 0 });
});

const DEPOTS = [
  { nom: 'zed/spec', categorie: 'Specs', stargazers_count: 500, pushed_at: ilYa(2), archived: false, description: 'Spec kit', html_url: 'https://github.com/zed/spec' },
  { nom: 'gas/town', categorie: 'Orchestrateurs', stargazers_count: 18391, pushed_at: ilYa(1), archived: false, description: 'Gas Town', html_url: 'https://github.com/gas/town' },
  { nom: 'old/tool', categorie: 'Orchestrateurs', stargazers_count: 1200, pushed_at: ilYa(200), archived: false, description: 'A | B\nC', html_url: 'https://github.com/old/tool' },
  { nom: 'abc/spec', categorie: 'Specs', stargazers_count: 500, pushed_at: ilYa(40), archived: false, description: null },
  { nom: 'arch/ive', categorie: 'Écosystème', stargazers_count: 7, pushed_at: ilYa(1), archived: true, description: 'x'.repeat(150), html_url: 'https://github.com/arch/ive' },
];
const PRECEDENT = { 'zed/spec': 500, 'gas/town': 18000, 'old/tool': 1300, 'arch/ive': 7 };

function rapport() {
  return genererRapport({ date: '2026-10-16', depots: DEPOTS, precedent: PRECEDENT, maintenant: MAINTENANT });
}

test('genererRapport : titre, résumé et \\n final', () => {
  const md = rapport();
  const lignes = md.split('\n');
  assert.equal(lignes[0], '# Radar IA — 2026-10-16');
  assert.equal(lignes[1], '');
  assert.equal(lignes[2], 'Dépôts suivis : 5 · Nouveaux : 1 · Inactifs ou archivés : 2');
  assert.equal(lignes[3], '');
  assert.ok(md.endsWith('\n'));
});

test('genererRapport : catégories triées en ordre alphabétique français', () => {
  const md = rapport();
  const titres = md.split('\n').filter((l) => l.startsWith('## '));
  assert.deepEqual(titres, ['## Écosystème', '## Orchestrateurs', '## Specs']);
});

test('genererRapport : section complète, dépôts triés par étoiles', () => {
  const md = rapport();
  const attendu = [
    '## Orchestrateurs',
    '',
    '| Dépôt | Étoiles | Évolution | Activité | Description |',
    '|---|---|---|---|---|',
    '| [gas/town](https://github.com/gas/town) | 18 391 | +391 | actif | Gas Town |',
    '| [old/tool](https://github.com/old/tool) | 1 200 | -100 | inactif | A \\| B C |',
  ].join('\n');
  assert.ok(md.includes(attendu), `section Orchestrateurs introuvable dans :\n${md}`);
});

test('genererRapport : égalité d\'étoiles triée par nom, lien par défaut, description vide', () => {
  const md = rapport();
  const lignes = md.split('\n');
  const iAbc = lignes.indexOf('| [abc/spec](https://github.com/abc/spec) | 500 | nouveau | ralenti | — |');
  const iZed = lignes.indexOf('| [zed/spec](https://github.com/zed/spec) | 500 | = | actif | Spec kit |');
  assert.ok(iAbc > 0, 'ligne abc/spec introuvable');
  assert.ok(iZed > iAbc, 'abc/spec doit précéder zed/spec');
});

test('genererRapport : description de plus de 100 caractères coupée à 99 + …', () => {
  const md = rapport();
  const ligne = `| [arch/ive](https://github.com/arch/ive) | 7 | = | archivé | ${'x'.repeat(99)}… |`;
  assert.ok(md.split('\n').includes(ligne), 'ligne arch/ive introuvable ou description mal coupée');
});

test('genererRapport : coupe sur le texte brut, puis échappement des |', () => {
  const depots = [{ nom: 'o/r', categorie: 'C', stargazers_count: 1, pushed_at: ilYa(1), archived: false, description: `${'a'.repeat(98)}|bcd` }];
  const md = genererRapport({ date: '2026-10-16', depots, maintenant: MAINTENANT });
  assert.ok(md.includes(`| ${'a'.repeat(98)}\\|… |`), 'la coupe doit se faire avant l\'échappement');
});

test('genererRapport : précédent absent = tous nouveaux', () => {
  const md = genererRapport({ date: '2026-10-16', depots: DEPOTS.slice(0, 1), maintenant: MAINTENANT });
  assert.ok(md.includes('Dépôts suivis : 1 · Nouveaux : 1 · Inactifs ou archivés : 0'));
  assert.ok(md.includes('| [zed/spec](https://github.com/zed/spec) | 500 | nouveau | actif | Spec kit |'));
});

test('genererRapport : aucun dépôt', () => {
  const md = genererRapport({ date: '2026-10-16', depots: [], precedent: {}, maintenant: MAINTENANT });
  assert.equal(md, '# Radar IA — 2026-10-16\n\nDépôts suivis : 0 · Nouveaux : 0 · Inactifs ou archivés : 0\n\n_Aucun dépôt suivi._\n');
});

test('genererRapport : TypeError si depots n\'est pas un tableau', () => {
  assert.throws(() => genererRapport({ date: '2026-10-16', depots: null, maintenant: MAINTENANT }), TypeError);
});
