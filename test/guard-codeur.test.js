// Teste le garde-fou du codeur : il ne peut pas modifier le juge (specs/, test/acceptance/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOOK = join(ROOT, '.claude', 'hooks', 'guard-codeur.mjs');

function run(tool_name, tool_input) {
  const input = JSON.stringify({ tool_name, tool_input, cwd: ROOT });
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } }).status;
}

test('bloque Write dans specs/', () => {
  assert.equal(run('Write', { file_path: join(ROOT, 'specs', '001-radar.md') }), 2);
});

test('bloque Edit dans test/acceptance/ (chemin relatif)', () => {
  assert.equal(run('Edit', { file_path: 'test/acceptance/001-radar.test.js' }), 2);
});

test('autorise Write dans src/ et test/', () => {
  assert.equal(run('Write', { file_path: join(ROOT, 'src', 'radar.js') }), 0);
  assert.equal(run('Write', { file_path: join(ROOT, 'test', 'radar.test.js') }), 0);
});

test('bloque une redirection Bash vers test/acceptance/', () => {
  assert.equal(run('Bash', { command: 'echo x > test/acceptance/001-radar.test.js' }), 2);
});

test('bloque git checkout et rm sur specs/', () => {
  assert.equal(run('Bash', { command: 'git checkout -- specs/001-radar.md' }), 2);
  assert.equal(run('Bash', { command: 'rm -rf specs' }), 2);
});

test('bloque Set-Content PowerShell avec un chemin Windows', () => {
  assert.equal(run('PowerShell', { command: 'Set-Content .\\specs\\001-radar.md "x"' }), 2);
});

test('autorise la lecture et les tests', () => {
  assert.equal(run('Bash', { command: 'cat specs/001-radar.md' }), 0);
  assert.equal(run('Bash', { command: 'npm test' }), 0);
  assert.equal(run('Bash', { command: 'git diff origin/main -- test/acceptance' }), 0);
});
