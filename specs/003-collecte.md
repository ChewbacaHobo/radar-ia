# 003 — Collecte GitHub et commande `radar`

## Objectif
Rendre le radar utilisable : lire la liste des dépôts suivis, récupérer leurs données sur
GitHub, garder un instantané daté et écrire le rapport Markdown du jour.

## Comportement attendu

### Configuration : `radar.config.json` (racine du projet, écrit par l'orchestrateur)
```json
{ "depots": [ { "nom": "owner/repo", "categorie": "Orchestrateurs" } ] }
```

### `src/collecte.js`
- `mapperDepot(json, entree)` : à partir de la réponse de l'API GitHub
  `GET /repos/{owner}/{repo}` et d'une entrée de la configuration, renvoie
  `{ nom, categorie, stargazers_count, pushed_at, archived, description, html_url }`.
  `nom` et `categorie` viennent de l'entrée (le nom de la configuration reste la clé, même
  si le dépôt a été renommé) ; les autres champs viennent de `json`. `archived` absent →
  `false` ; `description` absente → `null`.
- `async collecter(entrees, { lireDepot })` :
  - appelle `lireDepot(nom)` une fois par entrée ; `lireDepot` renvoie une promesse du
    JSON de l'API ;
  - renvoie `{ depots, erreurs }` : `depots` = les réussites, dans l'ordre de la
    configuration ; `erreurs` = `[{ nom, message }]`, une par échec (`message` = le message
    de l'erreur), dans l'ordre de la configuration. Un échec n'arrête pas la collecte.
- `lireDepotGh(nom)` : implémentation réelle, lance `gh api repos/<nom>` (gh installé et
  connecté) et renvoie le JSON. Pas de test d'acceptation : l'orchestrateur la teste à la main.

### `src/cli.js`
Exporte `async executer({ racine, date, maintenant, lireDepot })` :
1. Lit `<racine>/radar.config.json`. Absent ou illisible → lève une `Error` dont le message
   contient `radar.config.json`.
2. Précédent = l'instantané le plus récent de `<racine>/data/instantanes/` dont le nom
   `AAAA-MM-JJ.json` est **strictement antérieur** à `date`. Les autres fichiers sont
   ignorés. Aucun → `{}`.
3. Collecte avec `lireDepot`.
4. Écrit `<racine>/data/instantanes/<date>.json` : `instantane(depots)` (spec 001) en JSON
   indenté de 2 espaces, suivi de `\n`. Crée les dossiers au besoin ; remplace un fichier
   du même jour.
5. Écrit `<racine>/rapports/radar-<date>.md` : `genererRapport({ date, depots, precedent, maintenant })`,
   puis, seulement s'il y a des erreurs, `\n## Erreurs de collecte\n\n` suivi d'une ligne
   `- <nom> : <message>\n` par erreur.
6. Renvoie `{ rapport, instantane, depots, erreurs }` : chemins absolus des deux fichiers
   écrits, nombre de dépôts collectés, nombre d'erreurs.

Lancé directement, `node src/cli.js [--date AAAA-MM-JJ]` :
- `racine` = dossier courant ; `date` = `--date` ou la date du jour en heure locale ;
  `maintenant` = maintenant ; `lireDepot` = `lireDepotGh` ;
- affiche `Rapport : <chemin relatif à la racine> (<n> dépôts, <e> erreurs)` ;
- configuration absente → message d'erreur (mentionnant `radar.config.json`) et code de sortie 1.

## Critères d'acceptation (deviennent des tests)
- [ ] `mapperDepot` : champs, `archived` absent → `false`, `description` absente → `null`, nom de la configuration conservé.
- [ ] `collecter` : ordre conservé, erreurs collectées sans arrêter, `lireDepot` appelé une fois par dépôt.
- [ ] `executer` : configuration absente → `Error` mentionnant `radar.config.json`.
- [ ] `executer` : sans instantané précédent, écrit les deux fichiers, contenu exact de l'instantané et du rapport.
- [ ] `executer` : choisit l'instantané le plus récent strictement antérieur (ignore celui du jour, les plus récents, les autres fichiers).
- [ ] `executer` : section « Erreurs de collecte » exacte s'il y a des échecs, absente sinon ; valeur de retour exacte.
- [ ] `node src/cli.js` sans configuration : code de sortie 1, message mentionnant `radar.config.json`.

## Hors périmètre
- Le format du rapport lui-même (specs 001 et 002) : on appelle `genererRapport` tel quel.
- La planification (spec 004).
- Toute dépendance npm.
