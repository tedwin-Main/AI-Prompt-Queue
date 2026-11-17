// Strips types from src/**/*.ts into sibling .js files so Chrome loads src/ unpacked as-is.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');

const sources = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'));

for (const file of sources) {
  const js = stripTypeScriptTypes(readFileSync(join(SRC, file), 'utf8'));
  writeFileSync(join(SRC, file.replace(/\.ts$/, '.js')), js);
}
console.log(`built ${sources.length} scripts in src/`);
