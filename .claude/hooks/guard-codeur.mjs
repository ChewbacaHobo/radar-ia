#!/usr/bin/env node
// guard-codeur.mjs : hook PreToolUse de l'agent codeur.
// Le codeur ne touche jamais au juge : specs/ et test/acceptance/ sont en lecture seule pour lui.
// - Edit / Write / NotebookEdit : bloqué si le fichier visé est dans une zone protégée.
// - Bash / PowerShell : bloqué si la commande nomme une zone protégée avec une opération d'écriture.
// Bloqué = code 2 ; le message (stderr) est renvoyé au codeur.
// Marche aussi dans un worktree : la racine est le dossier git qui contient le fichier visé,
// pas CLAUDE_PROJECT_DIR (qui reste la copie principale).

import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const ZONES = ['specs', 'test/acceptance'];
const ZONE_IN_COMMAND = /(^|[\s"'=/.])(specs|test\/acceptance)(\/|\s|$|["'])/;
const WRITE_OPS = /(>|\btee\b|\bsed\s+-i|\brm\b|\bmv\b|\bcp\b|\btouch\b|\bmkdir\b|\bgit\s+(checkout|restore|rm|mv|apply)\b|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|New-Item|Rename-Item|\bdel\b|\bren\b)/i;

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;

let data;
try {
  data = JSON.parse(input);
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? '';
const toolInput = data.tool_input ?? {};
const cwd = data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Remonte jusqu'au dossier qui contient .git (un dossier pour la copie principale, un fichier pour un worktree).
function racineGit(depart) {
  let dossier = resolve(depart);
  for (;;) {
    if (existsSync(join(dossier, '.git'))) return dossier;
    const parent = dirname(dossier);
    if (parent === dossier) return process.env.CLAUDE_PROJECT_DIR || cwd;
    dossier = parent;
  }
}

function block(reason) {
  console.error(
    `Bloqué par .claude/hooks/guard-codeur.mjs : ${reason} ` +
      "specs/ et test/acceptance/ sont le juge : le codeur ne les modifie pas. " +
      'Si la spec ou un test d\'acceptation te semble faux, arrête-toi et explique pourquoi dans ton rapport.',
  );
  process.exit(2);
}

function inZone(path) {
  const absolute = isAbsolute(path) ? path : resolve(cwd, path);
  const rel = relative(racineGit(dirname(absolute)), absolute).replaceAll('\\', '/');
  return ZONES.some((zone) => rel === zone || rel.startsWith(`${zone}/`));
}

if (['Edit', 'MultiEdit', 'Write', 'NotebookEdit'].includes(tool)) {
  const path = toolInput.file_path ?? toolInput.notebook_path ?? '';
  if (path && inZone(path)) block(`${path} est dans une zone protégée.`);
}

if (tool === 'Bash' || tool === 'PowerShell') {
  const command = String(toolInput.command ?? '').replaceAll('\\', '/');
  if (ZONE_IN_COMMAND.test(command) && WRITE_OPS.test(command)) {
    block('cette commande écrit dans une zone protégée (pour lire une spec, utilise l\'outil Read).');
  }
}

process.exit(0);
