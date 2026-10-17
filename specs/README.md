# Specs

Une spec = un fichier `NNN-nom-court.md` qui dit **quoi** construire, pas comment.
Copier `000-modele.md` pour en commencer une nouvelle.

Chaque spec a son juge : `test/acceptance/NNN-nom-court.test.js`, écrit en même temps
qu'elle, avant le code. Les deux sont commités ensemble (`spec(NNN): ...`) sur la
branche `feat/NNN-nom-court`. Le codeur ne peut modifier ni l'un ni l'autre.

Règle : chaque critère d'acceptation devient un test. Si on ne peut pas écrire le test,
la spec n'est pas assez claire.
