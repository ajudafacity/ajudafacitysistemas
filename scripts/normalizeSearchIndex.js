/**
 * Script para normalizar o índice de busca
 * Remove acentos e prepara textos para busca tolerante a erros
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Remove acentos de uma string
 */
function removeAccents(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Processa arquivos MDX para adicionar versões normalizadas no frontmatter
 */
async function processMdxFiles() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const files = await getAllMdxFiles(docsDir);
  
  console.log(`Processando ${files.length} arquivos MDX...`);
  
  let processed = 0;
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Verifica se já tem frontmatter
      if (!content.startsWith('---')) {
        continue;
      }
      
      // Extrai frontmatter
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd === -1) continue;
      
      const frontmatter = content.substring(3, frontmatterEnd);
      const body = content.substring(frontmatterEnd + 3);
      
      // Extrai título
      const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
      if (!titleMatch) continue;
      
      const title = titleMatch[1];
      const normalizedTitle = removeAccents(title);
      
      // Adiciona campo de busca normalizado se não existir
      if (!frontmatter.includes('searchKeywords')) {
        const newFrontmatter = frontmatter.trim() + `\nsearchKeywords: "${normalizedTitle}"`;
        const newContent = `---\n${newFrontmatter}\n---${body}`;
        await fs.writeFile(file, newContent, 'utf8');
        processed++;
      }
    } catch (error) {
      console.error(`Erro ao processar ${file}:`, error.message);
    }
  }
  
  console.log(`✅ ${processed} arquivos processados com sucesso!`);
}

/**
 * Busca recursiva por arquivos MDX
 */
async function getAllMdxFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      const subFiles = await getAllMdxFiles(fullPath);
      files.push(...subFiles);
    } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Executa se chamado diretamente
if (require.main === module) {
  processMdxFiles().catch(console.error);
}

module.exports = { processMdxFiles, removeAccents };

