/**
 * Módulo unificado para normalização de acentos na busca
 * Intercepta o FlexSearch do plugin docusaurus-search-local e normaliza queries
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

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
   * Aguarda o plugin de busca estar disponível
   */
  function waitForSearchPlugin(callback, maxAttempts = 50) {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Verifica se o plugin está disponível
      const hasPlugin = window.__docusaurus?.pluginData?.['docusaurus-search-local'] ||
                       document.querySelector('input[type="search"]') ||
                       document.querySelector('[class*="SearchBar"]');
      
      if (hasPlugin || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        if (hasPlugin) {
          callback();
        }
      }
    }, 200);
  }

  /**
   * Intercepta e melhora a busca
   */
  function enhanceSearch() {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i], input[aria-label*="search" i]');
    
    if (!searchInput) {
      // Tenta novamente após um delay
      setTimeout(enhanceSearch, 500);
      return;
    }

    console.log('🔍 Search normalizer: Input encontrado, inicializando...');

    // Armazena o valor original
    let originalValue = searchInput.value;
    
    // Intercepta eventos de input
    const originalInputHandler = searchInput.oninput;
    
    searchInput.addEventListener('input', function(e) {
      const value = e.target.value;
      originalValue = value;
      
      // Normaliza o valor
      const normalized = normalizeText(value);
      
      // Se o valor tem acentos e é diferente do normalizado
      if (value !== normalized && normalized.length > 0) {
        // Tenta interceptar o FlexSearch diretamente
        interceptFlexSearchQuery(normalized);
      }
    }, true); // Usa capture phase para interceptar antes

    // Tenta interceptar o FlexSearch quando disponível
    interceptFlexSearchDirectly(searchInput);
  }

  /**
   * Intercepta o FlexSearch diretamente através do plugin data
   */
  function interceptFlexSearchDirectly(searchInput) {
    let intercepted = false;
    
    const checkInterval = setInterval(() => {
      if (intercepted) {
        clearInterval(checkInterval);
        return;
      }
      
      const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
      
      if (pluginData && pluginData.indexes) {
        intercepted = true;
        clearInterval(checkInterval);
        
        console.log('✅ Search normalizer: FlexSearch interceptado');
        
        // Cria um wrapper para os índices
        wrapSearchIndexes(pluginData.indexes, searchInput);
      }
    }, 300);

    // Timeout após 10 segundos
    setTimeout(() => {
      if (!intercepted) {
        clearInterval(checkInterval);
        console.warn('⚠️ Search normalizer: FlexSearch não encontrado após 10s');
      }
    }, 10000);
  }

  /**
   * Envolve os índices de busca para normalizar queries
   */
  function wrapSearchIndexes(indexes, searchInput) {
    if (!indexes) return;
    
    // Se for um array de índices
    if (Array.isArray(indexes)) {
      indexes.forEach((index, i) => {
        if (index && typeof index.search === 'function') {
          wrapIndexSearch(index, searchInput, `index[${i}]`);
        }
      });
    }
    // Se for um objeto com método search
    else if (typeof indexes.search === 'function') {
      wrapIndexSearch(indexes, searchInput, 'indexes');
    }
    // Se for um objeto com múltiplos índices
    else if (typeof indexes === 'object') {
      Object.keys(indexes).forEach(key => {
        const index = indexes[key];
        if (index && typeof index.search === 'function') {
          wrapIndexSearch(index, searchInput, `indexes.${key}`);
        }
      });
    }
  }

  /**
   * Envolve um índice individual para normalizar queries
   */
  function wrapIndexSearch(index, searchInput, label) {
    const originalSearch = index.search.bind(index);
    
    // Substitui o método search
    index.search = function(query, options) {
      if (!query || typeof query !== 'string') {
        return originalSearch(query, options);
      }
      
      const normalizedQuery = normalizeText(query);
      
      // Se a query tem acentos, busca com versão normalizada também
      if (query !== normalizedQuery && normalizedQuery.length > 0) {
        // Busca com query normalizada
        const normalizedResults = originalSearch(normalizedQuery, options);
        
        // Busca com query original também
        const originalResults = originalSearch(query, options);
        
        // Combina e remove duplicatas
        const combinedResults = combineResults(originalResults, normalizedResults);
        
        console.log(`🔍 Search normalizer [${label}]: Query "${query}" -> "${normalizedQuery}", encontrou ${combinedResults.length} resultados`);
        
        return combinedResults;
      }
      
      // Se não tem acentos, busca normalmente
      return originalSearch(query, options);
    };
    
    console.log(`✅ Search normalizer: Índice "${label}" envolvido`);
  }

  /**
   * Combina resultados removendo duplicatas
   */
  function combineResults(results1, results2) {
    if (!results1) return results2 || [];
    if (!results2) return results1 || [];
    
    const seen = new Set();
    const combined = [];
    
    // Adiciona resultados do primeiro array
    results1.forEach(result => {
      const key = getResultKey(result);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(result);
      }
    });
    
    // Adiciona resultados do segundo array que não estão no primeiro
    results2.forEach(result => {
      const key = getResultKey(result);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(result);
      }
    });
    
    return combined;
  }

  /**
   * Gera uma chave única para um resultado
   */
  function getResultKey(result) {
    if (typeof result === 'string') return result;
    if (result.url) return result.url;
    if (result.href) return result.href;
    if (result.id) return String(result.id);
    if (result.title) return String(result.title);
    return JSON.stringify(result);
  }

  /**
   * Tenta interceptar query diretamente (fallback)
   */
  function interceptFlexSearchQuery(normalizedQuery) {
    // Tenta encontrar e modificar o valor do input temporariamente
    const searchInput = document.querySelector('input[type="search"]');
    if (!searchInput) return;
    
    // Dispara evento com valor normalizado
    const event = new Event('input', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', {
      value: {
        ...searchInput,
        value: normalizedQuery
      },
      enumerable: true
    });
    
    // Dispara evento adicional
    searchInput.dispatchEvent(event);
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      waitForSearchPlugin(enhanceSearch);
    });
  } else {
    waitForSearchPlugin(enhanceSearch);
  }
})();

export default {};

