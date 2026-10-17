// Cœur du radar (spec 001) : fonctions pures, sans réseau ni fichiers.

const MS_PAR_JOUR = 86_400_000;
const TIRET_CADRATIN = '—';
const LONGUEUR_MAX_DESCRIPTION = 100;

// État d'activité d'un dépôt d'après archived et pushed_at.
export function statutActivite(depot, maintenant) {
  if (depot?.archived) return 'archivé';
  const pousse = depot?.pushed_at ? Date.parse(depot.pushed_at) : NaN;
  if (Number.isNaN(pousse)) return 'inconnu';
  const jours = Math.floor((maintenant.getTime() - pousse) / MS_PAR_JOUR);
  if (jours <= 30) return 'actif';
  if (jours <= 90) return 'ralenti';
  return 'inactif';
}

// Écart d'étoiles ; null si le dépôt est nouveau.
export function evolutionEtoiles(actuel, precedent) {
  if (precedent === null || precedent === undefined) return null;
  return actuel - precedent;
}

// Entier avec une espace entre chaque groupe de trois chiffres.
export function formaterNombre(n) {
  const chiffres = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return n < 0 ? `-${chiffres}` : chiffres;
}

export function formaterEvolution(delta) {
  if (delta === null || delta === undefined) return 'nouveau';
  if (delta === 0) return '=';
  return delta > 0 ? `+${formaterNombre(delta)}` : formaterNombre(delta);
}

// { "owner/repo": étoiles }, sert de précédent au prochain passage.
export function instantane(depots) {
  const resultat = {};
  for (const d of depots) resultat[d.nom] = d.stargazers_count;
  return resultat;
}

// Description sur une ligne, sans blancs aux bords, coupée puis échappée pour une cellule.
// Les longueurs se comptent en points de code : un emoji vaut 1 et n'est jamais coupé.
function formaterDescription(description) {
  if (description === null || description === undefined) return TIRET_CADRATIN;
  const texte = String(description).replace(/\r\n|\r|\n/g, ' ').trim();
  if (texte === '') return TIRET_CADRATIN;
  const caracteres = Array.from(texte);
  const coupe =
    caracteres.length > LONGUEUR_MAX_DESCRIPTION
      ? `${caracteres.slice(0, LONGUEUR_MAX_DESCRIPTION - 1).join('')}…`
      : texte;
  return coupe.replace(/\|/g, '\\|');
}

function etoilesPrecedentes(precedent, nom) {
  return precedent && Object.hasOwn(precedent, nom) ? precedent[nom] : undefined;
}

function ligneDepot(depot, precedent, maintenant) {
  const lien = depot.html_url || `https://github.com/${depot.nom}`;
  const delta = evolutionEtoiles(depot.stargazers_count, etoilesPrecedentes(precedent, depot.nom));
  return `| [${depot.nom}](${lien}) | ${formaterNombre(depot.stargazers_count)} | ${formaterEvolution(delta)} | ${statutActivite(depot, maintenant)} | ${formaterDescription(depot.description)} |`;
}

// Rapport Markdown complet, terminé par \n.
export function genererRapport({ date, depots, precedent, maintenant }) {
  if (!Array.isArray(depots)) throw new TypeError('depots doit être un tableau');

  const nouveaux = depots.filter((d) => etoilesPrecedentes(precedent, d.nom) == null).length;
  const endormis = depots.filter((d) => {
    const statut = statutActivite(d, maintenant);
    return statut === 'inactif' || statut === 'archivé';
  }).length;

  const blocs = [
    `# Radar IA ${TIRET_CADRATIN} ${date}`,
    `Dépôts suivis : ${depots.length} · Nouveaux : ${nouveaux} · Inactifs ou archivés : ${endormis}`,
  ];

  if (depots.length === 0) {
    blocs.push('_Aucun dépôt suivi._');
    return `${blocs.join('\n\n')}\n`;
  }

  const parCategorie = new Map();
  for (const d of depots) {
    if (!parCategorie.has(d.categorie)) parCategorie.set(d.categorie, []);
    parCategorie.get(d.categorie).push(d);
  }
  const categories = [...parCategorie.keys()].sort((a, b) => String(a).localeCompare(String(b), 'fr'));

  for (const categorie of categories) {
    const tries = [...parCategorie.get(categorie)].sort(
      (a, b) => b.stargazers_count - a.stargazers_count || a.nom.localeCompare(b.nom, 'fr'),
    );
    const tableau = [
      '| Dépôt | Étoiles | Évolution | Activité | Description |',
      '|---|---|---|---|---|',
      ...tries.map((d) => ligneDepot(d, precedent, maintenant)),
    ];
    blocs.push(`## ${categorie}`, tableau.join('\n'));
  }

  return `${blocs.join('\n\n')}\n`;
}
