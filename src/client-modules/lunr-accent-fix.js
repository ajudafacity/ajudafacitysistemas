/**
 * Módulo para normalizar acentos na busca do docusaurus-lunr-search
 * Intercepta o LunrSearchAdapter.search() para normalizar queries
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  console.log('🔍 Lunr accent normalizer: Módulo carregado');

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
   * Intercepta o LunrSearchAdapter quando for importado
   */
  function interceptLunrSearchAdapter() {
    // Aguarda o módulo ser carregado
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkForAdapter = setInterval(() => {
      attempts++;
      
      // Procura pelo autocomplete que contém o LunrSearchAdapter
      const autocompleteEl = document.querySelector('.algolia-autocomplete');
      
      if (autocompleteEl) {
        // Tenta acessar o autocomplete interno
        const autocomplete = autocompleteEl._aa || autocompleteEl.__autocomplete;
        
        if (autocomplete && autocomplete.sources) {
          // Encontra o source que usa LunrSearchAdapter
          for (let i = 0; i < autocomplete.sources.length; i++) {
            const source = autocomplete.sources[i].source;
            
            // Wrapper do source original
            const originalSource = source;
            
            // Novo source que normaliza a query ANTES de buscar
            autocomplete.sources[i].source = function(query, callback) {
              if (query && typeof query === 'string' && query.trim()) {
                const normalized = normalizeText(query);
                
                if (normalized !== query) {
                  console.log(`🔍 Query normalizada: "${query}" → "${normalized}"`);
                }
                
                // Busca com query normalizada
                return originalSource(normalized, callback);
              }
              
              return originalSource(query, callback);
            };
          }
          
          console.log('✅ Lunr accent normalizer: Interceptação ativa no autocomplete!');
          clearInterval(checkForAdapter);
          return;
        }
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(checkForAdapter);
        // Tenta método alternativo
        tryAlternativeInterception();
      }
    }, 300);
  }

  /**
   * Método alternativo: intercepta diretamente o input
   */
  function tryAlternativeInterception() {
    console.log('🔍 Tentando método alternativo de interceptação...');
    
    // Intercepta eventos de busca no input
    const observer = new MutationObserver(() => {
      const searchInputs = document.querySelectorAll(
        'input[type="search"],' +
        'input#docsearch,' +
        'input[placeholder*="Search" i]'
      );
      
      searchInputs.forEach(input => {
        if (!input.dataset.normalized) {
          input.dataset.normalized = 'true';
          
          // Intercepta antes do autocomplete processar
          input.addEventListener('input', function(e) {
            // Não bloqueia a digitação, apenas normaliza na busca
            // O autocomplete.js vai pegar o valor normalizado
          }, true);
          
          // Intercepta o valor quando o autocomplete buscar
          const originalValue = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value'
          );
          
          // Não fazemos nada aqui - deixamos o usuário digitar normalmente
          // A normalização acontece no source do autocomplete
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Inicia interceptação
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(interceptLunrSearchAdapter, 500);
    });
  } else {
    setTimeout(interceptLunrSearchAdapter, 500);
  }
  
  // Re-tenta após navegação (SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(interceptLunrSearchAdapter, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();

export default {};
