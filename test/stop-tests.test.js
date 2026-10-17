// Teste le hook Stop du codeur. STOP_TESTS_COMMAND remplace `npm test` pour éviter une récursion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../.claude/hooks/stop-tests.mjs', import.meta.url));

function run(command, data = {}) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(data),
    encoding: 'utf8',
    env: { ...process.env, STOP_TESTS_COMMAND: command },
  });
}

test('laisse finir quand les tests passent', () => {
  assert.equal(run('node -e "process.exit(0)"').status, 0);
});

test('bloque quand les tests échouent, avec la sortie', () => {
  const result = run('node -e "console.log(\'1 test en échec\'); process.exit(1)"');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /1 test en échec/);
});

test('laisse finir si le codeur a déjà été relancé une fois', () => {
  assert.equal(run('node -e "process.exit(1)"', { stop_hook_active: true }).status, 0);
});
