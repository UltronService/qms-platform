import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const buildDir = join(root, 'build-tmp');

if (!existsSync(buildDir)) {
  console.error('build-tmp not found — run vite build first');
  process.exit(1);
}

rmSync(join(root, 'index.html'), { force: true });
rmSync(join(root, 'assets'), { recursive: true, force: true });

for (const name of readdirSync(buildDir)) {
  const src = join(buildDir, name);

  if (name === 'dev.html') {
    cpSync(src, join(root, 'index.html'));
    continue;
  }

  if (name === 'assets') {
    cpSync(src, join(root, 'assets'), { recursive: true });
  }
}

rmSync(buildDir, { recursive: true, force: true });
console.log('Deployed admin/index.html + admin/assets/ for GitHub Pages');
