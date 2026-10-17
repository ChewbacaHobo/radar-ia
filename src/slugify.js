// Exemple de code métier, là pour montrer le cycle spec -> tests -> CI.
// Remplace-le par ton vrai projet.

/**
 * Transforme un texte en identifiant d'URL : "Bonjour le Monde !" -> "bonjour-le-monde".
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (typeof text !== 'string') throw new TypeError('slugify attend une chaîne');
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
