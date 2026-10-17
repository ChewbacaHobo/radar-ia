# Règles du projet

## Avant de commencer
Lire `.claude/HANDOFF.md` : c'est l'état du travail et la source de vérité.

## Cycle de travail
1. Chaque tâche part d'une spec dans `specs/` ou d'une issue GitHub. Pas de spec claire : demander.
2. Jamais de commit sur `main`. Créer une branche (`git switch -c feat/ma-tache` ou `fix/...`).
3. Écrire ou mettre à jour les tests en même temps que le code. `npm test` doit passer avant de dire "fini".
4. Pousser la branche et ouvrir une pull request : `gh pr create --fill`.
5. La CI GitHub (job `test`) est le juge. Une PR rouge ne se fusionne pas : corriger, ne jamais contourner.
6. Mettre à jour `.claude/HANDOFF.md` à chaque étape terminée.

## Commandes
- Tests : `npm test`
- Ouvrir une PR : `gh pr create --fill`
- État de la CI d'une PR : `gh pr checks`
- Fusionner une PR verte : `gh pr merge --squash --delete-branch`

## Garde-fous
- `.claude/hooks/guard-git.mjs` bloque : commit sur main, push vers main, push forcé, `--no-verify`.
- GitHub bloque aussi tout push direct sur `main` : tout passe par une PR avec la CI verte.
