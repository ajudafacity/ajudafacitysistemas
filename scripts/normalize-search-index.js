/**
 * Script para normalizar índices de busca após o build
 * Executa via npm run build && node scripts/normalize-search-index.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Normalizando índices de busca...');

let processedCount = 0;

// Processa índice raiz (pt-BR)
const rootIndexPath = path.join(__dirname, '..', 'build', 'search-index.json');
if (fs.existsSync(rootIndexPath)) {
  try {
    const content = fs.readFileSync(rootIndexPath, 'utf8');
    const index = JSON.parse(content);
    const normalized = normalizeSearchIndex(index);
    fs.writeFileSync(rootIndexPath, JSON.stringify(normalized), 'utf8');
    processedCount++;
    console.log('✅ Índice normalizado: build/search-index.json');
  } catch (e) {
    console.error('❌ Erro ao processar índice raiz:', e.message);
  }
} else {
  console.warn('⚠️ Índice não encontrado: build/search-index.json');
}

// Processa índice EN
const enIndexPath = path.join(__dirname, '..', 'build', 'en', 'search-index.json');
if (fs.existsSync(enIndexPath)) {
  try {
    const content = fs.readFileSync(enIndexPath, 'utf8');
    const index = JSON.parse(content);
    const normalized = normalizeSearchIndex(index);
    fs.writeFileSync(enIndexPath, JSON.stringify(normalized), 'utf8');
    processedCount++;
    console.log('✅ Índice normalizado: build/en/search-index.json');
  } catch (e) {
    console.error('❌ Erro ao processar índice EN:', e.message);
  }
} else {
  console.warn('⚠️ Índice não encontrado: build/en/search-index.json');
}

console.log(`\n✅ Total: ${processedCount} índice(s) normalizado(s)`);

/**
 * Normaliza o índice recursivamente
 */
function normalizeSearchIndex(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => normalizeSearchIndex(item));
  }
  
  if (typeof data === 'object') {
    const normalized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Se é campo de texto, normaliza
      if (typeof value === 'string' && ['t', 'title', 'c', 'content', 'text', 'body', 'h'].includes(key)) {
        normalized[key] = normalizeText(value);
      }
      // Se é array ou objeto, processa recursivamente
      else if (typeof value === 'object') {
        normalized[key] = normalizeSearchIndex(value);
      }
      // Outros valores, mantém
      else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }
  
  return data;
}

/**
 * Normaliza texto removendo acentos
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

