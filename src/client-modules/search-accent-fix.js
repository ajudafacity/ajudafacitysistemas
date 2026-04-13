/**
 * Solução direta para busca sem acentos
 * Intercepta o input de busca e normaliza antes do FlexSearch processar
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  function normalizeText(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function initSearchFix() {
    // Aguarda o input de busca aparecer
    const findSearchInput = setInterval(() => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i], input[aria-label*="search" i]');
      
      if (searchInput) {
        clearInterval(findSearchInput);
        applySearchFix(searchInput);
      }
    }, 100);

    // Timeout após 10 segundos
    setTimeout(() => clearInterval(findSearchInput), 10000);
  }

  function applySearchFix(searchInput) {
    // Cria um Proxy para interceptar leituras do valor
    let actualValue = searchInput.value;
    let normalizedValue = '';
    
    // Intercepta eventos de input
    searchInput.addEventListener('input', function(e) {
      const value = e.target.value;
      actualValue = value;
      normalizedValue = normalizeText(value);
      
      // Se o valor tem acentos, também busca sem acentos
      if (value !== normalizedValue && normalizedValue.length > 0) {
        // Força uma busca adicional com valor normalizado
        // Modificando temporariamente o valor do input
        const originalValue = searchInput.value;
        
        // Define valor normalizado temporariamente
        Object.defineProperty(searchInput, 'value', {
          get: function() { return normalizedValue; },
          set: function(val) { actualValue = val; },
          configurable: true
        });
        
        // Dispara evento de input com valor normalizado
        const normalizedEvent = new Event('input', { bubbles: true, cancelable: true });
        searchInput.dispatchEvent(normalizedEvent);
        
        // Restaura valor original
        setTimeout(() => {
          Object.defineProperty(searchInput, 'value', {
            get: function() { return actualValue; },
            set: function(val) { actualValue = val; },
            configurable: true
          });
          searchInput.value = originalValue;
        }, 100);
      }
    }, true); // Usa capture phase para interceptar antes

    // Intercepta leitura do valor quando FlexSearch acessa
    const valueDescriptor = Object.getOwnPropertyDescriptor(searchInput, 'value') ||
                           Object.getOwnPropertyDescriptor(Object.getPrototypeOf(searchInput), 'value');
    
    let internalValue = searchInput.value;
    
    Object.defineProperty(searchInput, 'value', {
      get: function() {
        // Quando FlexSearch lê, retorna versão normalizada se houver acentos
        const current = internalValue || '';
        const normalized = normalizeText(current);
        
        // Se tem acentos e não está vazio, retorna normalizado
        // Isso faz o FlexSearch buscar sem acentos também
        if (current !== normalized && normalized.length > 0) {
          return normalized;
        }
        return current;
      },
      set: function(newValue) {
        internalValue = newValue;
        // Dispara evento para atualizar busca
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      },
      configurable: true,
      enumerable: true
    });
  }

  // Inicializa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchFix);
  } else {
    initSearchFix();
  }
})();

export default {};

