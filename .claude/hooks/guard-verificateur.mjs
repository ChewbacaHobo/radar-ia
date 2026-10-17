#!/usr/bin/env node
// guard-verificateur.mjs : hook PreToolUse (Bash / PowerShell) de l'agent vérificateur.
// Le vérificateur est en lecture seule : seules des commandes de lecture et de test passent.
// Pas d'enchaînement (; & | < > ` $()), pas d'écriture via git (--output), pas de gh pr merge/review.
// Bloqué = code 2 ; le message (stderr) est renvoyé au vérificateur.

const GIT = String.raw`git( -C ("[^"]*"|\S+))?`;
const ALLOWED = [
  /^npm (test|run test)$/,
  /^node --test( [\w./-]+)*$/,
  new RegExp(String.raw`^${GIT} (status|diff|log|show|rev-parse|merge-base|ls-files|blame)( .*)?$`),
  new RegExp(String.raw`^${GIT} branch( (--show-current|-a|-r|-vv?|--list))*$`),
  /^gh pr (view|diff|checks|list)( .*)?$/,
  /^gh run (view|list)( .*)?$/,
];
const FORBIDDEN = /[;&|<>`]|\$\(|--output\b|--web\b/;

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;

let command = '';
try {
  command = JSON.parse(input).tool_input?.command ?? '';
} catch {
  /* bloqué plus bas */
}

// gh appelé par son chemin complet sous Windows : "C:\Program Files\GitHub CLI\gh.exe" pr diff 3
const normalized = String(command)
  .trim()
  .replace(/^&\s*/, '')
  .replace(/^(["'])[^"']*[\\/]gh(\.exe)?\1/i, 'gh');

if (normalized && !FORBIDDEN.test(normalized) && ALLOWED.some((rule) => rule.test(normalized))) process.exit(0);

console.error(
  'Bloqué par .claude/hooks/guard-verificateur.mjs : le vérificateur est en lecture seule. ' +
    'Commandes permises, une à la fois : npm test, node --test, git status/diff/log/show/rev-parse/merge-base/ls-files/blame/branch, ' +
    'gh pr view/diff/checks/list, gh run view/list. Pour lire des fichiers, utilise Read, Grep ou Glob.',
);
process.exit(2);
