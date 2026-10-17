#!/usr/bin/env node
// guard-codeur.mjs : hook PreToolUse de l'agent codeur.
// Le codeur ne touche jamais au juge : specs/ et test/acceptance/ sont en lecture seule pour lui.
// - Edit / Write / NotebookEdit : bloqué si le fichier visé est dans une zone protégée.
// - Bash / PowerShell : bloqué si la commande nomme une zone protégée avec une opération d'écriture.
// Bloqué = code 2 ; le message (stderr) est renvoyé au codeur.

import { isAbsolute, relative, resolve } from 'node:path';

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
const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();

function block(reason) {
  console.error(
    `Bloqué par .claude/hooks/guard-codeur.mjs : ${reason} ` +
      "specs/ et test/acceptance/ sont le juge : le codeur ne les modifie pas. " +
      'Si la spec ou un test d\'acceptation te semble faux, arrête-toi et explique pourquoi dans ton rapport.',
  );
  process.exit(2);
}

function inZone(path) {
  const absolute = isAbsolute(path) ? path : resolve(data.cwd || root, path);
  const rel = relative(root, absolute).replaceAll('\\', '/');
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
