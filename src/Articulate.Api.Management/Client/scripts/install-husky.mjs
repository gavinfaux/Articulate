import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(thisDir, '../../../..');
const huskyDir = path.join(repoRoot, '.husky');
const gitDir = path.join(repoRoot, '.git');

if (!existsSync(gitDir)) {
    console.warn('Skipping Husky setup because .git directory was not found.');
    process.exit(0);
}

if (!existsSync(huskyDir)) {
    console.warn('Skipping Husky setup because .husky directory was not found.');
    process.exit(0);
}

try {
    execFileSync('git', ['config', '--local', 'core.hooksPath', '.husky'], {
        cwd: repoRoot,
        stdio: 'ignore'
    });
} catch (error) {
    console.warn('Unable to set git hooks path for Husky:', error.message);
}
