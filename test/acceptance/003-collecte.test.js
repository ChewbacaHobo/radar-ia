// Juge de la spec 003. Écrit par l'orchestrateur : le codeur ne le modifie pas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapperDepot, collecter } from '../../src/collecte.js';
import { executer } from '../../src/cli.js';
import { genererRapport } from '../../src/radar.js';

const CLI = fileURLToPath(new URL('../../src/cli.js', import.meta.url));
const MAINTENANT = new Date('2026-10-16T12:00:00Z');

const API = {
  'a/x': { full_name: 'a/x', stargazers_count: 10, pushed_at: '2026-10-15T00:00:00Z', archived: false, description: 'Outil X', html_url: 'https://github.com/a/x' },
  'b/y': { full_name: 'nouveau-nom/y', stargazers_count: 3, pushed_at: '2026-01-01T00:00:00Z', html_url: 'https://github.com/nouveau-nom/y' },
};
const CONFIG = { depots: [{ nom: 'a/x', categorie: 'Orchestrateurs' }, { nom: 'c/z', categorie: 'Specs' }, { nom: 'b/y', categorie: 'Specs' }] };

function fauxLireDepot(appels = []) {
  return async (nom) => {
    appels.push(nom);
    if (!API[nom]) throw new Error('introuvable');
    return API[nom];
  };
}

function dossierProjet(config = CONFIG) {
  const racine = mkdtempSync(join(tmpdir(), 'radar-003-'));
  if (config) writeFileSync(join(racine, 'radar.config.json'), JSON.stringify(config));
  return racine;
}

test('mapperDepot : champs, valeurs par défaut, nom de la configuration conservé', () => {
  assert.deepEqual(mapperDepot(API['a/x'], { nom: 'a/x', categorie: 'Orchestrateurs' }), {
    nom: 'a/x', categorie: 'Orchestrateurs', stargazers_count: 10, pushed_at: '2026-10-15T00:00:00Z',
    archived: false, description: 'Outil X', html_url: 'https://github.com/a/x',
  });
  assert.deepEqual(mapperDepot(API['b/y'], { nom: 'b/y', categorie: 'Specs' }), {
    nom: 'b/y', categorie: 'Specs', stargazers_count: 3, pushed_at: '2026-01-01T00:00:00Z',
    archived: false, description: null, html_url: 'https://github.com/nouveau-nom/y',
  });
});

test('collecter : ordre conservé, erreurs collectées sans arrêter, un appel par dépôt', async () => {
  const appels = [];
  const { depots, erreurs } = await collecter(CONFIG.depots, { lireDepot: fauxLireDepot(appels) });
  assert.deepEqual(depots.map((d) => d.nom), ['a/x', 'b/y']);
  assert.deepEqual(erreurs, [{ nom: 'c/z', message: 'introuvable' }]);
  assert.deepEqual([...appels].sort(), ['a/x', 'b/y', 'c/z']);
});

test('executer : configuration absente → Error mentionnant radar.config.json', async () => {
  const racine = dossierProjet(null);
  try {
    await assert.rejects(
      executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: fauxLireDepot() }),
      (e) => e instanceof Error && e.message.includes('radar.config.json'),
    );
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('executer : premier passage, fichiers écrits, erreurs listées, valeur de retour', async () => {
  const racine = dossierProjet();
  try {
    const resultat = await executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: fauxLireDepot() });
    const fichierInstantane = join(racine, 'data', 'instantanes', '2026-10-16.json');
    const fichierRapport = join(racine, 'rapports', 'radar-2026-10-16.md');
    assert.deepEqual(resultat, { rapport: fichierRapport, instantane: fichierInstantane, depots: 2, erreurs: 1 });

    assert.equal(readFileSync(fichierInstantane, 'utf8'), `${JSON.stringify({ 'a/x': 10, 'b/y': 3 }, null, 2)}\n`);

    const depots = [mapperDepot(API['a/x'], CONFIG.depots[0]), mapperDepot(API['b/y'], CONFIG.depots[2])];
    const attendu = genererRapport({ date: '2026-10-16', depots, precedent: {}, maintenant: MAINTENANT })
      + '\n## Erreurs de collecte\n\n- c/z : introuvable\n';
    assert.equal(readFileSync(fichierRapport, 'utf8'), attendu);
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('executer : précédent = instantané le plus récent strictement antérieur ; pas de section erreurs sans échec', async () => {
  const config = { depots: [{ nom: 'a/x', categorie: 'Orchestrateurs' }] };
  const racine = dossierProjet(config);
  const dossier = join(racine, 'data', 'instantanes');
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, '2026-10-01.json'), JSON.stringify({ 'a/x': 5 }));
  writeFileSync(join(dossier, '2026-10-09.json'), JSON.stringify({ 'a/x': 8 }));
  writeFileSync(join(dossier, '2026-10-16.json'), JSON.stringify({ 'a/x': 999 }));
  writeFileSync(join(dossier, '2026-10-20.json'), JSON.stringify({ 'a/x': 1000 }));
  writeFileSync(join(dossier, 'notes.txt'), 'à ignorer');
  try {
    await executer({ racine, date: '2026-10-16', maintenant: MAINTENANT, lireDepot: fauxLireDepot() });
    const rapport = readFileSync(join(racine, 'rapports', 'radar-2026-10-16.md'), 'utf8');
    const attendu = genererRapport({ date: '2026-10-16', depots: [mapperDepot(API['a/x'], config.depots[0])], precedent: { 'a/x': 8 }, maintenant: MAINTENANT });
    assert.equal(rapport, attendu);
    assert.ok(rapport.includes('| 10 | +2 |'));
    assert.ok(!rapport.includes('Erreurs de collecte'));
    assert.equal(readFileSync(join(dossier, '2026-10-16.json'), 'utf8'), `${JSON.stringify({ 'a/x': 10 }, null, 2)}\n`);
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('node src/cli.js sans configuration : code 1 et message', () => {
  const racine = dossierProjet(null);
  try {
    const r = spawnSync(process.execPath, [CLI], { cwd: racine, encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(`${r.stdout}${r.stderr}`, /radar\.config\.json/);
    assert.ok(!existsSync(join(racine, 'rapports')), 'rien ne doit être écrit');
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});
