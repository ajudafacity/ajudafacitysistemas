/**
 * SearchBar customizado usando FlexSearch
 * Design inspirado no MongoDB - Simples, limpo e funcional
 * Usa Portal sempre para garantir z-index máximo
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import FlexSearch from 'flexsearch';
import styles from './styles.module.css';

let searchIndex = null;
let searchDocs = null;

function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function loadSearchIndex() {
  if (searchIndex) return searchIndex;
  
  try {
    const path = window.location.pathname;
    const baseUrl = path.includes('/en/') || path.startsWith('/en') ? '/en' : '';
    
    // Tenta múltiplos caminhos (desenvolvimento e produção)
    const paths = [
      `${baseUrl}/flexsearch-index.json`,
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
    
    if (!data.docs || data.docs.length === 0) {
      console.warn('⚠️ FlexSearch: Nenhum documento encontrado no índice');
      return null;
    }
    
    searchDocs = data.docs;
    
    // Cria índice FlexSearch
    searchIndex = FlexSearch.Document({
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
      encode: (str) => {
        const normalized = normalizeText(str);
        return normalized ? normalized.split(/\s+/) : [];
      },
    });
    
    // Adiciona documentos normalizados ao índice
    data.docs.forEach((doc, idx) => {
      searchIndex.add({
        id: idx,
        title: normalizeText(doc.title || ''),
        content: normalizeText(doc.content || ''),
      });
    });
    
    return searchIndex;
  } catch (e) {
    console.error('❌ Erro ao carregar índice FlexSearch:', e);
    return null;
  }
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Detecta mobile e atualiza posição
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        
        if (mobile) {
          setPosition({
            top: 0,
            left: 0,
            width: window.innerWidth,
          });
        } else {
          // Desktop: alinha com o input
          const minWidth = 500;
          const maxWidth = 700;
          const padding = 20; // Padding mínimo das bordas
          let width = Math.max(minWidth, Math.min(maxWidth, rect.width * 1.5));
          let left = rect.left;
          
          // Ajusta se ultrapassar borda direita
          if (left + width > window.innerWidth - padding) {
            // Tenta ajustar a posição para a esquerda
            left = Math.max(padding, window.innerWidth - width - padding);
            // Se ainda não couber, reduz a largura
            if (left + width > window.innerWidth - padding) {
              width = window.innerWidth - left - padding;
            }
          }
          
          // Ajusta se ultrapassar borda esquerda
          if (left < padding) {
            left = padding;
            width = Math.min(width, window.innerWidth - padding * 2);
          }
          
          setPosition({
            top: rect.bottom + 8,
            left: left,
            width: Math.max(minWidth, Math.min(maxWidth, width)),
          });
        }
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    loadSearchIndex().then(index => {
      if (index) {
        setIndexReady(true);
      }
    });
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, []);

  // Atualiza posição quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return;
        
        const rect = inputRef.current.getBoundingClientRect();
        const mobile = window.innerWidth <= 768;
        
        if (mobile) {
          setPosition({
            top: 0,
            left: 0,
            width: window.innerWidth,
          });
        } else {
          const minWidth = 500;
          const maxWidth = 700;
          const padding = 20; // Padding mínimo das bordas
          let width = Math.max(minWidth, Math.min(maxWidth, rect.width * 1.5));
          let left = rect.left;
          
          // Ajusta se ultrapassar borda direita
          if (left + width > window.innerWidth - padding) {
            // Tenta ajustar a posição para a esquerda
            left = Math.max(padding, window.innerWidth - width - padding);
            // Se ainda não couber, reduz a largura
            if (left + width > window.innerWidth - padding) {
              width = window.innerWidth - left - padding;
            }
          }
          
          // Ajusta se ultrapassar borda esquerda
          if (left < padding) {
            left = padding;
            width = Math.min(width, window.innerWidth - padding * 2);
          }
          
          setPosition({
            top: rect.bottom + 8,
            left: left,
            width: Math.max(minWidth, Math.min(maxWidth, width)),
          });
        }
      };
      
      // Atualiza imediatamente
      updatePosition();
      
      // Usa requestAnimationFrame para atualizações suaves
      let rafId = null;
      let timeoutId = null;
      const scheduleUpdate = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          updatePosition();
          if (isOpen) {
            timeoutId = setTimeout(scheduleUpdate, 50);
          }
        });
      };
      
      scheduleUpdate();
      
      // Também escuta scroll e resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Fecha ao clicar fora e previne scroll no mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      // No mobile, não fecha ao clicar fora - só fecha com o botão X
      if (isMobile) return;
      
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Previne scroll do body quando a tela fullscreen está aberta
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalTop = document.body.style.top;
      const originalHeight = document.body.style.height;
      const html = document.documentElement;
      const originalHtmlOverflow = html.style.overflow;
      const originalHtmlPosition = html.style.position;
      
      if (isMobile) {
        // Calcula scroll atual para manter posição
        const scrollY = window.scrollY;
        
        // Bloqueia completamente o body e html
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.bottom = '0';
        
        html.style.overflow = 'hidden';
        html.style.position = 'fixed';
        html.style.width = '100%';
        html.style.height = '100%';
        
        // Adiciona uma camada sólida no body para garantir que nada apareça
        const backdrop = document.createElement('div');
        backdrop.id = 'search-backdrop';
        backdrop.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: var(--ifm-background-color) !important;
          z-index: 2147483646 !important;
          opacity: 1 !important;
        `;
        document.body.appendChild(backdrop);
      }
      
      if (!isMobile) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }

      return () => {
        if (!isMobile) {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('touchstart', handleClickOutside);
        }
        
        if (isMobile) {
          // Remove backdrop
          const backdrop = document.getElementById('search-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
          
          // Restaura scroll
          const scrollY = document.body.style.top;
          document.body.style.overflow = originalOverflow;
          document.body.style.position = originalPosition;
          document.body.style.width = originalWidth;
          document.body.style.height = originalHeight;
          document.body.style.top = originalTop;
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.style.bottom = '';
          
          html.style.overflow = originalHtmlOverflow;
          html.style.position = originalHtmlPosition;
          html.style.width = '';
          html.style.height = '';
          
          if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
          }
        }
      };
    }
  }, [isOpen, isMobile]);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen || results.length === 0) {
      setSelectedIndex(-1);
      return;
    }
    
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          if (selectedIndex >= 0 && results[selectedIndex]) {
            e.preventDefault();
            window.location.href = results[selectedIndex].url;
            setIsOpen(false);
            setQuery('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          inputRef.current?.blur();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Busca com debounce
  const handleSearch = useCallback(async (value) => {
    setQuery(value);
    setSelectedIndex(-1);
    
    // Limpa timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value || value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    
    // Debounce de 150ms para melhor performance
    searchTimeoutRef.current = setTimeout(async () => {
      setIsOpen(true);
      
      const index = await loadSearchIndex();
      
      if (!index || !searchDocs) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const normalizedQuery = normalizeText(value);
        
        const searchResults = index.search(normalizedQuery, {
          limit: 15, // Aumentado para mais resultados
          enrich: true,
        });
        
        const hits = [];
        const seenIds = new Set();
        
        if (Array.isArray(searchResults)) {
          searchResults.forEach(resultObj => {
            if (resultObj && resultObj.result && Array.isArray(resultObj.result)) {
              resultObj.result.forEach(id => {
                if (!seenIds.has(id) && searchDocs && searchDocs[id]) {
                  seenIds.add(id);
                  const doc = searchDocs[id];
                  // Extrai snippet mais relevante
                  const content = doc.content || '';
                  const snippet = content.length > 200 
                    ? content.substring(0, 200) + '...' 
                    : content;
                  
                  hits.push({
                    id: id,
                    title: doc.title,
                    url: doc.url,
                    content: snippet,
                  });
                }
              });
            }
          });
        }
        
        setResults(hits);
      } catch (e) {
        console.error('❌ Erro na busca:', e);
        setResults([]);
      }
      
      setIsLoading(false);
    }, 150);
  }, []);

  // Função para destacar termos pesquisados
  const highlightText = (text, query) => {
    if (!text || !query || query.length < 2) return text;
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    if (queryWords.length === 0) return text;
    
    // Cria regex para encontrar palavras (case-insensitive)
    const regex = new RegExp(`(${queryWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    
    const parts = text.split(regex);
    return parts.map((part, index) => {
      const isMatch = queryWords.some(q => normalizeText(part).includes(q));
      return isMatch ? (
        <mark key={index} className={styles.highlight}>{part}</mark>
      ) : (
        part
      );
    });
  };

  const renderResults = () => {
    // Mobile: sempre mostra a tela fullscreen quando aberta
    if (isMobile && isOpen) {
      const mobileContent = (
        <>
          {/* Backdrop sólido - como uma nova página */}
          <div 
            className={styles.mobileSearchBackdrop}
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setResults([]);
            }}
          />
          <div className={styles.mobileSearchScreen}>
          <div className={styles.mobileSearchHeader}>
            <div className={styles.mobileSearchInputWrapper}>
              <svg
                className={styles.mobileSearchIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 19L13 13M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Digite para buscar na documentação..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.mobileSearchInput}
                autoFocus
                aria-label="Buscar na documentação"
                autoComplete="off"
              />
            </div>
            <button
              className={styles.mobileCloseButton}
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                setResults([]);
                inputRef.current?.blur();
              }}
              aria-label="Fechar busca"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div 
            ref={resultsRef} 
            className={styles.mobileSearchResults}
          >
            {!query || query.length < 2 ? (
              <div className={styles.mobileSearchEmpty}>
                <svg className={styles.mobileSearchEmptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <div className={styles.mobileSearchEmptyTitle}>Buscar na documentação</div>
                <div className={styles.mobileSearchEmptySubtitle}>
                  Digite palavras-chave para encontrar o que você procura
                </div>
              </div>
            ) : isLoading ? (
              <div className={styles.searchLoading}>
                <div className={styles.spinner}></div>
                <span>Buscando...</span>
              </div>
            ) : results.length > 0 ? (
              <>
                <div className={styles.searchResultsHeader}>
                  <span className={styles.resultsCount}>
                    {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                </div>
                <ul className={styles.searchResultsList}>
                {results.map((hit, index) => (
                  <li key={hit.id} className={styles.searchResultItem}>
                    <a
                      href={hit.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        setQuery('');
                        window.location.href = hit.url;
                      }}
                      className={`${styles.searchResultLink} ${selectedIndex === index ? styles.searchResultLinkSelected : ''}`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={styles.searchResultTitle}>
                        {highlightText(hit.title, query)}
                      </div>
                      <div className={styles.searchResultContent}>
                        {highlightText(hit.content, query)}
                      </div>
                      <div className={styles.searchResultUrl}>
                        {hit.url}
                      </div>
                    </a>
                  </li>
                ))}
                </ul>
              </>
            ) : (
              <div className={styles.searchNoResults}>
                <svg className={styles.noResultsIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <div className={styles.noResultsTitle}>Nenhum resultado encontrado</div>
                <div className={styles.noResultsSubtitle}>
                  Tente buscar com termos diferentes ou verifique a ortografia
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      );
      
      if (typeof document !== 'undefined') {
        return createPortal(mobileContent, document.body);
      }
      return mobileContent;
    }
    
    // Desktop: layout original (só mostra se tiver query ou resultados)
    if (!isOpen || (query.length < 2 && results.length === 0)) return null;
    
    const resultsContent = (
      <div 
        ref={resultsRef} 
        className={styles.searchResults}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
        }}
      >
        {isLoading ? (
          <div className={styles.searchLoading}>
            <div className={styles.spinner}></div>
            <span>Buscando...</span>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className={styles.searchResultsHeader}>
              <span className={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </span>
              <span className={styles.searchHint}>
                Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
              </span>
            </div>
            <ul className={styles.searchResultsList}>
            {results.map((hit, index) => (
              <li key={hit.id} className={styles.searchResultItem}>
                <a
                  href={hit.url}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    setQuery('');
                    window.location.href = hit.url;
                  }}
                  className={`${styles.searchResultLink} ${selectedIndex === index ? styles.searchResultLinkSelected : ''}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.searchResultTitle}>
                    {highlightText(hit.title, query)}
                  </div>
                  <div className={styles.searchResultContent}>
                    {highlightText(hit.content, query)}
                  </div>
                  <div className={styles.searchResultUrl}>
                    {hit.url}
                  </div>
                </a>
              </li>
            ))}
            </ul>
          </>
        ) : query.length >= 2 ? (
          <div className={styles.searchNoResults}>
            <svg className={styles.noResultsIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <div className={styles.noResultsTitle}>Nenhum resultado encontrado</div>
            <div className={styles.noResultsSubtitle}>
              Tente buscar com termos diferentes ou verifique a ortografia
            </div>
          </div>
        ) : null}
      </div>
    );
    
    if (typeof document !== 'undefined') {
      return createPortal(resultsContent, document.body);
    }
    
    return resultsContent;
  };

  return (
    <div ref={containerRef} className={styles.searchBar}>
      {isMobile ? (
        // Mobile: apenas botão da lupa - navega para página de busca
        <button
          className={styles.mobileSearchTrigger}
          onClick={() => {
            // Navega para a página de busca
            if (typeof window !== 'undefined') {
              window.location.href = '/search';
            }
          }}
          aria-label="Abrir busca"
          disabled={!indexReady}
        >
          <svg
            className={styles.mobileSearchIconButton}
            width="22"
            height="22"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 19L13 13M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        // Desktop: input normal
        <div className={styles.searchInputWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 19L13 13M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder={indexReady ? "Pesquisar na documentação..." : "Carregando índice..."}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (query.length >= 2 && results.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                inputRef.current?.blur();
              }
            }}
            className={styles.searchInput}
            disabled={!indexReady}
            aria-label="Buscar na documentação"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            autoComplete="off"
          />
        </div>
      )}
      
      {renderResults()}
    </div>
  );
}
