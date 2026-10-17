// Teste le garde-fou git : le juge vérifie aussi les garde-fous.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../.claude/hooks/guard-git.mjs', import.meta.url));
let repo;

before(() => {
  repo = mkdtempSync(join(tmpdir(), 'guard-git-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
});

after(() => rmSync(repo, { recursive: true, force: true }));

function run(command, branch = 'main') {
  execFileSync('git', ['symbolic-ref', 'HEAD', `refs/heads/${branch}`], { cwd: repo });
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd: repo });
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8' }).status;
}

test('laisse passer les commandes sans git', () => {
  assert.equal(run('npm test'), 0);
});

test('laisse passer git status sur main', () => {
  assert.equal(run('git status'), 0);
});

test('bloque un commit sur main', () => {
  assert.equal(run('git add . && git commit -m "x"'), 2);
});

test('autorise un commit sur une branche', () => {
  assert.equal(run('git commit -m "x"', 'feat/test'), 0);
});

test('bloque git push depuis main', () => {
  assert.equal(run('git push'), 2);
});

test('bloque git push origin main depuis une branche', () => {
  assert.equal(run('git push origin main', 'feat/test'), 2);
});

test('autorise git push -u origin feat/test', () => {
  assert.equal(run('git push -u origin feat/test', 'feat/test'), 0);
});

test('bloque le push forcé', () => {
  assert.equal(run('git push --force origin feat/test', 'feat/test'), 2);
  assert.equal(run('git push origin +feat/test', 'feat/test'), 2);
});

test('bloque --no-verify', () => {
  assert.equal(run('git commit --no-verify -m "x"', 'feat/test'), 2);
});
