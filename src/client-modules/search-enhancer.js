/**
 * Client-side module para melhorar a busca do Docusaurus
 * Adiciona normalização de acentos e melhorias visuais
 */

(function() {
  'use strict';

  // Aguarda o DOM estar pronto
  if (typeof window === 'undefined') return;

  // Função para normalizar texto (remove acentos)
  function normalizeText(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Aguarda o plugin de busca estar carregado
  function waitForSearchPlugin(callback, maxAttempts = 50) {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Verifica se o plugin de busca está disponível
      const searchInput = document.querySelector('input[type="search"]');
      
      if (searchInput || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
  }

  // Intercepta a busca e melhora os resultados
  function enhanceSearch() {
    // Encontra o input de busca
    const searchInput = document.querySelector('input[type="search"]');
    if (!searchInput) return;

    // Adiciona placeholder melhorado
    if (searchInput.placeholder && !searchInput.placeholder.includes('ignora')) {
      searchInput.placeholder = searchInput.placeholder + ' (ignora acentos)';
    }

    // Melhora resultados quando aparecem
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const searchResults = node.querySelectorAll('[class*="searchResult"], [class*="SearchResult"], [class*="hit"]');
            if (searchResults.length > 0) {
              enhanceSearchResultsInDOM(searchResults, searchInput.value);
            }
          }
        });
      });
    });

    // Observa mudanças no DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Melhora resultados no DOM
  function enhanceSearchResultsInDOM(resultElements, query) {
    if (!query) return;

    const normalizedQuery = normalizeText(query);
    
    resultElements.forEach((element) => {
      const titleElement = element.querySelector('h3, h4, [class*="title"], [class*="Title"], mark');
      const contentElement = element.querySelector('p, [class*="content"], [class*="Content"]');
      
      if (titleElement) {
        const title = titleElement.textContent || '';
        const normalizedTitle = normalizeText(title);
        
        // Adiciona classe se for match aproximado (sem acento)
        if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
          element.classList.add('fuzzy-match');
        }
      }
    });
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

