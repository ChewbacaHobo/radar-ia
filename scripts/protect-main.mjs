#!/usr/bin/env node
// protect-main.mjs : applique la protection de la branche main sur le dépôt GitHub courant.
// Usage : node scripts/protect-main.mjs   (demande gh installé et connecté : gh auth login)
// - PR obligatoire pour toucher main (0 approbation requise : tu peux fusionner seul)
// - le job CI "test" doit être vert et la branche à jour
// - s'applique aussi aux admins, pas de push forcé, pas de suppression de main

import { execFileSync } from 'node:child_process';

const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', input, stdio: [input ? 'pipe' : 'ignore', 'pipe', 'inherit'] }).trim();

const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);

const protection = {
  required_status_checks: { strict: true, contexts: ['test'] },
  enforce_admins: true,
  required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  required_conversation_resolution: true,
};

gh(['api', '--method', 'PUT', `repos/${repo}/branches/main/protection`, '--input', '-'], JSON.stringify(protection));
gh(['repo', 'edit', repo, '--delete-branch-on-merge', '--enable-squash-merge', '--enable-merge-commit=false', '--enable-rebase-merge=false']);

console.log(`Protection appliquée sur ${repo} (branche main).`);
