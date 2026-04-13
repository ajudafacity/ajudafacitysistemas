/**
 * Componente de busca usando FlexSearch
 * Substitui a busca padrão do Docusaurus
 */

import React, { useState, useEffect, useRef } from 'react';
import FlexSearch from 'flexsearch';
import './styles.css';

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
  if (searchIndex) return;
  
  try {
    const response = await fetch('/flexsearch-index.json');
    const data = await response.json();
    
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
      encode: (str) => normalizeText(str).split(/\s+/),
    });
    
    data.docs.forEach(doc => {
      searchIndex.add({
        id: doc.id,
        title: normalizeText(doc.title),
        content: normalizeText(doc.content),
      });
    });
    
    console.log('✅ FlexSearch: Índice carregado');
  } catch (e) {
    console.error('❌ Erro ao carregar índice:', e);
  }
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    loadSearchIndex();
    
    // Fecha ao clicar fora
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = async (value) => {
    setQuery(value);
    
    if (!value || value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    await loadSearchIndex();
    
    if (!searchIndex) {
      setIsLoading(false);
      return;
    }
    
    const normalizedQuery = normalizeText(value);
    const searchResults = searchIndex.search(normalizedQuery, {
      limit: 10,
      enrich: true,
    });
    
    const hits = [];
    const seenUrls = new Set();
    
    searchResults.forEach(result => {
      if (result.field === 'title' || result.field === 'content') {
        const doc = searchDocs[result.id];
        if (doc && !seenUrls.has(doc.url)) {
          seenUrls.add(doc.url);
          hits.push({
            title: doc.title,
            url: doc.url,
            content: doc.content.substring(0, 150) + '...',
          });
        }
      }
    });
    
    setResults(hits);
    setIsOpen(hits.length > 0);
    setIsLoading(false);
  };

  return (
    <div className="flexsearch-searchbar">
      <input
        ref={inputRef}
        type="search"
        placeholder="Pesquisar..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="flexsearch-input"
      />
      
      {isOpen && (
        <div ref={resultsRef} className="flexsearch-results">
          {isLoading ? (
            <div className="flexsearch-loading">Buscando...</div>
          ) : results.length > 0 ? (
            <ul className="flexsearch-results-list">
              {results.map((hit, idx) => (
                <li key={idx} className="flexsearch-result-item">
                  <a href={hit.url} onClick={() => setIsOpen(false)}>
                    <div className="flexsearch-result-title">{hit.title}</div>
                    <div className="flexsearch-result-content">{hit.content}</div>
                  </a>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="flexsearch-no-results">Nenhum resultado encontrado</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

