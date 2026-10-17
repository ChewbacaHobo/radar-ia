# HANDOFF — radar-ia

1. **But** : un outil qui suit des dépôts GitHub d'outils IA et produit un rapport Markdown daté, construit par l'usine spec → codeur → vérificateur → CI → fusion humaine.

2. **Fait**
   - Projet créé depuis `ChewbacaHobo/claude-factory-starter` (2026-10-16), `main` protégée.
   - Usine en place : agents `codeur` et `verificateur`, hooks `guard-git`, `guard-codeur`, `stop-tests`, `guard-verificateur`, chacun testé (`test/`).
   - Spec 001 (cœur du radar) : juge validé contre une implémentation jetable, codé par `codeur` (`src/radar.js`, `test/radar.test.js`), verdict `verificateur` OK, revérifié par l'orchestrateur (juge intact, 70 tests, CI verte). PR n° 1.

3. **En cours**
   - PR n° 1 : à fusionner par l'humain.

4. **Prochaines étapes**
   - Premier exercice à faire **dans une session ouverte dans ce dossier** (agents et hooks chargés pour de vrai) : spec 002 « descriptions » — une description faite seulement d'espaces ou de retours à la ligne donne `—` ; la coupe à 99 caractères ne casse pas un emoji. Remarques mineures du vérificateur sur 001.
   - Spec 003 : collecte réelle via `gh api` + `node src/cli.js` qui écrit l'instantané (`data/`) et le rapport (`rapports/`).
   - Spec 004 : routine hebdomadaire (étape 4 du plan).

5. **Décisions prises**
   - Aucune dépendance npm : Node 22+ seul, tests avec `node --test`.
   - Le juge (specs + tests d'acceptation) est écrit par l'orchestrateur, jamais par le codeur.
   - Le codeur hérite du modèle principal (logique métier) ; le vérificateur est Sonnet, effort medium.
   - Description : normalisation, puis coupe sur le texte brut, puis échappement des `|` (choix du codeur, ajouté à la spec 001 avec un test).
   - Un dépôt dont l'entrée `precedent` vaut `null` compte comme nouveau.

6. **Fichiers clés**
   - `CLAUDE.md` : règles et cycle de l'usine.
   - `.claude/agents/` : les deux agents.
   - `specs/` et `test/acceptance/` : le juge.
   - `src/radar.js` : le cœur (fonctions pures).

7. **Ne pas refaire**
   - `node --test test/` ne marche pas (dossier) : utiliser `npm test`.
   - Des agents créés pendant une session ne sont pas chargés par cette session (nouveau dossier `agents/`) : ouvrir une nouvelle session dans le dossier, et accepter la confiance du dossier pour que les hooks du frontmatter tournent.
