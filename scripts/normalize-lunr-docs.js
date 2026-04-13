/**
 * Script para normalizar search-doc.json após build
 * Remove acentos dos títulos e conteúdos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Normalizando documentos de busca...');

function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

let processedCount = 0;

// Processa search-doc.json raiz
const rootDocPath = path.join(__dirname, '..', 'build', 'search-doc.json');
if (fs.existsSync(rootDocPath)) {
  try {
    const content = fs.readFileSync(rootDocPath, 'utf8');
    const data = JSON.parse(content);
    
    if (data.searchDocs && Array.isArray(data.searchDocs)) {
      data.searchDocs = data.searchDocs.map(doc => ({
        ...doc,
        title: normalizeText(doc.title),
        content: normalizeText(doc.content),
        keywords: doc.keywords ? normalizeText(doc.keywords) : doc.keywords,
      }));
      
      fs.writeFileSync(rootDocPath, JSON.stringify(data), 'utf8');
      processedCount++;
      console.log('✅ Normalizado: build/search-doc.json');
    }
  } catch (e) {
    console.error('❌ Erro ao processar índice raiz:', e.message);
  }
}

// Processa search-doc.json em /en
const enDocPath = path.join(__dirname, '..', 'build', 'en', 'search-doc.json');
if (fs.existsSync(enDocPath)) {
  try {
    const content = fs.readFileSync(enDocPath, 'utf8');
    const data = JSON.parse(content);
    
    if (data.searchDocs && Array.isArray(data.searchDocs)) {
      data.searchDocs = data.searchDocs.map(doc => ({
        ...doc,
        title: normalizeText(doc.title),
        content: normalizeText(doc.content),
        keywords: doc.keywords ? normalizeText(doc.keywords) : doc.keywords,
      }));
      
      fs.writeFileSync(enDocPath, JSON.stringify(data), 'utf8');
      processedCount++;
      console.log('✅ Normalizado: build/en/search-doc.json');
    }
  } catch (e) {
    console.error('❌ Erro ao processar índice EN:', e.message);
  }
}

// Processa também os arquivos com hash
const buildDir = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildDir)) {
  const files = fs.readdirSync(buildDir);
  files.forEach(file => {
    if (file.startsWith('search-doc-') && file.endsWith('.json')) {
      const filePath = path.join(buildDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.searchDocs && Array.isArray(data.searchDocs)) {
          data.searchDocs = data.searchDocs.map(doc => ({
            ...doc,
            title: normalizeText(doc.title),
            content: normalizeText(doc.content),
            keywords: doc.keywords ? normalizeText(doc.keywords) : doc.keywords,
          }));
          
          fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
          processedCount++;
          console.log(`✅ Normalizado: build/${file}`);
        }
      } catch (e) {
        // Ignora erros
      }
    }
  });
  
  // Processa também em /en
  const enDir = path.join(buildDir, 'en');
  if (fs.existsSync(enDir)) {
    const enFiles = fs.readdirSync(enDir);
    enFiles.forEach(file => {
      if (file.startsWith('search-doc-') && file.endsWith('.json')) {
        const filePath = path.join(enDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          
          if (data.searchDocs && Array.isArray(data.searchDocs)) {
            data.searchDocs = data.searchDocs.map(doc => ({
              ...doc,
              title: normalizeText(doc.title),
              content: normalizeText(doc.content),
              keywords: doc.keywords ? normalizeText(doc.keywords) : doc.keywords,
            }));
            
            fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
            processedCount++;
            console.log(`✅ Normalizado: build/en/${file}`);
          }
        } catch (e) {
          // Ignora erros
        }
      }
    });
  }
}

console.log(`\n✅ Total: ${processedCount} arquivo(s) normalizado(s)`);

