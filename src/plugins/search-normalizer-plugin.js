/**
 * Plugin para normalizar índice de busca após o build
 * Hook postBuild do Docusaurus - executa APÓS todos os arquivos serem gerados
 */

const fs = require('fs');
const path = require('path');

function searchNormalizerPlugin(context, options) {
  return {
    name: 'search-normalizer-plugin',
    
    async postBuild({ outDir }) {
      console.log('🔍 Search normalizer: Processando índices após build...');
      
      let processedCount = 0;
      
      // Processa índice raiz (pt-BR)
      const rootSearchIndexPath = path.join(outDir, 'search-index.json');
      if (fs.existsSync(rootSearchIndexPath)) {
        try {
          const content = fs.readFileSync(rootSearchIndexPath, 'utf8');
          const indexData = JSON.parse(content);
          const normalized = normalizeSearchIndex(indexData);
          fs.writeFileSync(rootSearchIndexPath, JSON.stringify(normalized), 'utf8');
          processedCount++;
          console.log(`✅ Search normalizer: Índice normalizado (pt-BR)`);
        } catch (e) {
          console.warn(`⚠️ Search normalizer: Erro ao processar índice raiz:`, e.message);
        }
      }
      
      // Processa índice em (en)
      const enSearchIndexPath = path.join(outDir, 'en', 'search-index.json');
      if (fs.existsSync(enSearchIndexPath)) {
        try {
          const content = fs.readFileSync(enSearchIndexPath, 'utf8');
          const indexData = JSON.parse(content);
          const normalized = normalizeSearchIndex(indexData);
          fs.writeFileSync(enSearchIndexPath, JSON.stringify(normalized), 'utf8');
          processedCount++;
          console.log(`✅ Search normalizer: Índice normalizado (en)`);
        } catch (e) {
          console.warn(`⚠️ Search normalizer: Erro ao processar índice EN:`, e.message);
        }
      }
      
      if (processedCount > 0) {
        console.log(`✅ Search normalizer: ${processedCount} índice(s) normalizado(s) com sucesso`);
      } else {
        console.warn(`⚠️ Search normalizer: Nenhum índice foi encontrado ou normalizado`);
      }
    },
  };
}

/**
 * Normaliza índice de busca - SUBSTITUI textos principais por versões normalizadas
 */
function normalizeSearchIndex(index) {
  if (!index || typeof index !== 'object') return index;

  // Estrutura 1: Array de documentos
  if (Array.isArray(index)) {
    return index.map((doc) => normalizeDocument(doc));
  }

  // Estrutura 2: Objeto com propriedade 'docs' ou arrays aninhados
  if (index.docs && Array.isArray(index.docs)) {
    return {
      ...index,
      docs: index.docs.map((doc) => normalizeDocument(doc)),
    };
  }

  // Estrutura 3: Objeto com múltiplas propriedades - processa recursivamente
  const normalized = { ...index };
  
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    
    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => normalizeDocument(item));
    }
    else if (value && typeof value === 'object' && !(value instanceof Date)) {
      normalized[key] = normalizeSearchIndex(value);
    }
  });
  
  return normalized;
}

/**
 * Normaliza um documento individual
 */
function normalizeDocument(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  
  const normalized = { ...doc };
  
  // Normaliza todos os campos de texto conhecidos
  const textFields = ['t', 'title', 'c', 'content', 'text', 'body', 'h', 'heading'];
  
  textFields.forEach(field => {
    if (doc[field]) {
      if (typeof doc[field] === 'string') {
        normalized[field] = normalizeText(doc[field]);
      }
      else if (Array.isArray(doc[field])) {
        normalized[field] = doc[field].map(item => 
          typeof item === 'string' ? normalizeText(item) : item
        );
      }
    }
  });
  
  return normalized;
}

/**
 * Normaliza texto removendo acentos
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .normalize('NFD')                    // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacríticos (acentos)
    .toLowerCase()                        // Converte para minúsculas
    .trim();                              // Remove espaços extras
}

module.exports = searchNormalizerPlugin;
