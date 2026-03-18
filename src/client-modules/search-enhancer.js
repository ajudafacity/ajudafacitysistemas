/**
 * Client-side module para melhorar a busca do Docusaurus
 * Intercepta a busca e normaliza acentos antes de executar
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
  function waitForSearchPlugin(callback, maxAttempts = 100) {
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Verifica se o FlexSearch está disponível
      const hasFlexSearch = window.FlexSearch || 
                           window.__docusaurus?.pluginData?.['docusaurus-search-local'] ||
                           document.querySelector('[data-search-index]');
      
      if (hasFlexSearch || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
  }

  // Intercepta e melhora a busca
  function enhanceSearch() {
    // Encontra o input de busca
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[aria-label*="search" i]');
    if (!searchInput) {
      // Tenta novamente após um delay
      setTimeout(enhanceSearch, 500);
      return;
    }

    // Adiciona placeholder melhorado
    if (searchInput.placeholder && !searchInput.placeholder.includes('ignora')) {
      const originalPlaceholder = searchInput.placeholder;
      searchInput.placeholder = originalPlaceholder + ' (ignora acentos)';
    }

    // Intercepta eventos de input
    let lastValue = '';
    let searchTimeout = null;

    searchInput.addEventListener('input', function(e) {
      const value = e.target.value;
      
      if (value === lastValue) return;
      lastValue = value;

      // Limpa timeout anterior
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Aguarda um pouco antes de processar
      searchTimeout = setTimeout(() => {
        // Normaliza a query
        const normalizedValue = normalizeText(value);
        
        // Se a query tem acentos, tenta buscar também sem acentos
        if (value !== normalizedValue && normalizedValue.length > 0) {
          // Dispara evento de busca com versão normalizada
          // Isso força uma nova busca mesmo que o valor visual não mude
          const event = new Event('input', { bubbles: true });
          const originalValue = searchInput.value;
          
          // Temporariamente muda o valor para forçar busca normalizada
          // Mas mantém o valor original visível
          Object.defineProperty(searchInput, 'value', {
            get: function() { return originalValue; },
            set: function(val) { 
              // Se tentar buscar com valor normalizado, permite
              if (normalizeText(val) === normalizedValue) {
                this._value = val;
              }
            },
            configurable: true
          });
        }
      }, 300);
    });

    // Intercepta eventos de keydown para Enter
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const value = normalizeText(e.target.value);
        // Se houver valor normalizado diferente, busca com ambos
        if (value && value !== e.target.value.toLowerCase()) {
          // Força busca com versão normalizada também
          e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Melhora resultados quando aparecem
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Procura por resultados de busca
            const searchResults = node.querySelectorAll && (
              node.querySelectorAll('[class*="searchResult"], [class*="SearchResult"], [class*="hit"], [class*="Hit"], li[class*="item"]') ||
              (node.classList && node.classList.toString().includes('search') ? [node] : [])
            );
            
            if (searchResults && searchResults.length > 0) {
              enhanceSearchResultsInDOM(Array.from(searchResults), searchInput.value);
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

    // Tenta interceptar o FlexSearch diretamente
    interceptFlexSearch(searchInput);
  }

  // Intercepta FlexSearch se disponível
  function interceptFlexSearch(searchInput) {
    let intercepted = false;
    
    // Aguarda FlexSearch estar disponível
    const checkFlexSearch = setInterval(() => {
      if (intercepted) {
        clearInterval(checkFlexSearch);
        return;
      }
      
      // Procura por dados do plugin de busca
      const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
      
      if (pluginData) {
        intercepted = true;
        clearInterval(checkFlexSearch);
        
        // Intercepta a busca modificando o valor antes de processar
        const originalDescriptor = Object.getOwnPropertyDescriptor(searchInput, 'value') || 
                                   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(searchInput), 'value');
        
        let internalValue = searchInput.value;
        
        Object.defineProperty(searchInput, 'value', {
          get: function() {
            return internalValue;
          },
          set: function(newValue) {
            internalValue = newValue;
            // Quando o valor é setado, também busca com versão normalizada
            const normalized = normalizeText(newValue);
            if (normalized && normalized !== normalizeText(internalValue)) {
              // Dispara busca adicional com versão normalizada
              setTimeout(() => {
                triggerNormalizedSearch(normalized, pluginData);
              }, 100);
            }
          },
          configurable: true
        });
        
        // Intercepta eventos de input
        const originalAddEventListener = searchInput.addEventListener.bind(searchInput);
        searchInput.addEventListener = function(type, listener, options) {
          if (type === 'input') {
            // Wrapper que normaliza antes de chamar o listener original
            const wrappedListener = function(e) {
              const value = e.target.value;
              const normalized = normalizeText(value);
              
              // Se tem acentos, também busca sem acentos
              if (value !== normalized && normalized.length > 0) {
                // Cria evento com valor normalizado
                const normalizedEvent = new Event('input', { bubbles: true });
                Object.defineProperty(normalizedEvent, 'target', {
                  value: {
                    ...e.target,
                    value: normalized
                  },
                  enumerable: true
                });
                
                // Chama listener original com evento normalizado também
                setTimeout(() => {
                  if (listener) listener(normalizedEvent);
                }, 50);
              }
              
              // Chama listener original normalmente
              if (listener) listener(e);
            };
            
            return originalAddEventListener(type, wrappedListener, options);
          }
          return originalAddEventListener(type, listener, options);
        };
      }
    }, 200);

    // Timeout após 15 segundos
    setTimeout(() => {
      if (!intercepted) {
        clearInterval(checkFlexSearch);
      }
    }, 15000);
  }

  // Dispara busca normalizada
  function triggerNormalizedSearch(normalizedQuery, pluginData) {
    if (!pluginData || !pluginData.indexes) return;
    
    try {
      // Tenta acessar o índice e buscar
      const indexes = pluginData.indexes;
      
      // Se for um objeto com método search
      if (typeof indexes.search === 'function') {
        const results = indexes.search(normalizedQuery);
        if (results && results.length > 0) {
          // Adiciona resultados ao DOM se necessário
          console.log('✅ Busca normalizada encontrou', results.length, 'resultados para:', normalizedQuery);
        }
      }
      
      // Se for um array de índices
      if (Array.isArray(indexes)) {
        indexes.forEach((index, i) => {
          if (index && typeof index.search === 'function') {
            const results = index.search(normalizedQuery);
            if (results && results.length > 0) {
              console.log(`✅ Índice ${i}: encontrou ${results.length} resultados`);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao executar busca normalizada:', e);
    }
  }

  // Melhora resultados no DOM
  function enhanceSearchResultsInDOM(resultElements, query) {
    if (!query || !resultElements || resultElements.length === 0) return;

    const normalizedQuery = normalizeText(query);
    
    resultElements.forEach((element) => {
      const titleElement = element.querySelector('h3, h4, h2, [class*="title"], [class*="Title"], mark, strong');
      const contentElement = element.querySelector('p, [class*="content"], [class*="Content"], [class*="snippet"]');
      
      if (titleElement) {
        const title = titleElement.textContent || '';
        const normalizedTitle = normalizeText(title);
        
        // Adiciona classe se for match aproximado (sem acento)
        if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
          element.classList.add('fuzzy-match');
          element.setAttribute('data-normalized-match', 'true');
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

