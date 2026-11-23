import { execFileSync } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import browserSyncFactory from 'browser-sync';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const rootFiles = new Set([
  'index.html',
  'ultima_history.html',
  'home-base.css',
  'UltimaPortal_Main.css',
  'ultima_history.css',
  'era-selector.css',
]);

function build() {
  execFileSync(process.execPath, [join(root, 'scripts', 'build.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
}

build();

const server = browserSyncFactory.create();
server.init({
  server: output,
  host: '127.0.0.1',
  port: Number(process.env.PORT ?? 3001),
  open: false,
  notify: false,
});

let buildTimer;
function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    try {
      build();
      server.reload();
    } catch (error) {
      console.error('Development build failed:', error);
    }
  }, 120);
}

watch(root, (_event, filename) => {
  if (filename && rootFiles.has(filename.toString())) scheduleBuild();
});

for (const directory of ['images', 'middle', 'end', 'scripts']) {
  const watcher = watch(join(root, directory), { recursive: true }, scheduleBuild);
  watcher.on('error', (error) => console.error(`Unable to watch ${directory}:`, error));
}
