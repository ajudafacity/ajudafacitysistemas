# 🔍 Guia de Busca Melhorada - Normalização e Fuzzy Search

Este guia explica como a busca foi melhorada para ignorar acentos e erros leves de digitação.

## ✨ Funcionalidades Implementadas

### 1. **Normalização de Acentos**
- Remove automaticamente acentos durante a busca
- Exemplo: "configuração" encontra "configuracao" e vice-versa
- Funciona tanto na query quanto nos documentos indexados

### 2. **Busca Fuzzy (Tolerante a Erros)**
- Encontra resultados mesmo com pequenos erros de digitação
- Usa algoritmo de Levenshtein para calcular similaridade
- Threshold configurável (padrão: 30% de similaridade)

### 3. **Melhorias Visuais**
- Indicação visual de matches aproximados
- Badge de similaridade nos resultados
- Destaque melhorado dos termos encontrados

## 🛠️ Como Funciona

### Arquivos Criados

1. **`src/utils/searchNormalizer.js`**
   - Funções utilitárias para normalização
   - Algoritmo de Levenshtein para fuzzy search
   - Função `enhanceSearchResults()` para melhorar resultados

2. **`src/client-modules/search-enhancer.js`**
   - Módulo client-side que intercepta a busca
   - Melhora resultados em tempo real
   - Adiciona classes CSS para matches aproximados

3. **`src/css/search-enhancements.css`**
   - Estilos para melhorar visualização
   - Indicação de matches fuzzy
   - Melhorias de UX

4. **`scripts/normalizeSearchIndex.js`**
   - Script para normalizar índices de busca
   - Adiciona `searchKeywords` nos frontmatters
   - Pode ser executado com `npm run normalize-search`

## 📋 Configuração do Plugin

O plugin `@easyops-cn/docusaurus-search-local` foi configurado com:

```javascript
{
  hashed: true,
  language: ["pt", "en"],
  indexBlog: false,
  indexPages: false,
  searchResultLimits: 20,
  searchResultContextMaxLength: 50,
  explicitSearchResultPath: true,
}
```

## 🚀 Como Usar

### Busca Normal
A busca funciona normalmente, mas agora:
- ✅ Ignora acentos automaticamente
- ✅ Tolerante a pequenos erros
- ✅ Mostra resultados por relevância

### Exemplos de Busca

| Você digita | Encontra |
|------------|----------|
| `configuracao` | "Configuração", "configuração" |
| `cadastro` | "Cadastros", "cadastro" |
| `relatorio` | "Relatórios", "relatório" |
| `impresora` | "Impressora", "impressoras" |

### Busca com Erros Leves

A busca também encontra resultados mesmo com pequenos erros:

| Você digita | Encontra |
|------------|----------|
| `configuracao` | "configuração" (sem acento) |
| `cadastros` | "cadastro" (singular/plural) |
| `relatorios` | "relatórios" (com/sem acento) |

## 🔧 Manutenção

### Normalizar Índice de Busca

Para adicionar palavras-chave normalizadas nos documentos:

```bash
npm run normalize-search
```

Este script:
- Processa todos os arquivos `.mdx` em `docs/`
- Adiciona campo `searchKeywords` no frontmatter
- Normaliza títulos para busca sem acentos

### Ajustar Threshold de Similaridade

Para ajustar o threshold mínimo de similaridade, edite:

```javascript
// src/utils/searchNormalizer.js
enhanceSearchResults(results, query, 0.3) // 0.3 = 30% de similaridade mínima
```

Valores recomendados:
- `0.2` - Mais permissivo (mais resultados, menos precisos)
- `0.3` - Padrão (balanceado)
- `0.5` - Mais restritivo (menos resultados, mais precisos)

## 🎨 Personalização

### Modificar Estilos

Edite `src/css/search-enhancements.css` para personalizar:
- Cores de matches aproximados
- Estilos dos resultados
- Animações e transições

### Ajustar Algoritmo

Edite `src/utils/searchNormalizer.js` para:
- Modificar peso de título vs conteúdo
- Ajustar algoritmo de similaridade
- Adicionar novas regras de normalização

## 📊 Performance

- ✅ Busca normalizada é rápida (O(n))
- ✅ Fuzzy search usa cache quando possível
- ✅ Resultados limitados a 20 por padrão
- ✅ Processamento client-side não afeta build

## 🐛 Troubleshooting

### Busca não está ignorando acentos

1. Verifique se o módulo client-side está carregado
2. Verifique console do navegador para erros
3. Limpe cache: `npm run clear && npm start`

### Resultados não aparecem

1. Verifique se há conteúdo indexado
2. Tente reduzir o threshold de similaridade
3. Verifique se os arquivos `.mdx` estão em `docs/`

### Performance lenta

1. Reduza `searchResultLimits` na configuração
2. Aumente threshold de similaridade
3. Limite busca a títulos apenas (mais rápido)

## 📝 Notas Técnicas

- A normalização usa `String.normalize('NFD')` para remover diacríticos
- Algoritmo de Levenshtein calcula distância de edição
- Similaridade é calculada como: `(maxLength - editDistance) / maxLength`
- Resultados são ordenados por score de similaridade

## 🔄 Atualizações Futuras

Possíveis melhorias:
- [ ] Busca por sinônimos
- [ ] Busca por tags/categorias
- [ ] Histórico de buscas
- [ ] Sugestões de busca
- [ ] Busca avançada com filtros

