/**
 * Client-side para busca FlexSearch
 * Carrega índice e implementa busca com normalização e fuzzy search
 */

import FlexSearch from 'flexsearch';

let searchIndex = null;
let searchDocs = null;

/**
 * Normaliza texto removendo acentos
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Carrega índice de busca
 */
async function loadSearchIndex() {
  if (searchIndex) return;
  
  try {
    // Tenta múltiplos caminhos (desenvolvimento e produção)
    const paths = [
      '/flexsearch-index.json',
      '../flexsearch-index.json',
    ];
    
    let response = null;
    let lastError = null;
    
    for (const indexPath of paths) {
      try {
        response = await fetch(indexPath);
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          break;
        }
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(lastError || `HTTP ${response?.status}: ${response?.statusText || 'Arquivo não encontrado'}`);
    }
    
    const data = await response.json();
    
    searchDocs = data.docs;
    
    // Recria índice do FlexSearch com mesma configuração
    searchIndex = FlexSearch.Document({
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
      charset: 'latin:advanced', // Normalização nativa
      threshold: 0,
      depth: 2,
      encode: (str) => {
        return normalizeText(str).split(/\s+/);
      },
    });
    
    // Adiciona documentos normalizados ao índice
    data.docs.forEach(doc => {
      searchIndex.add({
        id: doc.id,
        title: normalizeText(doc.title),
        content: normalizeText(doc.content),
      });
    });
    
    console.log('✅ FlexSearch: Índice carregado com sucesso');
  } catch (e) {
    console.error('❌ Erro ao carregar índice FlexSearch:', e);
  }
}

/**
 * Busca documentos
 */
function search(query) {
  if (!searchIndex || !query || !query.trim()) {
    return [];
  }
  
  const normalizedQuery = normalizeText(query);
  const results = searchIndex.search(normalizedQuery, {
    limit: 10,
    enrich: true,
  });
  
  // Formata resultados
  const hits = [];
  results.forEach(result => {
    if (result.field === 'title' || result.field === 'content') {
      const doc = searchDocs[result.id];
      if (doc && !hits.find(h => h.url === doc.url)) {
        hits.push({
          title: doc.title,
          url: doc.url,
          content: doc.content.substring(0, 150) + '...',
        });
      }
    }
  });
  
  return hits;
}

/**
 * Inicializa busca quando o DOM estiver pronto
 */
function initSearch() {
  loadSearchIndex();
  
  // Aguarda input de busca
  let attempts = 0;
  const findInput = setInterval(() => {
    attempts++;
    
    const searchInput = document.querySelector(
      'input[type="search"],' +
      'input[placeholder*="Search" i],' +
      'input[placeholder*="Pesquis" i],' +
      '#docsearch'
    );
    
    if (searchInput) {
      clearInterval(findInput);
      
      // Intercepta busca
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query && query.length >= 2) {
          await loadSearchIndex();
          const results = search(query);
          console.log(`🔍 Busca: "${query}" → ${results.length} resultados`);
          // Aqui você pode exibir os resultados
        }
      });
      
      console.log('✅ FlexSearch: Busca inicializada');
    } else if (attempts >= 50) {
      clearInterval(findInput);
    }
  }, 200);
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
}

export default {};

