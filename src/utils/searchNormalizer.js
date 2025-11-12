/**
 * Utilitários para normalização de texto na busca
 * Remove acentos, converte para minúsculas e prepara texto para busca fuzzy
 */

/**
 * Remove acentos e diacríticos de uma string
 * @param {string} text - Texto a ser normalizado
 * @returns {string} - Texto sem acentos
 */
export function removeAccents(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza texto para busca (remove acentos, espaços extras, etc)
 * @param {string} text - Texto a ser normalizado
 * @returns {string} - Texto normalizado
 */
export function normalizeForSearch(text) {
  if (!text) return '';
  return removeAccents(text)
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .replace(/[^\w\s]/g, '') // Remove caracteres especiais
    .trim();
}

/**
 * Calcula similaridade entre duas strings usando Levenshtein
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Similaridade entre 0 e 1
 */
export function calculateSimilarity(str1, str2) {
  const s1 = normalizeForSearch(str1);
  const s2 = normalizeForSearch(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Se uma string contém a outra, considera similaridade alta
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }
  
  // Calcula distância de Levenshtein
  const editDistance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return (maxLength - editDistance) / maxLength;
}

/**
 * Algoritmo de Levenshtein para calcular distância entre strings
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Distância de edição
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Inicializa matriz
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Preenche matriz
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substituição
          matrix[i][j - 1] + 1,     // Inserção
          matrix[i - 1][j] + 1      // Deleção
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Expande uma query para incluir variações sem acentos
 * @param {string} query - Query original
 * @returns {string[]} - Array de variações da query
 */
export function expandQuery(query) {
  const normalized = normalizeForSearch(query);
  const original = query.toLowerCase().trim();
  
  // Retorna ambas as versões para busca
  return [original, normalized].filter((q, index, self) => self.indexOf(q) === index);
}

/**
 * Melhora resultados da busca aplicando fuzzy matching
 * @param {Array} results - Resultados da busca original
 * @param {string} query - Query de busca
 * @param {number} threshold - Threshold mínimo de similaridade (0-1)
 * @returns {Array} - Resultados melhorados e ordenados por relevância
 */
export function enhanceSearchResults(results, query, threshold = 0.3) {
  if (!query || !results || results.length === 0) return results;
  
  const normalizedQuery = normalizeForSearch(query);
  
  return results
    .map(result => {
      const title = result.title || '';
      const content = result.content || '';
      
      // Calcula similaridade para título e conteúdo
      const titleSimilarity = calculateSimilarity(normalizedQuery, title);
      const contentSimilarity = calculateSimilarity(normalizedQuery, content);
      
      // Score combinado (título tem peso maior)
      const combinedScore = (titleSimilarity * 0.7) + (contentSimilarity * 0.3);
      
      return {
        ...result,
        similarityScore: combinedScore,
        titleSimilarity,
        contentSimilarity,
      };
    })
    .filter(result => result.similarityScore >= threshold)
    .sort((a, b) => {
      // Ordena por similaridade (maior primeiro)
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      // Se similaridade igual, ordena por título
      return (a.title || '').localeCompare(b.title || '');
    });
}

/**
 * Busca fuzzy em um array de itens
 * @param {Array} items - Array de itens para buscar
 * @param {string} query - Query de busca
 * @param {Function} getText - Função para extrair texto do item
 * @param {number} threshold - Threshold mínimo de similaridade
 * @returns {Array} - Itens que correspondem à busca
 */
export function fuzzySearch(items, query, getText = (item) => item, threshold = 0.4) {
  if (!query || !items || items.length === 0) return items;
  
  const normalizedQuery = normalizeForSearch(query);
  
  return items
    .map(item => {
      const text = getText(item);
      const similarity = calculateSimilarity(normalizedQuery, text);
      return { item, similarity };
    })
    .filter(({ similarity }) => similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item }) => item);
}

