# radar-ia

[![CI](https://github.com/ChewbacaHobo/radar-ia/actions/workflows/ci.yml/badge.svg)](https://github.com/ChewbacaHobo/radar-ia/actions/workflows/ci.yml)

Suit des dépôts GitHub d'outils IA (étoiles, activité) et produit un rapport Markdown daté.
Sert à garder à jour la veille sur les outils pour Claude Code.

Ce projet est construit par une **petite usine Claude Code** (niveau 3 → 4) :

```
toi : spec + tests d'acceptation  →  agent codeur  →  agent vérificateur  →  CI  →  toi : fusion
```

| Pièce | Fichier | Rôle |
|---|---|---|
| Spec | `specs/NNN-*.md` | Ce qu'on veut, en clair |
| Juge | `test/acceptance/NNN-*.test.js` | Les tests qui disent si la spec est respectée |
| Codeur | `.claude/agents/codeur.md` | Écrit le code et les tests unitaires, ouvre la PR |
| Vérificateur | `.claude/agents/verificateur.md` | Relit en lecture seule, verdict OK / À CORRIGER |
| Garde-fous | `.claude/hooks/*.mjs` | Bloquent ce qui est interdit (voir `CLAUDE.md`) |
| CI | `.github/workflows/ci.yml` | Lance `npm test` sur chaque PR |

## Utiliser l'usine

Ouvre ce dossier dans Claude Code (accepte la confiance du dossier : sans elle, les hooks des agents ne tournent pas), puis :

1. Écris ou fais écrire une spec et ses tests d'acceptation sur une branche `feat/NNN-...`.
2. `@codeur implémente specs/NNN-....md`
3. `@verificateur vérifie la PR n° X (spec NNN)`
4. Lis le verdict, puis fusionne la PR toi-même sur GitHub.

## Développer
- `npm test` : tous les tests (Node 22+, aucune dépendance)
