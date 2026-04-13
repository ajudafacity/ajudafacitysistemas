/**
 * Gera Markdown do índice agregador (todos os posts exceto o guia hub).
 * Uso: node scripts/generate-indice-guia-md.js
 */
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'output', 'knowledge-base.md');
const outPath = path.join(__dirname, '..', 'output', 'indice-guia-aggregador.md');

const md = fs.readFileSync(mdPath, 'utf8');

const hubSlug = 'guia-passo-a-passo-como-aproveitar-ao-maximo-os-sistemas-facity-controle';

const blocks = md.split(/\n---\n\n## /).slice(1);
const posts = [];

for (const chunk of blocks) {
  const titleLine = chunk.split('\n')[0].trim();
  const title = titleLine.replace(/^## /, '').trim();
  const linkMatch = chunk.match(/^- \*\*Link:\*\* (https:\/\/blog\.facity\.com\.br\/\S+)/m);
  const catMatch = chunk.match(/^- \*\*Categorias:\*\* (.+)$/m);
  if (!linkMatch) continue;
  let url = linkMatch[1].trim().replace(/[)\]]+$/, '');
  if (url.includes(hubSlug)) continue;
  const catsRaw = catMatch ? catMatch[1].trim() : 'Sem categoria';
  const categories = catsRaw.split(',').map((c) => c.trim()).filter(Boolean);
  posts.push({ title, url, categories });
}

posts.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

const byCat = new Map();
for (const p of posts) {
  const keys = p.categories.length ? p.categories : ['Sem categoria'];
  for (const c of keys) {
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(p);
  }
}

// Ordem sugerida das categorias do blog
const catOrder = [
  'Instalação',
  'Cadastros',
  'Configurações',
  'Impressoras',
  'Integrações',
  'Relatórios',
  'Sem categoria',
];

const sortedCats = [
  ...catOrder.filter((c) => byCat.has(c)),
  ...[...byCat.keys()].filter((c) => !catOrder.includes(c)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
];

const hubUrl = `https://manual.facity.com.br/${hubSlug}/`;

let out = `# Índice geral — Blog Ajuda Facity Sistemas

Use este bloco como **agregador** no WordPress: cole abaixo do texto introdutório do guia ou como página anexa. Cada linha aponta para o artigo completo.

## Guia principal (roteiro passo a passo)

- [Guia Passo a Passo: Como aproveitar ao máximo os Sistemas Facity Controle](${hubUrl})

---

_Posts no índice abaixo: **${posts.length}** tutoriais (todos os publicados no snapshot, exceto o guia acima). Fonte: \`output/knowledge-base.md\`._

---

`;

for (const cat of sortedCats) {
  const list = byCat.get(cat);
  if (!list?.length) continue;
  // Dedup por URL dentro da categoria
  const seen = new Set();
  const unique = [];
  for (const p of list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))) {
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    unique.push(p);
  }

  out += `## ${cat}\n\n`;
  for (const p of unique) {
    out += `- [${p.title}](${p.url})\n`;
  }
  out += '\n';
}

out += `---

## Como manter atualizado

1. Regenerar a base: \`node scripts/fetchPostUnifiedMD.js\`
2. Regenerar este índice: \`node scripts/generate-indice-guia-md.js\`
`;

fs.writeFileSync(outPath, out, 'utf-8');
console.log('Escrito:', outPath);
