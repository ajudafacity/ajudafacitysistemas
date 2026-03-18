/**
 * Módulo para normalização de acentos na busca
 * SOLUÇÃO: Intercepta o input ANTES da query chegar no Lunr
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  console.log('🔍 Search normalizer: Módulo carregado');

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
   * Intercepta o input de busca
   */
  function interceptSearchInput() {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', interceptSearchInput);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50;
    
    const findAndWrapInput = setInterval(() => {
      attempts++;
      
      // Procura pelo input de busca (múltiplos seletores possíveis)
      const searchInput = document.querySelector(
        'input[type="search"],' +
        'input[placeholder*="Search" i],' +
        'input[placeholder*="Pesquis" i],' +
        'input[aria-label*="search" i],' +
        '.navbar__search-input,' +
        '#search_input_react'
      );
      
      if (searchInput) {
        clearInterval(findAndWrapInput);
        console.log('✅ Search normalizer: Input de busca encontrado');
        
        // Intercepta eventos de input
        searchInput.addEventListener('input', function(e) {
          const original = e.target.value;
          const normalized = normalizeText(original);
          
          // Se são diferentes, atualiza o valor
          if (original && normalized && original !== normalized) {
            // Salva posição do cursor
            const cursorPos = e.target.selectionStart;
            
            // Atualiza valor
            e.target.value = normalized;
            
            // Restaura cursor
            e.target.setSelectionRange(cursorPos, cursorPos);
            
            // Dispara evento para notificar o sistema de busca
            const event = new Event('input', { bubbles: true });
            e.target.dispatchEvent(event);
            
            console.log(`🔍 Search normalizer: "${original}" → "${normalized}"`);
          }
        });
        
        console.log('✅ Search normalizer: Normalização ativada no input');
      } else if (attempts >= maxAttempts) {
        clearInterval(findAndWrapInput);
        console.warn('⚠️ Search normalizer: Input não encontrado após 10s');
      }
    }, 200);
  }

  // Inicia interceptação
  interceptSearchInput();
  
  // Re-tenta após navegação (SPA)
  if (window.addEventListener) {
    window.addEventListener('popstate', () => {
      setTimeout(interceptSearchInput, 500);
    });
  }
})();

export default {};
