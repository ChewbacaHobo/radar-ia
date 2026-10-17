#!/usr/bin/env node
// stop-tests.mjs : hook Stop de l'agent codeur (SubagentStop à l'exécution).
// Le codeur ne peut pas terminer tant que `npm test` échoue : code 2 + la fin de la sortie des tests.
// Si le codeur a déjà été relancé une fois par ce hook (stop_hook_active), on le laisse finir :
// le vérificateur et la CI jugeront. Ça évite une boucle sans fin.
// STOP_TESTS_COMMAND remplace `npm test` (utilisé par les tests de ce hook).

import { execSync } from 'node:child_process';

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;

let data = {};
try {
  data = JSON.parse(input);
} catch {
  /* entrée vide ou illisible : on lance quand même les tests */
}

if (data.stop_hook_active) process.exit(0);

const command = process.env.STOP_TESTS_COMMAND || 'npm test';
// data.cwd d'abord : dans un worktree, c'est lui qu'il faut tester, pas la copie principale.
const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

try {
  execSync(command, { cwd, stdio: 'pipe', encoding: 'utf8', timeout: 120_000 });
  process.exit(0);
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-30).join('\n');
  console.error(
    `Bloqué par .claude/hooks/stop-tests.mjs : \`${command}\` échoue, tu ne peux pas terminer. ` +
      `Corrige le code (jamais les tests d'acceptation).\n${output}`,
  );
  process.exit(2);
}
