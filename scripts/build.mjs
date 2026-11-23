import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const files = [
  'index.html',
  'ultima_history.html',
  'home-base.css',
  'UltimaPortal_Main.css',
  'ultima_history.css',
  'images',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  await cp(join(root, file), join(output, file), { recursive: true });
}
console.log('Static site built in dist/');