# radar-ia

Suit des dépôts GitHub d'outils IA (étoiles, activité) et produit un rapport Markdown daté.
Construit par une petite usine Claude Code : spec → codeur → vérificateur → CI → fusion humaine.

## Avant de commencer
Lire `.claude/HANDOFF.md` : c'est l'état du travail et la source de vérité.

## Qui écrit quoi

| Chemin | Rôle | Écrit par |
|---|---|---|
| `specs/NNN-*.md` | ce qu'on construit | humain ou orchestrateur (session principale) |
| `test/acceptance/NNN-*.test.js` | le juge de chaque spec | humain ou orchestrateur |
| `src/`, `test/*.test.js` | code et tests unitaires | agent `codeur` |
| (rien) | relecture et verdict | agent `verificateur`, lecture seule |
| `main` | code fusionné | humain uniquement, PR verte |

## Cycle pour une spec

1. Orchestrateur : branche `feat/NNN-nom`, la spec et ses tests d'acceptation, commit
   `spec(NNN): ...`, push. Les tests d'acceptation échouent : c'est normal.
2. `@codeur implémente specs/NNN-nom.md` → code, tests, PR.
3. `@verificateur vérifie la PR n° X (spec NNN)` → OK ou À CORRIGER.
4. À CORRIGER : renvoyer le rapport au codeur, puis revérifier. OK : poster le verdict
   sur la PR (`gh pr comment`), et l'humain fusionne.

## Règles
- Jamais de commit sur `main`. Une branche par spec.
- Node 22+, modules ES, aucune dépendance npm sans spec qui le dit.
- `npm test` doit passer avant de dire « fini ». La CI GitHub (job `test`) est le juge final.
- Mettre à jour `.claude/HANDOFF.md` à chaque étape terminée.

## Garde-fous (hooks)
- `guard-git.mjs` (tout le monde) : pas de commit ni de push sur main, pas de push forcé, pas de `--no-verify`.
- `guard-codeur.mjs` (codeur) : aucune écriture dans `specs/` ni `test/acceptance/`.
- `stop-tests.mjs` (codeur) : il ne peut pas terminer tant que `npm test` échoue.
- `guard-verificateur.mjs` (vérificateur) : seules des commandes de lecture et de test.
- Chaque hook a ses tests dans `test/`. GitHub refuse aussi tout push direct sur `main`.

## Commandes
- Tests : `npm test`
- PR : `gh pr create` · CI : `gh pr checks` · diff : `gh pr diff`
