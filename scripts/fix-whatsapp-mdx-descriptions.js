const fs = require('fs');
const path = require('path');
const { convert } = require('html-to-text');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DESCRIPTION_MAX = 160;

function escapeYamlDoubleQuotes(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function removeHtmlAndNormalize(html) {
  return convert(html || '', {
    wordwrap: false,
    selectors: [{ selector: 'img', format: 'skip' }],
  })
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDangerouslySetInnerHTML(htmlSource) {
  // Captura o conteúdo do template literal usado em `__html: \`...\``
  // Observação: assume que não há crases/backticks soltas dentro do HTML.
  const match = htmlSource.match(/__html:\s*`([\s\S]*?)`\s*}/);
  return match?.[1] || null;
}

function extractFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return {
    rawBlock: match[0],
    body: match[1],
  };
}

function hasDescription(frontmatterBody) {
  return /^\s*description\s*:/m.test(frontmatterBody);
}

function addDescriptionToFrontmatter(frontmatterBody, descriptionEscaped) {
  // Preferência: inserir logo após `title: ...`
  if (/^\s*title\s*:/m.test(frontmatterBody)) {
    return frontmatterBody.replace(
      /^(\s*title\s*:\s*.*)$/m,
      `$1\ndescription: "${descriptionEscaped}"`
    );
  }

  // Fallback: append no final do frontmatter
  const trimmed = frontmatterBody.replace(/\s+$/g, '');
  return `${trimmed}\ndescription: "${descriptionEscaped}"\n`;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.toLowerCase().endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixOneFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');

  const frontmatter = extractFrontmatter(source);
  if (!frontmatter) return { updated: false, reason: 'no_frontmatter' };
  if (hasDescription(frontmatter.body)) return { updated: false, reason: 'has_description' };

  const htmlInside = extractDangerouslySetInnerHTML(source);
  if (!htmlInside) return { updated: false, reason: 'no_dangerouslySetInnerHTML_html' };

  const text = removeHtmlAndNormalize(htmlInside);
  if (!text) return { updated: false, reason: 'empty_text' };

  const description = text.length > DESCRIPTION_MAX ? `${text.slice(0, DESCRIPTION_MAX - 3)}...` : text;
  const descriptionEscaped = escapeYamlDoubleQuotes(description);

  const nextFrontmatterBody = addDescriptionToFrontmatter(frontmatter.body, descriptionEscaped);
  const nextSource = source.replace(frontmatter.rawBlock, `---\n${nextFrontmatterBody}\n---\n`);

  fs.writeFileSync(filePath, nextSource, 'utf8');
  return { updated: true };
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Pasta de docs não encontrada: ${DOCS_DIR}`);
    process.exit(1);
  }

  const mdxFiles = walkDir(DOCS_DIR);

  let updated = 0;
  let skipped = 0;

  for (const filePath of mdxFiles) {
    try {
      const result = fixOneFile(filePath);
      if (result.updated) updated += 1;
      else skipped += 1;
    } catch (err) {
      console.warn(`Falha ao processar: ${filePath}`, err);
    }
  }

  console.log(`Finalizado. Atualizados: ${updated}. Ignorados: ${skipped}.`);
}

main();

