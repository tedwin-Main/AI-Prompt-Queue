// Zips built src/ (manifest at root, no .ts sources) into AI-Prompt-Queue-v<version>.zip for the Chrome Web Store.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(ROOT, 'src', 'manifest.json'), 'utf8'));
const zip = join(ROOT, `AI-Prompt-Queue-v${version}.zip`);

rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-X', zip, '.', '-x', '*.ts', '-x', '.DS_Store', '-x', '*/.DS_Store'], { cwd: join(ROOT, 'src'), stdio: 'inherit' });
console.log(`wrote ${zip}`);
