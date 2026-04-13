# 🔍 Melhores Práticas: Busca Semântica com Normalização de Acentos

## 📚 Resumo da Pesquisa

### ✅ Confirmação: FlexSearch TEM Suporte Nativo

O FlexSearch **tem suporte nativo** para normalização através de:
- **Encoders**: `latin:default`, `latin:simple`, `latin:balance`, `latin:advanced`, `latin:extra`
- **Função `normalize`**: Pode ser customizada
- **Função `prepare`**: Processa texto antes de indexar
- **Função `encode`**: Processa texto durante indexação

**Exemplo de configuração nativa:**
```javascript
const index = new FlexSearch({
  encode: "icase",           // Case insensitive
  charset: "latin:advanced", // Normaliza acentos automaticamente
  normalize: function(str) { // Função customizada (opcional)
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
});
```

### ❌ Limitação do Plugin

O plugin `@easyops-cn/docusaurus-search-local`:
- **NÃO expõe** `flexSearchOptions` diretamente (testado - erro de validação)
- **NÃO permite** configurar `normalize` function
- **NÃO permite** configurar `charset` diretamente
- **MAS permite** hooks através de plugins customizados do Docusaurus

## 🎯 Abordagens Recomendadas (da Pesquisa)

### Abordagem 1: Normalização Dupla ⭐ (Mais Confiável)

**Como funciona:**
1. **Durante Indexação (Build)**: Normalizar textos ao adicionar ao índice
2. **Durante Busca (Runtime)**: Normalizar query antes de buscar

**Vantagens:**
- ✅ Funciona independente da biblioteca
- ✅ Garante match mesmo se uma parte falhar
- ✅ Mais confiável

**Desvantagens:**
- ⚠️ Requer acesso ao processo de indexação
- ⚠️ Pode ser mais complexo de implementar

**Implementação:**
```javascript
// Função de normalização padrão
function normalizeText(text) {
  return String(text)
    .normalize('NFD')                    // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacríticos
    .toLowerCase()                        // Minúsculas
    .trim();                              // Remove espaços
}

// Durante indexação
const normalizedTitle = normalizeText(doc.title);
index.add(doc.id, normalizedTitle);

// Durante busca
const normalizedQuery = normalizeText(userQuery);
const results = index.search(normalizedQuery);
```

### Abordagem 2: Interceptação Client-Side (Atual)

**Como funciona:**
- Interceptar método `search` do FlexSearch
- Normalizar query antes de passar para FlexSearch
- Buscar com query normalizada

**Vantagens:**
- ✅ Não requer modificação do índice
- ✅ Mais simples de implementar
- ✅ Funciona se índice já estiver normalizado

**Desvantagens:**
- ❌ Pode não funcionar se índice não estiver normalizado
- ❌ Depende de interceptação (pode falhar)

**Implementação:**
```javascript
const originalSearch = index.search.bind(index);
index.search = function(query, options) {
  const normalizedQuery = normalizeText(query);
  return originalSearch(normalizedQuery, options);
};
```

### Abordagem 3: Busca Bidirecional (Fallback)

**Como funciona:**
- Buscar primeiro com query original
- Se não encontrar, buscar com query normalizada
- Combinar resultados

**Vantagens:**
- ✅ Preserva busca normal
- ✅ Funciona mesmo se índice não estiver normalizado
- ✅ Mais seguro

**Desvantagens:**
- ⚠️ Pode ser mais lento (duas buscas)
- ⚠️ Pode não funcionar se índice não tiver versões normalizadas

## 🔧 Pontos de Intervenção no Docusaurus

### 1. Build Time (Indexação)

**Hooks disponíveis:**
- `loadContent` - Processar documentos antes de indexar
- `contentLoaded` - Modificar conteúdo após carregar
- Plugin webpack - Modificar arquivos de índice gerados

**Exemplo:**
```javascript
// Plugin customizado
function myPlugin(context, options) {
  return {
    name: 'normalize-search-plugin',
    async loadContent() {
      // Processar documentos
    },
    configureWebpack(config) {
      // Modificar arquivos de índice
    }
  };
}
```

### 2. Runtime (Busca)

**Pontos de interceptação:**
- Método `search` do FlexSearch
- Eventos de input do usuário
- Valor do input (Object.defineProperty)

**Exemplo:**
```javascript
// Interceptar FlexSearch
const pluginData = window.__docusaurus.pluginData['docusaurus-search-local'];
const indexes = pluginData.indexes;
indexes.forEach(index => {
  const originalSearch = index.search.bind(index);
  index.search = function(query) {
    return originalSearch(normalizeText(query));
  };
});
```

## 📋 Recomendação Final

### Solução Híbrida (Melhor Abordagem)

**Combinar:**
1. ✅ **Normalizar índice durante build** (se possível acessar)
2. ✅ **Normalizar queries no client-side** (sempre)
3. ✅ **Busca bidirecional como fallback** (garantir funcionamento)

**Por quê:**
- Garante funcionamento mesmo se uma parte falhar
- Mais robusto e confiável
- Funciona em diferentes cenários

### Função de Normalização Padrão

```javascript
function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .normalize('NFD')                    // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacríticos
    .toLowerCase()                        // Minúsculas
    .trim();                              // Remove espaços
}
```

## 🎯 Próximos Passos Sugeridos

1. **Verificar se plugin tem hooks** para normalizar durante indexação
2. **Manter normalização client-side** como está
3. **Adicionar busca bidirecional** como fallback
4. **Testar em diferentes cenários** (índice normalizado vs não normalizado)

## 📚 Referências

- FlexSearch Documentation: Normalização de caracteres
- JavaScript String.normalize(): Unicode Normalization
- Docusaurus Plugin API: Hooks disponíveis
- Best Practices: Normalização de texto em buscas

## ✅ Conclusão

A **normalização dupla** (índice + query) é a abordagem mais confiável, mas como o plugin não expõe opções nativas, a **solução híbrida** (normalização client-side + fallback bidirecional) é a melhor alternativa disponível.

