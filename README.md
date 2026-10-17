# claude-factory-starter

[![CI](https://github.com/ChewbacaHobo/claude-factory-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/ChewbacaHobo/claude-factory-starter/actions/workflows/ci.yml)

Modèle de projet pour travailler avec **Claude Code** comme une petite *software factory* :
tu écris ce que tu veux, Claude code et teste, et **la CI juge** avant que quoi que ce soit n'arrive sur `main`.

## Ce qu'il y a dedans

| Élément | Rôle |
|---|---|
| `CLAUDE.md` | Les règles que Claude suit dans ce projet |
| `.claude/HANDOFF.md` | L'état du travail, pour reprendre d'une session à l'autre |
| `.claude/hooks/guard-git.mjs` | Garde-fou : Claude ne peut pas committer ou pousser sur `main`, ni forcer un push |
| `specs/` | Les descriptions de ce qu'on construit (modèle dans `000-modele.md`) |
| `src/` + `test/` | Le code et ses tests (un petit exemple à remplacer) |
| `.github/workflows/ci.yml` | Le juge : lance `npm test` sur chaque pull request |

## Protections sur GitHub
- Personne ne pousse directement sur `main`, même le propriétaire.
- Une pull request ne se fusionne que si le job `test` est vert.
- Les branches fusionnées sont supprimées automatiquement.

## Démarrer un nouveau projet à partir de ce modèle

```bash
gh repo create mon-projet --template ChewbacaHobo/claude-factory-starter --public --clone
```

Puis ouvre le dossier dans Claude Code, remplis `.claude/HANDOFF.md`, et écris ta première spec dans `specs/`.

> Sur un compte GitHub gratuit, la protection de branche ne marche que sur les dépôts **publics**.
> Pour un dépôt privé protégé, il faut GitHub Pro.
> Les protections ne sont pas copiées par `--template`. Dans le nouveau projet, après le premier push, lance `node scripts/protect-main.mjs`.

## Commandes utiles
- `npm test` : lancer les tests (Node 22 ou plus, aucune dépendance)
- `gh pr create --fill` : ouvrir une pull request
- `gh pr checks` : voir si la CI est verte
- `gh pr merge --squash --delete-branch` : fusionner une PR verte
