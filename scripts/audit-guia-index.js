const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'output', 'knowledge-base.md');
const md = fs.readFileSync(mdPath, 'utf8');

const linkRe = /^- \*\*Link:\*\* (https:\/\/manual\.facity\.com\.br\/\S+)/gm;
const urls = [];
let m;
while ((m = linkRe.exec(md))) {
  urls.push(m[1].replace(/\/$/, ''));
}
const all = [...new Set(urls.map((u) => u.replace(/\/$/, '')))].sort();
const others = all.filter((u) => !u.includes('guia-passo-a-passo-como-aproveitar'));

// Não usar split('---'): o guia contém "----------------------------------------".
const afterGuia = md.split('## Guia Passo a Passo:')[1] || '';
const endM = afterGuia.search(/\n---\n\n## /);
const guiaBlock = endM === -1 ? afterGuia : afterGuia.slice(0, endM);
const cited = new Set();
const citeRe = /https:\/\/manual\.facity\.com\.br\/[a-z0-9\-/]+/gi;
while ((m = citeRe.exec(guiaBlock))) {
  const u = m[0].replace(/\/$/, '');
  if (!u.includes('guia-passo-a-passo')) cited.add(u);
}

const missing = others.filter((u) => !cited.has(u));

console.log(JSON.stringify({ totalPosts: all.length, semGuia: others.length, citadosNoGuia: cited.size, faltando: missing.length, faltandoUrls: missing }, null, 2));
