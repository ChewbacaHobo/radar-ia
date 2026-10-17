#!/usr/bin/env node
// guard-git.mjs : hook PreToolUse (Bash et PowerShell).
// Bloque (code 2) : commit sur main/master, push vers main/master, push forcé, --no-verify.
// Tout le reste passe (code 0). Une entrée illisible passe aussi : ce hook est un garde-fou, pas un pare-feu.

import { execFileSync } from 'node:child_process';

const PROTECTED = new Set(['main', 'master']);

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;

let command = '';
let cwd = process.cwd();
try {
  const data = JSON.parse(input);
  command = data.tool_input?.command ?? '';
  cwd = data.cwd || cwd;
} catch {
  process.exit(0);
}
if (typeof command !== 'string' || !/\bgit\b/.test(command)) process.exit(0);

function currentBranch() {
  try {
    // symbolic-ref marche aussi dans un dépôt sans commit ; en HEAD détaché il échoue -> ''.
    return execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function block(reason) {
  console.error(`Bloqué par .claude/hooks/guard-git.mjs : ${reason}`);
  process.exit(2);
}

if (/--no-verify\b/.test(command)) block('--no-verify est interdit, corrige plutôt ce qui échoue.');

for (const push of command.match(/\bgit\s+push\b[^;&|\n]*/g) ?? []) {
  if (/\s(--force|--force-with-lease|-f)\b|\s\+\S/.test(push)) block('push forcé interdit.');
  const words = push.trim().split(/\s+/).slice(2).filter((w) => !w.startsWith('-'));
  const targetsProtected = words.slice(1).some((w) => PROTECTED.has(w.split(':').pop()));
  if (targetsProtected || (words.length <= 1 && PROTECTED.has(currentBranch()))) {
    block('push vers main interdit. Pousse une branche et ouvre une pull request (gh pr create --fill).');
  }
}

if (/\bgit\s+commit\b/.test(command) && PROTECTED.has(currentBranch())) {
  block('commit sur main interdit. Crée une branche : git switch -c feat/ma-tache');
}

process.exit(0);
