// Tests unitaires de src/collecte.js et src/cli.js : cas limites hors du juge. Pas de réseau.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapperDepot, collecter, lireDepotGh } from '../src/collecte.js';
import { executer, analyserArguments, dateLocale } from '../src/cli.js';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const MAINTENANT = new Date('2026-10-16T12:00:00Z');
const JSON_A = { stargazers_count: 4, pushed_at: '2026-10-10T00:00:00Z', archived: true, description: null, html_url: 'https://github.com/a/a' };

function projet(contenuConfig) {
  const racine = mkdtempSync(join(tmpdir(), 'radar-unit-'));
  if (contenuConfig !== undefined) writeFileSync(join(racine, 'radar.config.json'), contenuConfig);
  return racine;
}

const lireA = async () => JSON_A;

test('mapperDepot : archived true gardé, description null explicite, champs en trop ignorés', () => {
  const d = mapperDepot({ ...JSON_A, full_name: 'autre/nom', id: 1 }, { nom: 'a/a', categorie: 'C' });
  assert.deepEqual(d, { nom: 'a/a', categorie: 'C', ...JSON_A });
});

test('collecter : liste vide', async () => {
  assert.deepEqual(await collecter([], { lireDepot: lireA }), { depots: [], erreurs: [] });
});

test('collecter : rejet qui n\'est pas une Error, échec synchrone, tout en échec', async () => {
  const entrees = [{ nom: 'a/1', categorie: 'C' }, { nom: 'a/2', categorie: 'C' }];
  const lireDepot = (nom) => {
    if (nom === 'a/1') return Promise.reject('boum');
    throw new Error('HTTP 404'); // synchrone
  };
  assert.deepEqual(await collecter(entrees, { lireDepot }), {
    depots: [],
    erreurs: [{ nom: 'a/1', message: 'boum' }, { nom: 'a/2', message: 'HTTP 404' }],
  });
});

test('collecter : l\'ordre suit la configuration même si les réponses arrivent dans le désordre', async () => {
  const entrees = ['a/1', 'a/2', 'a/3'].map((nom) => ({ nom, categorie: 'C' }));
  const delais = { 'a/1': 30, 'a/2': 0, 'a/3': 10 };
  const lireDepot = (nom) => new Promise((ok) => setTimeout(() => ok(JSON_A), delais[nom]));
  const { depots } = await collecter(entrees, { lireDepot });
  assert.deepEqual(depots.map((d) => d.nom), ['a/1', 'a/2', 'a/3']);
});

test('lireDepotGh : nom invalide refusé sans lancer gh', async () => {
  await assert.rejects(lireDepotGh('../../user'), /nom de dépôt invalide/);
  await assert.rejects(lireDepotGh('sans-slash'), /nom de dépôt invalide/);
});

test('executer : configuration JSON invalide ou sans tableau depots → Error mentionnant radar.config.json', async () => {
  for (const contenu of ['{ pas du json', '{"autre": []}', 'null']) {
    const racine = projet(contenu);
    try {
      await assert.rejects(
        executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: lireA }),
        (e) => e instanceof Error && e.message.includes('radar.config.json'),
      );
      assert.ok(!existsSync(join(racine, 'rapports')));
    } finally {
      rmSync(racine, { recursive: true, force: true });
    }
  }
});

test('executer : date mal formée refusée avant toute écriture', async () => {
  const racine = projet(JSON.stringify({ depots: [] }));
  try {
    await assert.rejects(executer({ racine, date: '../x', maintenant: MAINTENANT, lireDepot: lireA }), /date invalide/);
    assert.ok(!existsSync(join(racine, 'data')));
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('executer : configuration vide → instantané {} et rapport sans erreurs', async () => {
  const racine = projet(JSON.stringify({ depots: [] }));
  try {
    const r = await executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: lireA });
    assert.equal(r.depots, 0);
    assert.equal(r.erreurs, 0);
    assert.equal(readFileSync(r.instantane, 'utf8'), '{}\n');
    assert.ok(readFileSync(r.rapport, 'utf8').includes('_Aucun dépôt suivi._'));
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('executer : remplace le rapport et l\'instantané du même jour ; dossier instantanes vide → précédent {}', async () => {
  const racine = projet(JSON.stringify({ depots: [{ nom: 'a/a', categorie: 'C' }] }));
  mkdirSync(join(racine, 'data', 'instantanes'), { recursive: true });
  mkdirSync(join(racine, 'rapports'), { recursive: true });
  writeFileSync(join(racine, 'rapports', 'radar-2026-10-16.md'), 'ancien');
  try {
    const r = await executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: lireA });
    const rapport = readFileSync(r.rapport, 'utf8');
    assert.ok(!rapport.includes('ancien'));
    assert.ok(rapport.includes('| 4 | nouveau |'));
    assert.equal(readFileSync(r.instantane, 'utf8'), '{\n  "a/a": 4\n}\n');
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('executer : nom de fichier presque daté ignoré (2026-10-1.json, 2026-10-01.json.bak)', async () => {
  const racine = projet(JSON.stringify({ depots: [{ nom: 'a/a', categorie: 'C' }] }));
  const dossier = join(racine, 'data', 'instantanes');
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, '2026-10-1.json'), '{"a/a": 1}');
  writeFileSync(join(dossier, '2026-10-01.json.bak'), '{"a/a": 1}');
  try {
    const r = await executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: lireA });
    assert.ok(readFileSync(r.rapport, 'utf8').includes('| 4 | nouveau |'));
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('analyserArguments : --date valide, absente, mal formée, argument inconnu', () => {
  assert.deepEqual(analyserArguments([]), {});
  assert.deepEqual(analyserArguments(['--date', '2026-10-16']), { date: '2026-10-16' });
  assert.throws(() => analyserArguments(['--date']), /--date attend/);
  assert.throws(() => analyserArguments(['--date', '16/10/2026']), /--date attend/);
  assert.throws(() => analyserArguments(['--verbose']), /argument inconnu/);
});

test('dateLocale : format AAAA-MM-JJ en heure locale', () => {
  assert.equal(dateLocale(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('node src/cli.js --date mal formée : code 1 et rien d\'écrit', () => {
  const racine = projet(JSON.stringify({ depots: [] }));
  try {
    const r = spawnSync(process.execPath, [CLI, '--date', 'demain'], { cwd: racine, encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /--date attend/);
    assert.ok(!existsSync(join(racine, 'rapports')));
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});
