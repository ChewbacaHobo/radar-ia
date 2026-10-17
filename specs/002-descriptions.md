# 002 — Descriptions robustes

## Objectif
Corriger les deux remarques du vérificateur sur la spec 001 : une description faite
seulement d'espaces ou de retours à la ligne doit afficher `—`, et la coupe à 100
caractères ne doit jamais casser un emoji.

## Comportement attendu
Dans la colonne Description de `genererRapport` (`src/radar.js`), l'ordre de la spec 001
est conservé, avec deux changements :

1. Après le remplacement des retours à la ligne par des espaces, les blancs de début et de
   fin sont retirés (`String.prototype.trim`). Si le résultat est vide → `—` (U+2014).
2. Les longueurs se comptent en caractères Unicode (points de code), pas en unités UTF-16 :
   un emoji compte pour 1. Plus de 100 caractères → les 99 premiers caractères suivis de `…`.

L'échappement des `|` reste la dernière étape. Le reste du rapport ne change pas.

## Critères d'acceptation (deviennent des tests)
- [ ] `'   '`, `'\n'` et `' \r\n\t '` → `—`.
- [ ] `'  Gas Town  '` → `Gas Town`.
- [ ] 98 `a` suivis de 3 `😀` (101 caractères) → 98 `a`, un `😀`, puis `…`.
- [ ] Exactement 100 `😀` → pas de coupe.
- [ ] Les tests d'acceptation de la spec 001 passent toujours.

## Hors périmètre
- Tout le reste du rapport et des autres modules.
- Toute dépendance npm.
