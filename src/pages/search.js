import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@theme/Layout';
import FlexSearch from 'flexsearch';
import styles from '../theme/SearchBar/styles.module.css';

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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    loadSearchIndex().then(index => {
      if (index) {
        setIndexReady(true);
        // Foca no input quando a página carrega
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    });
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(async (value) => {
    setQuery(value);
    setSelectedIndex(-1);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value || value.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      const index = await loadSearchIndex();
      
      if (!index || !searchDocs) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const normalizedQuery = normalizeText(value);
        
        const searchResults = index.search(normalizedQuery, {
          limit: 15,
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

  const highlightText = (text, query) => {
    if (!text || !query || query.length < 2) return text;
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    if (queryWords.length === 0) return text;
    
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

  // Navegação por teclado
  useEffect(() => {
    if (results.length === 0) {
      setSelectedIndex(-1);
      return;
    }
    
    const handleKeyDown = (e) => {
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
          }
          break;
        case 'Escape':
          e.preventDefault();
          window.history.back();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex]);

  return (
    <Layout title="Buscar" description="Buscar na documentação">
      <div className={styles.searchPageContainer}>
        <div className={styles.searchPageHeader}>
          <div className={styles.searchPageInputWrapper}>
            <svg
              className={styles.searchPageIcon}
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
              placeholder="Digite para buscar na documentação..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchPageInput}
              disabled={!indexReady}
              aria-label="Buscar na documentação"
              autoComplete="off"
            />
          </div>
          <button
            className={styles.searchPageCloseButton}
            onClick={() => window.history.back()}
            aria-label="Fechar busca"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.searchPageResults}>
          {!query || query.length < 2 ? (
            <div className={styles.searchPageEmpty}>
              <svg className={styles.searchPageEmptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <div className={styles.searchPageEmptyTitle}>Buscar na documentação</div>
              <div className={styles.searchPageEmptySubtitle}>
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
    </Layout>
  );
}

