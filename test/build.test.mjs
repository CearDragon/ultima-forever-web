import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');

test('build creates a deployable static site', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
  const entries = await readdir(output);
  assert.deepEqual(entries.sort(), [
    'UltimaPortal_Main.css', 'home-base.css', 'images', 'index.html',
    'ultima_history.css', 'ultima_history.html',
  ].sort());
  for (const page of ['index.html', 'ultima_history.html']) {
    assert.match(await readFile(join(output, page), 'utf8'), /<!DOCTYPE html>/i);
  }
  assert.ok((await readdir(join(output, 'images'))).length > 0);
});