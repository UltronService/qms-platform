import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(new URL('..', import.meta.url).pathname, 'index.html');
const html = readFileSync(indexPath, 'utf8');

if (html.includes('/src/main.tsx')) {
  console.error(
    'admin/index.html still references /src/main.tsx — run npm run build before committing.',
  );
  process.exit(1);
}

if (!html.includes('/qms-platform/admin/assets/')) {
  console.error(
    'admin/index.html must reference /qms-platform/admin/assets/ bundles for GitHub Pages.',
  );
  process.exit(1);
}

console.log('admin/index.html is valid for GitHub Pages');
