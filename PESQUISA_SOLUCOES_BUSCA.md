# 🔍 Pesquisa: Melhores Soluções para Busca Semântica com Acentos

## 📚 Resumo da Pesquisa

### 1. **FlexSearch - Suporte Nativo**

O FlexSearch **tem suporte nativo** para normalização através de:
- **Encoders**: `latin:default`, `latin:advanced`, etc.
- **Função `normalize`**: Pode ser customizada
- **Função `prepare`**: Processa texto antes de indexar
- **Função `encode`**: Processa texto durante indexação

**Problema**: O plugin `@easyops-cn/docusaurus-search-local` não expõe essas opções diretamente.

### 2. **Abordagens Recomendadas**

#### Abordagem 1: Normalização Dupla (Recomendada)
- **Durante Indexação**: Normalizar textos ao adicionar ao índice
- **Durante Busca**: Normalizar query antes de buscar
- **Vantagem**: Funciona independente da biblioteca
- **Desvantagem**: Requer acesso ao processo de indexação

#### Abordagem 2: Função Normalize Customizada
- **No FlexSearch**: Usar função `normalize` customizada
- **Vantagem**: Processado nativamente pelo FlexSearch
- **Desvantagem**: Requer acesso às opções do FlexSearch

#### Abordagem 3: Interceptação Client-Side
- **Interceptar queries**: Normalizar antes de passar para FlexSearch
- **Vantagem**: Não requer modificação do índice
- **Desvantagem**: Pode não funcionar se índice não estiver normalizado

### 3. **Melhor Prática Identificada**

**Normalização Dupla é a mais confiável:**
1. Normalizar textos durante indexação (build time)
2. Normalizar queries durante busca (runtime)
3. Garantir que ambos usem a mesma função de normalização

### 4. **Como FlexSearch Funciona**

```javascript
// FlexSearch suporta:
const index = new FlexSearch({
  encode: "icase",           // Case insensitive
  charset: "latin:advanced", // Normaliza acentos
  normalize: function(str) { // Função customizada
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
});
```

### 5. **Limitação do Plugin**

O plugin `@easyops-cn/docusaurus-search-local`:
- ❌ Não expõe `flexSearchOptions` diretamente
- ❌ Não permite configurar `normalize` function
- ❌ Não permite configurar `charset` diretamente
- ✅ Mas permite hooks através de plugins customizados

### 6. **Soluções Possíveis**

#### Solução A: Hook no Plugin (Melhor)
- Usar hooks do Docusaurus para interceptar indexação
- Normalizar textos durante build
- Normalizar queries no client-side

#### Solução B: Fork do Plugin
- Fork do `docusaurus-search-local`
- Adicionar suporte a `flexSearchOptions`
- Manter atualizado com upstream

#### Solução C: Plugin Customizado Completo
- Criar plugin que substitui o de busca
- Usar FlexSearch diretamente com todas as opções
- Mais trabalho, mas controle total

### 7. **Recomendação Final**

**Abordagem Híbrida:**
1. **Plugin de Build**: Normalizar textos no índice (se possível acessar)
2. **Módulo Client-Side**: Normalizar queries antes de buscar
3. **Fallback**: Se índice não normalizado, buscar com ambas versões

### 8. **Função de Normalização Padrão**

```javascript
function normalizeText(text) {
  return String(text)
    .normalize('NFD')                    // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacríticos
    .toLowerCase()                        // Minúsculas
    .trim();                              // Remove espaços
}
```

### 9. **Pontos de Intervenção**

1. **Build Time**:
   - Hook `loadContent` - Processar documentos antes de indexar
   - Hook `contentLoaded` - Modificar conteúdo indexado
   - Plugin webpack - Modificar arquivos de índice gerados

2. **Runtime**:
   - Interceptar método `search` do FlexSearch
   - Interceptar eventos de input
   - Interceptar valor do input (Object.defineProperty)

### 10. **Considerações Importantes**

- ✅ **Consistência**: Mesma função de normalização em todos os lugares
- ✅ **Performance**: Normalização deve ser rápida
- ✅ **Compatibilidade**: Não quebrar busca normal
- ✅ **Manutenibilidade**: Código simples e documentado

## 🎯 Conclusão da Pesquisa

A **melhor abordagem** é:
1. Normalizar índice durante build (se possível)
2. Normalizar queries no client-side (sempre)
3. Usar fallback bidirecional (buscar com ambas versões)

Isso garante que funcione mesmo se uma parte falhar.

