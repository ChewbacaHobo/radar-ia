# 001 — Cœur du radar : activité, évolution, rapport

## Objectif
À partir de données de dépôts GitHub déjà récupérées, calculer leur état d'activité et
l'évolution de leurs étoiles, puis produire le rapport Markdown. Pas de réseau ici :
fonctions pures, testables (la collecte viendra en 002).

## Comportement attendu
Un seul module `src/radar.js` (modules ES), qui exporte :

### `statutActivite(depot, maintenant)`
- `depot` : `{ archived, pushed_at }` (`pushed_at` = date ISO 8601) ; `maintenant` : `Date`.
- `archived` vrai → `'archivé'` (prioritaire sur tout le reste).
- Sinon, jours écoulés = `Math.floor((maintenant - date de pushed_at) / 86 400 000)` :
  - ≤ 30 → `'actif'` (une date dans le futur compte comme actif)
  - 31 à 90 → `'ralenti'`
  - > 90 → `'inactif'`
- `pushed_at` absent ou illisible → `'inconnu'`.

### `evolutionEtoiles(actuel, precedent)`
- `precedent` vaut `null` ou `undefined` → `null` (dépôt nouveau).
- Sinon → `actuel - precedent`.

### `formaterNombre(n)`
Entier avec une espace normale (U+0020) entre chaque groupe de trois chiffres :
`141571` → `'141 571'`, `999` → `'999'`, `1000` → `'1 000'`, `0` → `'0'`, `-1500` → `'-1 500'`.

### `formaterEvolution(delta)`
`null` → `'nouveau'` ; `0` → `'='` ; positif → `'+'` + `formaterNombre` (`'+1 234'`) ;
négatif → `formaterNombre` (`'-56'`, tiret ASCII).

### `instantane(depots)`
Objet `{ "owner/repo": étoiles }` pour chaque dépôt (servira de `precedent` au prochain passage).

### `genererRapport({ date, depots, precedent, maintenant })`
- `date` : `'AAAA-MM-JJ'` ; `depots` : tableau de
  `{ nom, categorie, stargazers_count, pushed_at, archived, description, html_url }` ;
  `precedent` : objet `{ nom: étoiles }`, peut être absent ; `maintenant` : `Date`.
- `depots` n'est pas un tableau → lève une `TypeError`.
- Le rapport est une chaîne Markdown, lignes séparées par `\n`, qui finit par `\n` :

```
# Radar IA — 2026-10-16

Dépôts suivis : 3 · Nouveaux : 1 · Inactifs ou archivés : 1

## Orchestrateurs

| Dépôt | Étoiles | Évolution | Activité | Description |
|---|---|---|---|---|
| [owner/repo](https://github.com/owner/repo) | 18 391 | +391 | actif | Gas Town |

## Specs

| Dépôt | Étoiles | Évolution | Activité | Description |
|---|---|---|---|---|
| ... |
```

- Titre : `# Radar IA — <date>` (tiret cadratin U+2014 entouré d'espaces).
- Ligne de résumé : nombre total de dépôts ; « Nouveaux » = dépôts absents de `precedent` ;
  « Inactifs ou archivés » = statut `'inactif'` ou `'archivé'`.
- Une section `## <categorie>` par catégorie, catégories triées par ordre alphabétique
  (`localeCompare(…, 'fr')`). Dans une section, dépôts triés par étoiles décroissantes,
  puis par `nom` croissant en cas d'égalité.
- Une ligne vide entre le titre, le résumé et chaque section ; une ligne vide entre le titre
  `##` et son tableau.
- Lien : `html_url`, ou `https://github.com/<nom>` s'il est absent.
- Description : `|` devient `\|`, chaque retour à la ligne devient une espace ; vide,
  `null` ou absente → `—` (U+2014) ; plus de 100 caractères → les 99 premiers suivis de `…`.
- Aucun dépôt → titre, ligne de résumé à 0, puis la ligne `_Aucun dépôt suivi._`, séparés
  par une ligne vide comme ailleurs :
  `'# Radar IA — 2026-10-16\n\nDépôts suivis : 0 · Nouveaux : 0 · Inactifs ou archivés : 0\n\n_Aucun dépôt suivi._\n'`.

## Critères d'acceptation (deviennent des tests)
- [ ] `statutActivite` : bornes 30/31/90/91 jours, archivé prioritaire, date future, date illisible.
- [ ] `evolutionEtoiles` : nouveau (`null`/`undefined`), hausse, baisse, stable.
- [ ] `formaterNombre` et `formaterEvolution` : tous les exemples ci-dessus.
- [ ] `instantane` : renvoie `{ nom: étoiles }`.
- [ ] `genererRapport` : titre, résumé, ordre des catégories et des dépôts, égalité d'étoiles,
      lien par défaut, échappement et coupe des descriptions, cas vide, `TypeError`, `\n` final.

## Hors périmètre
- Appels réseau, lecture/écriture de fichiers, ligne de commande (spec 002).
- Toute dépendance npm.
