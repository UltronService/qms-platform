import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
    const dest = join(root, 'index.html');
    cpSync(src, dest);
    const builtAt = new Date().toISOString();
    const html = readFileSync(dest, 'utf8');
    writeFileSync(
      dest,
      html.replace(
        '<title>QMS Admin Preview</title>',
        `<title>QMS Admin Preview</title>\n    <!-- admin build: ${builtAt} -->`,
      ),
    );
    continue;
  }

  if (name === 'assets') {
    cpSync(src, join(root, 'assets'), { recursive: true });
  }
}

rmSync(buildDir, { recursive: true, force: true });
console.log('Deployed admin/index.html + admin/assets/ for GitHub Pages');
