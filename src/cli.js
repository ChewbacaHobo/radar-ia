// Commande radar (spec 003) : collecte, instantané daté et rapport du jour.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collecter, lireDepotGh } from './collecte.js';
import { genererRapport, instantane } from './radar.js';

const FICHIER_CONFIG = 'radar.config.json';
const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NOM_INSTANTANE = /^(\d{4}-\d{2}-\d{2})\.json$/;

async function lireConfiguration(racine) {
  const chemin = resolve(racine, FICHIER_CONFIG);
  let config;
  try {
    config = JSON.parse(await readFile(chemin, 'utf8'));
  } catch (e) {
    throw new Error(`${FICHIER_CONFIG} absent ou illisible (${chemin}) : ${e.message}`);
  }
  if (!Array.isArray(config?.depots)) {
    throw new Error(`${FICHIER_CONFIG} invalide : la clé "depots" doit être un tableau`);
  }
  return config;
}

// Instantané le plus récent strictement antérieur à date ; {} s'il n'y en a pas.
async function lirePrecedent(dossier, date) {
  let noms;
  try {
    noms = await readdir(dossier);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
  const anterieurs = noms
    .map((n) => NOM_INSTANTANE.exec(n)?.[1])
    .filter((d) => d && d < date)
    .sort();
  if (anterieurs.length === 0) return {};
  const chemin = resolve(dossier, `${anterieurs.at(-1)}.json`);
  try {
    return JSON.parse(await readFile(chemin, 'utf8'));
  } catch (e) {
    throw new Error(`instantané précédent illisible (${chemin}) : ${e.message}`);
  }
}

function sectionErreurs(erreurs) {
  if (erreurs.length === 0) return '';
  return `\n## Erreurs de collecte\n\n${erreurs.map((e) => `- ${e.nom} : ${e.message}\n`).join('')}`;
}

export async function executer({ racine, date, maintenant, lireDepot }) {
  if (!FORMAT_DATE.test(String(date))) throw new Error(`date invalide : ${date} (attendu AAAA-MM-JJ)`);
  const config = await lireConfiguration(racine);
  const dossierInstantanes = resolve(racine, 'data', 'instantanes');
  const precedent = await lirePrecedent(dossierInstantanes, date);

  const { depots, erreurs } = await collecter(config.depots, { lireDepot });

  const fichierInstantane = resolve(dossierInstantanes, `${date}.json`);
  await mkdir(dossierInstantanes, { recursive: true });
  await writeFile(fichierInstantane, `${JSON.stringify(instantane(depots), null, 2)}\n`);

  const dossierRapports = resolve(racine, 'rapports');
  const fichierRapport = resolve(dossierRapports, `radar-${date}.md`);
  await mkdir(dossierRapports, { recursive: true });
  await writeFile(fichierRapport, genererRapport({ date, depots, precedent, maintenant }) + sectionErreurs(erreurs));

  return { rapport: fichierRapport, instantane: fichierInstantane, depots: depots.length, erreurs: erreurs.length };
}

// Date du jour AAAA-MM-JJ en heure locale.
export function dateLocale(d) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

// Arguments de la ligne de commande : seulement [--date AAAA-MM-JJ].
export function analyserArguments(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--date') {
      const valeur = argv[++i];
      if (!FORMAT_DATE.test(valeur ?? '')) throw new Error(`--date attend AAAA-MM-JJ, reçu : ${valeur ?? '(rien)'}`);
      options.date = valeur;
    } else {
      throw new Error(`argument inconnu : ${argv[i]} (usage : node src/cli.js [--date AAAA-MM-JJ])`);
    }
  }
  return options;
}

async function principal() {
  try {
    const options = analyserArguments(process.argv.slice(2));
    const maintenant = new Date();
    const racine = process.cwd();
    const r = await executer({ racine, date: options.date ?? dateLocale(maintenant), maintenant, lireDepot: lireDepotGh });
    console.log(`Rapport : ${relative(racine, r.rapport)} (${r.depots} dépôts, ${r.erreurs} erreurs)`);
  } catch (e) {
    console.error(`Erreur : ${e.message}`);
    process.exitCode = 1;
  }
}

function estLanceDirectement() {
  if (!process.argv[1]) return false;
  const ici = fileURLToPath(import.meta.url);
  const lance = resolve(process.argv[1]);
  return process.platform === 'win32' ? ici.toLowerCase() === lance.toLowerCase() : ici === lance;
}

if (estLanceDirectement()) await principal();
