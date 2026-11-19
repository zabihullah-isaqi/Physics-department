import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'vite';
import react from '@vitejs/plugin-react';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = join(project, 'pages-content');
const outDir = join(project, 'dist', 'github-pages');
const renderDir = join(project, 'dist', 'github-pages-render');
const base = '/Physics-department/';
const settings = {root, base, configFile: false, plugins: [react()]};

await build({...settings, publicDir: join(project, 'public'), build: {outDir, emptyOutDir: true}});
await build({
  ...settings,
  publicDir: false,
  build: {ssr: join(root, 'render.tsx'), target: 'node22', outDir: renderDir, emptyOutDir: true},
});

const {render} = await import(pathToFileURL(join(renderDir, 'render.js')).href);
const template = await readFile(join(outDir, 'index.html'), 'utf8');
const data = JSON.parse(await readFile(join(root, 'content.json'), 'utf8'));
const routes = new Set(['/', '/about', '/courses', '/labs', '/articles', '/research', '/resources', '/support', '/contact', '/privacy']);
const sections = {course: 'courses', chapter: 'courses', lesson: 'courses', lab: 'labs', article: 'articles', research: 'research', resource: 'resources'};
for (const item of data.content) {
  if (!sections[item.type] || !/^[\w-]+$/.test(item.id) || item.status !== 'published') {
    throw new Error('The public catalogue only accepts published items with valid IDs and types.');
  }
  if (JSON.parse(item.meta || '{}').locked) throw new Error('Protected content cannot be published on GitHub Pages.');
  routes.add('/' + sections[item.type] + '/' + item.id);
}
const siteConfig = JSON.parse(data.settings?.site_config || '{}');
for (const page of siteConfig.pages || []) {
  if (!page.published || !/^[a-z0-9-]+$/.test(page.id)) throw new Error('Only public custom pages may be included.');
  routes.add('/pages/' + page.id);
}

function documentFor(route, lang, dir) {
  return template
    .replace('<html lang="fa" dir="rtl">', `<html lang="${lang}" dir="${dir}">`)
    .replace('<div id="root" data-route="/"></div>', () =>
      `<div id="root" data-route="${route}">${render(route)}</div>`);
}

for (const [lang, dir] of [['fa', 'rtl'], ['ps', 'rtl'], ['en', 'ltr']]) {
  for (const route of routes) {
    const prefix = lang === 'fa' ? '' : '/' + lang;
    const location = prefix + (route === '/' ? '' : route);
    const folder = join(outDir, location.slice(1));
    await mkdir(folder, {recursive: true});
    await writeFile(join(folder, 'index.html'), documentFor(location || '/', lang, dir));
  }
}
await writeFile(join(outDir, '404.html'), documentFor('/not-found', 'fa', 'rtl'));
await mkdir(join(outDir, 'admin'), {recursive: true});
await writeFile(join(outDir, 'admin', 'index.html'), documentFor('/admin', 'fa', 'rtl'));
await writeFile(join(outDir, '.nojekyll'), '');
