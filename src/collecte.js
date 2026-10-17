// Collecte GitHub (spec 003) : transforme les réponses de l'API en dépôts du radar.
import { execFile } from 'node:child_process';

const NOM_DEPOT = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

// Dépôt du radar à partir de GET /repos/{owner}/{repo} et d'une entrée de configuration.
export function mapperDepot(json, entree) {
  return {
    nom: entree.nom,
    categorie: entree.categorie,
    stargazers_count: json.stargazers_count,
    pushed_at: json.pushed_at,
    archived: json.archived ?? false,
    description: json.description ?? null,
    html_url: json.html_url,
  };
}

function messageErreur(e) {
  return e instanceof Error ? e.message : String(e);
}

// Lit chaque dépôt ; un échec est noté sans arrêter les autres. Ordre de la configuration.
export async function collecter(entrees, { lireDepot }) {
  // async : un lireDepot qui lève de façon synchrone devient un rejet, pas un arrêt.
  const resultats = await Promise.allSettled(entrees.map(async (entree) => lireDepot(entree.nom)));
  const depots = [];
  const erreurs = [];
  resultats.forEach((r, i) => {
    const entree = entrees[i];
    if (r.status === 'fulfilled') {
      try {
        depots.push(mapperDepot(r.value, entree));
      } catch (e) {
        erreurs.push({ nom: entree.nom, message: messageErreur(e) });
      }
    } else {
      erreurs.push({ nom: entree.nom, message: messageErreur(r.reason) });
    }
  });
  return { depots, erreurs };
}

// Implémentation réelle : `gh api repos/<nom>` (gh installé et connecté).
export function lireDepotGh(nom) {
  if (!NOM_DEPOT.test(nom)) return Promise.reject(new Error(`nom de dépôt invalide : ${nom}`));
  return new Promise((resoudre, rejeter) => {
    execFile('gh', ['api', `repos/${nom}`], { maxBuffer: 10 * 1024 * 1024 }, (erreur, stdout, stderr) => {
      if (erreur) {
        const detail = String(stderr || '').trim() || erreur.message;
        rejeter(new Error(detail));
        return;
      }
      try {
        resoudre(JSON.parse(stdout));
      } catch {
        rejeter(new Error('réponse de gh illisible (JSON invalide)'));
      }
    });
  });
}
