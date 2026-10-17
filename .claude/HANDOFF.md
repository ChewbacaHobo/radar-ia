# HANDOFF — radar-ia

1. **But** : un outil qui suit des dépôts GitHub d'outils IA et produit un rapport Markdown daté, construit par l'usine spec → codeur → vérificateur → CI → fusion humaine.

2. **Fait**
   - Projet créé depuis `ChewbacaHobo/claude-factory-starter` (2026-10-16).
   - Usine en place : agents `codeur` et `verificateur`, hooks `guard-git`, `guard-codeur`, `stop-tests`, `guard-verificateur`, chacun testé (`test/`).

3. **En cours**
   - Spec 001 (cœur du radar : statut d'activité, évolution des étoiles, rapport Markdown).

4. **Prochaines étapes**
   - 001 : codeur → vérificateur → PR → fusion humaine.
   - 002 : collecte réelle via `gh api` + commande `node src/cli.js` qui écrit l'instantané et le rapport.
   - 003 : routine hebdomadaire (étape 4 du plan).

5. **Décisions prises**
   - Aucune dépendance npm : Node 22+ seul, tests avec `node --test`.
   - Le juge (specs + tests d'acceptation) est écrit par l'orchestrateur, jamais par le codeur.
   - Le codeur hérite du modèle principal (logique métier) ; le vérificateur est Sonnet, effort medium.

6. **Fichiers clés**
   - `CLAUDE.md` : règles et cycle de l'usine.
   - `.claude/agents/` : les deux agents.
   - `specs/` et `test/acceptance/` : le juge.

7. **Ne pas refaire**
   - `node --test test/` ne marche pas (dossier) : utiliser `npm test`.
