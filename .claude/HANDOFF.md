# HANDOFF — radar-ia

1. **But** : un outil qui suit des dépôts GitHub d'outils IA et produit un rapport Markdown daté, construit par l'usine spec → codeur → vérificateur → CI → fusion humaine.

2. **Fait**
   - Projet créé depuis `ChewbacaHobo/claude-factory-starter` (2026-10-16), `main` protégée.
   - Usine en place : agents `codeur` et `verificateur`, hooks `guard-git`, `guard-codeur`, `stop-tests`, `guard-verificateur`, chacun testé (`test/`).
   - Spec 001 (cœur du radar) : PR n° 1, verdict OK.
   - Étape 3 (parallèle) : PR n° 2 = worktrees (`isolation: worktree` pour le codeur, guard-codeur compatible worktrees) + CI ubuntu et windows avec job résumé `test`.
   - Specs 002 (descriptions robustes) et 003 (collecte `gh api` + `node src/cli.js` + `radar.config.json`, 20 dépôts) codées **en parallèle** par deux codeurs dans deux worktrees (`C:\AI Project\radar-ia.worktrees\002` et `\003`), vérifiées en parallèle : PR n° 3 et n° 4, verdicts OK, contre-vérifiées. Essai réel de la 003 sur GitHub : 20 dépôts, 0 erreur (2026-10-17).

3. **En cours**
   - Fusions par l'humain, dans l'ordre : n° 1, puis n° 2, puis n° 3 et n° 4 (empilées sur la n° 1 : GitHub les rebranche sur `main`, puis « Update branch », CI verte, fusion ; refaire « Update branch » sur la dernière).
   - Relecture Claude sur GitHub (`claude-code-action`) : à installer par l'humain avec `/install-github-app` (le Code Review géré est réservé à Team/Enterprise).

4. **Prochaines étapes**
   - Après les fusions : `git worktree remove` des deux worktrees, supprimer les branches locales.
   - Premier vrai rapport : `node src/cli.js` sur `main`, commit de `data/` et `rapports/` par PR.
   - Spec 004 : passage hebdomadaire automatique (routine ou GitHub Actions planifiée) qui ouvre une PR avec le rapport (étape 4 du plan).
   - Idées notées : coupe par graphèmes (`Intl.Segmenter`) si les emoji composés posent problème ; instantané corrompu = erreur claire (choix actuel).

5. **Décisions prises**
   - Aucune dépendance npm : Node 22+ seul, tests avec `node --test`.
   - Le juge (specs + tests d'acceptation + `radar.config.json`) est écrit par l'orchestrateur, jamais par le codeur, et validé contre une implémentation jetable avant de lancer le codeur.
   - Le codeur hérite du modèle principal (logique métier) ; le vérificateur est Sonnet, effort medium.
   - Description : normalisation, `trim`, vide → `—`, coupe en points de code (99 + `…`), échappement des `|` en dernier.
   - Un dépôt dont l'entrée `precedent` vaut `null` compte comme nouveau ; un dépôt en échec de collecte n'entre pas dans l'instantané.
   - Specs parallèles seulement si elles touchent des fichiers différents.

6. **Fichiers clés**
   - `CLAUDE.md` : règles, cycle et travail en parallèle.
   - `.claude/agents/` : les deux agents.
   - `specs/`, `test/acceptance/`, `radar.config.json` : le juge et les données d'entrée.
   - `src/radar.js` (rapport), `src/collecte.js` (GitHub), `src/cli.js` (commande).

7. **Ne pas refaire**
   - `node --test test/` ne marche pas (dossier) : utiliser `npm test`.
   - Des agents créés pendant une session ne sont pas chargés par cette session : ouvrir une nouvelle session dans le dossier et accepter la confiance du dossier pour que les hooks du frontmatter tournent.
   - Une branche ne peut être extraite que dans un seul worktree : garder la copie principale sur `main`.
