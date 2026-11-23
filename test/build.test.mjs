import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');

async function assertShippedImage(reference) {
  assert.match(reference, /^images\/[^?#]+$/, `Expected a local image path, got ${reference}`);
  let current = output;
  for (const segment of reference.split('/')) {
    const entries = await readdir(current);
    assert.ok(entries.includes(segment), `Image asset path has missing or incorrect-case segment: ${reference}`);
    current = join(current, segment);
  }
  assert.ok((await stat(current)).isFile(), `Image asset is not a file: ${reference}`);
}

function imageReferences(content) {
  const activeContent = content.replace(/<!--[\s\S]*?-->/g, '');
  const references = [...activeContent.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1]);
  for (const match of activeContent.matchAll(/url\(\s*(?:'([^']+)'|"([^"]+)"|([^)\s]+))\s*\)/gi)) {
    references.push(match[1] ?? match[2] ?? match[3]);
  }
  return { activeContent, references };
}

test('build creates a deployable static site with local image assets', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
  const entries = await readdir(output);
  assert.deepEqual(entries.sort(), [
    'UltimaPortal_Main.css', 'home-base.css', 'images', 'index.html',
    'ultima_history.css', 'ultima_history.html',
  ].sort());
  for (const page of ['index.html', 'ultima_history.html']) {
    const html = await readFile(join(output, page), 'utf8');
    assert.match(html, /<!DOCTYPE html>/i);
    assert.doesNotMatch(html, /browser-sync-client/i);
  }
  assert.ok((await readdir(join(output, 'images'))).length > 0);

  const files = ['index.html', 'ultima_history.html', 'home-base.css', 'UltimaPortal_Main.css', 'ultima_history.css'];
  for (const file of files) {
    const { activeContent, references } = imageReferences(await readFile(join(output, file), 'utf8'));
    assert.doesNotMatch(activeContent, /https?:\/\/web\.archive\.org/i, `Found a Wayback URL in ${file}`);
    for (const reference of references) await assertShippedImage(reference);
  }
});