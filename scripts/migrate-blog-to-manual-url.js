/**
 * Substitui blog.facity.com.br por manual.facity.com.br em arquivos de texto do projeto.
 * Uso: node scripts/migrate-blog-to-manual-url.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'build',
  '.docusaurus',
  'dist',
]);

const EXT = new Set([
  '.md',
  '.mdx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.htm',
  '.txt',
  '.yaml',
  '.yml',
]);

function walk(dir, out) {
  let names;
  try {
    names = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of names) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, out);
    } else {
      const ext = path.extname(ent.name).toLowerCase();
      if (!EXT.has(ext)) continue;
      out.push(full);
    }
  }
}

const files = [];
walk(ROOT, files);

const RE_HTTP = /http:\/\/blog\.facity\.com\.br/g;
const RE_HTTPS = /https:\/\/blog\.facity\.com\.br/g;
const TO = 'https://manual.facity.com.br';

let changedFiles = 0;
let totalRepl = 0;

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  s = s.replace(RE_HTTP, TO);
  s = s.replace(RE_HTTPS, TO);
  if (s !== before) {
    const n = (before.match(/blog\.facity\.com\.br/g) || []).length;
    fs.writeFileSync(file, s, 'utf8');
    changedFiles += 1;
    totalRepl += n;
    console.log(path.relative(ROOT, file));
  }
}

console.log(`\nArquivos alterados: ${changedFiles}, ocorrências de blog.facity.com.br substituídas: ${totalRepl}`);
