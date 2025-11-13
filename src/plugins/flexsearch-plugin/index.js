/**
 * Plugin de busca customizado usando FlexSearch
 * Suporta normalização de acentos e fuzzy search nativamente
 */

const fs = require('fs');
const path = require('path');
const FlexSearch = require('flexsearch');
const { loadHtml } = require('@docusaurus/utils');

function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

module.exports = function flexsearchPlugin(context, options) {
  return {
    name: 'flexsearch-plugin',
    
    async loadContent() {
      // Roda durante desenvolvimento também
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 FlexSearch: Modo desenvolvimento - índice será gerado no build');
      }
      return null;
    },
    
    async postBuild({ routesPaths = [], outDir, baseUrl, plugins }) {
      console.log('🔍 FlexSearch: Construindo índice de busca...');
      
      const searchDocs = [];
      
      // Obtém plugin de docs
      const docsPlugin = plugins.find(p => p.name === 'docusaurus-plugin-content-docs');
      
      if (docsPlugin && docsPlugin.content) {
        // Processa versões e documentos
        const versions = docsPlugin.content.loadedVersions || [];
        
        for (const version of versions) {
          for (const doc of version.docs || []) {
            try {
              // Lê conteúdo do arquivo HTML gerado
              const htmlPath = path.join(outDir, doc.permalink.replace(baseUrl, '').replace(/^\//, '') + '.html');
              
              if (fs.existsSync(htmlPath)) {
                const html = fs.readFileSync(htmlPath, 'utf8');
                
                // Extrai título
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                const title = titleMatch 
                  ? titleMatch[1].replace(/[|–-].*$/, '').trim() 
                  : doc.title || '';
                
                // Extrai conteúdo
                const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || 
                                 html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                                 html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                
                if (bodyMatch) {
                  let content = bodyMatch[1]
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  
                  if (content.length > 5000) {
                    content = content.substring(0, 5000) + '...';
                  }
                  
                  if (title && content) {
                    searchDocs.push({
                      id: searchDocs.length,
                      title: title,
                      content: content,
                      url: doc.permalink,
                    });
                  }
                }
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao processar ${doc.id}:`, e.message);
            }
          }
        }
      }
      
      // Se não encontrou via plugin, tenta via routesPaths
      if (searchDocs.length === 0) {
        const htmlFiles = routesPaths
          .filter(route => route.endsWith('.html') && route.includes('/docs/'))
          .map(route => path.join(outDir, route));
        
        for (const filePath of htmlFiles) {
          if (!fs.existsSync(filePath)) continue;
          
          try {
            const html = fs.readFileSync(filePath, 'utf8');
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].replace(/[|–-].*$/, '').trim() : '';
            
            const bodyMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
            if (!bodyMatch) continue;
            
            let content = bodyMatch[1]
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (content.length > 5000) {
              content = content.substring(0, 5000) + '...';
            }
            
            const url = filePath.replace(outDir, '').replace(/\\/g, '/');
            
            if (title && content) {
              searchDocs.push({
                id: searchDocs.length,
                title: title,
                content: content,
                url: url,
              });
            }
          } catch (e) {
            // Ignora erros
          }
        }
      }
      
      console.log(`✅ FlexSearch: ${searchDocs.length} documentos processados`);
      
      if (searchDocs.length === 0) {
        console.warn('⚠️ FlexSearch: Nenhum documento encontrado!');
        return;
      }
      
      // Cria índice FlexSearch com normalização e fuzzy search
      const index = new FlexSearch.Document({
        document: {
          id: 'id',
          index: [
            {
              field: 'title',
              tokenize: 'forward',
              optimize: true,
              resolution: 9,
            },
            {
              field: 'content',
              tokenize: 'forward',
              optimize: true,
              resolution: 5,
            },
          ],
        },
        // Normalização nativa do FlexSearch
        charset: 'latin:advanced', // Normaliza acentos automaticamente
        // Fuzzy search
        threshold: 0,
        depth: 2,
        // Case insensitive
        encode: (str) => {
          return normalizeText(str).split(/\s+/);
        },
      });
      
      // Adiciona documentos ao índice (normalizados)
      searchDocs.forEach(doc => {
        index.add({
          id: doc.id,
          title: normalizeText(doc.title),
          content: normalizeText(doc.content),
        });
      });
      
      // Salva índice e documentos
      // FlexSearch Document não suporta export direto, precisamos salvar os dados
      const searchData = {
        docs: searchDocs, // Mantém originais para exibição
        // Salva configuração do índice para recriar no client
        indexConfig: {
          document: {
            id: 'id',
            index: [
              { field: 'title', tokenize: 'forward', optimize: true, resolution: 9 },
              { field: 'content', tokenize: 'forward', optimize: true, resolution: 5 },
            ],
          },
          charset: 'latin:advanced',
          threshold: 0,
          depth: 2,
        },
      };
      
      const indexPath = path.join(outDir, 'flexsearch-index.json');
      fs.writeFileSync(indexPath, JSON.stringify(searchData), 'utf8');
      
      console.log(`✅ FlexSearch: Índice salvo em ${indexPath}`);
      console.log(`✅ FlexSearch: ${searchDocs.length} documentos indexados com normalização`);
    },
  };
};
