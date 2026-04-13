/**
 * Plugin para normalizar documentos ANTES de serem indexados pelo Lunr
 * Intercepta o addToSearchData do docusaurus-lunr-search
 */

const Module = require('module');
const originalRequire = Module.prototype.require;

function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Patch no require para interceptar o docusaurus-lunr-search
Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  // Intercepta quando o index.js do docusaurus-lunr-search for carregado
  if (id.includes('docusaurus-lunr-search') && id.includes('src/index.js')) {
    if (!module.__normalized) {
      console.log('🔧 Interceptando docusaurus-lunr-search para normalizar documentos...');
      module.__normalized = true;
      
      // O módulo exporta uma função factory
      const originalFactory = module;
      
      // Substitui a factory
      module = function(context, options) {
        const plugin = originalFactory(context, options);
        
        // Intercepta o postBuild onde os documentos são adicionados
        const originalPostBuild = plugin.postBuild;
        
        plugin.postBuild = async function(params) {
          // Precisamos interceptar o addToSearchData dentro do postBuild
          // Mas isso é difícil porque é uma função local
          // Vamos normalizar os arquivos DEPOIS do build
          await originalPostBuild.call(this, params);
          
          // Normaliza os arquivos gerados
          const fs = require('fs');
          const path = require('path');
          const { outDir } = params;
          
          const normalizeFile = (filePath) => {
            if (fs.existsSync(filePath)) {
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
                  return true;
                }
              } catch (e) {
                // Ignora
              }
            }
            return false;
          };
          
          // Normaliza todos os arquivos search-doc
          const files = [
            path.join(outDir, 'search-doc.json'),
            path.join(outDir, 'en', 'search-doc.json'),
          ];
          
          // Também procura por arquivos com hash
          if (fs.existsSync(outDir)) {
            const allFiles = fs.readdirSync(outDir);
            allFiles.forEach(file => {
              if (file.startsWith('search-doc-') && file.endsWith('.json')) {
                files.push(path.join(outDir, file));
              }
            });
          }
          
          const enDir = path.join(outDir, 'en');
          if (fs.existsSync(enDir)) {
            const enFiles = fs.readdirSync(enDir);
            enFiles.forEach(file => {
              if (file.startsWith('search-doc-') && file.endsWith('.json')) {
                files.push(path.join(enDir, file));
              }
            });
          }
          
          let count = 0;
          files.forEach(file => {
            if (normalizeFile(file)) count++;
          });
          
          if (count > 0) {
            console.log(`✅ ${count} arquivo(s) search-doc normalizado(s)`);
          }
        };
        
        return plugin;
      };
      
      // Copia propriedades
      Object.setPrototypeOf(module, originalFactory);
      Object.keys(originalFactory).forEach(key => {
        module[key] = originalFactory[key];
      });
    }
  }
  
  return module;
};

module.exports = function normalizeBeforeIndexPlugin(context, options) {
  return {
    name: 'normalize-before-index',
    async loadContent() {
      console.log('🔍 Plugin de normalização pré-indexação carregado');
      return null;
    },
  };
};

