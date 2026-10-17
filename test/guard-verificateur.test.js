// Teste le garde-fou du vérificateur : lecture et tests seulement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../.claude/hooks/guard-verificateur.mjs', import.meta.url));

function run(command) {
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command } });
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8' }).status;
}

const AUTORISEES = [
  'npm test',
  'node --test test/acceptance',
  'git diff origin/main...HEAD',
  'git log --format="%h %s" origin/main..HEAD -- specs test/acceptance',
  'git -C "C:/AI Project/radar-ia" status',
  'git branch --show-current',
  'gh pr view 3 --json title,body',
  'gh pr checks 3',
  '"C:\\Program Files\\GitHub CLI\\gh.exe" pr diff 3',
  '& "C:\\Program Files\\GitHub CLI\\gh.exe" pr checks 3',
];

const BLOQUEES = [
  'git commit -m "x"',
  'git push',
  'git branch nouvelle',
  'git diff --output=diff.txt',
  'rm -rf src',
  'npm test && git push',
  'npm test; rm x',
  'echo salut > a.txt',
  'gh pr merge 3 --squash',
  'gh pr review 3 --approve',
  'gh pr view 3 --web',
  'npm install left-pad',
  '',
];

for (const command of AUTORISEES) {
  test(`autorise : ${command}`, () => assert.equal(run(command), 0));
}

for (const command of BLOQUEES) {
  test(`bloque : ${command || '(vide)'}`, () => assert.equal(run(command), 2));
}
