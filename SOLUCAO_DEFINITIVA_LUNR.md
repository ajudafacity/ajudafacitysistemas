# 🎯 SOLUÇÃO DEFINITIVA - O Plugin Usa LUNR, Não FlexSearch!

## 🔍 Descoberta Importante

O plugin `@easyops-cn/docusaurus-search-local` **NÃO usa FlexSearch**, ele usa **LUNR.JS**!

Isso explica por que nossa solução não funcionava completamente.

## 📚 O que é Lunr.js

- **Biblioteca**: `lunr` v2.3.9
- **Linguagens**: Suporte via `lunr-languages` (incluindo português)
- **Stemming**: Aplica stemming automático para português
- **Stop words**: Filtra palavras comuns em português

## ⚠️ Problema do Stemmer de Português

O stemmer de português do Lunr **NÃO normaliza acentos por padrão**. Ele:
- Remove sufixos (ação, mente, etc.)
- Aplica regras morfológicas
- **MAS mantém os acentos** (á, é, í, ó, ú, ã, õ, ç)

Exemplo:
- "usuário" → stemmed: "usuar"
- "usuario" → stemmed: "usuario"
- ❌ **São diferentes!**

## ✅ Opções Disponíveis no Plugin

Segundo `dist/types/index.d.ts`, o plugin expõe:

```typescript
{
  language?: string | string[];           // ✅ Temos: ["pt", "en"]
  removeDefaultStopWordFilter?: boolean;  // ✅ Disponível
  removeDefaultStemmer?: boolean;         // ✅ Disponível
  // ... outras opções ...
}
```

## 🎯 Solução Correta

### Opção 1: Remover Stemmer (Mais Simples)

Se removermos o stemmer, podemos normalizar manualmente:

```javascript
// docusaurus.config.js
[
  require.resolve('@easyops-cn/docusaurus-search-local'),
  {
    hashed: true,
    language: ["pt", "en"],
    removeDefaultStemmer: true,  // ✅ REMOVE O STEMMER
    removeDefaultStopWordFilter: false,
    // ... outras opções ...
  },
]
```

**Vantagens:**
- ✅ Stemmer não aplica acentos diferentes
- ✅ Nossa normalização funciona melhor
- ✅ Busca mais previsível

**Desvantagens:**
- ⚠️ Perde stemming (variações morfológicas)
- ⚠️ "configuração" e "configurar" não seriam equivalentes

### Opção 2: Pipeline Customizado do Lunr (Complexo)

Adicionar um filtro de normalização ao pipeline do Lunr:

```javascript
// No código de build do plugin (precisaria modificar)
lunr(function () {
  // Adicionar normalização ANTES do stemmer
  this.pipeline.before(lunr.pt.stemmer, function(token) {
    return token.update(function(str) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    });
  });
  
  this.use(lunr.pt);
  this.ref('i');
  this.field('t');
  // ... resto ...
});
```

**Problema:** Requer modificar o código do plugin.

### Opção 3: Normalizar Antes de Indexar (Atual)

Nossa abordagem atual:
1. Plugin de build normaliza textos no índice
2. Client-side normaliza queries

**Problema:** O stemmer ainda é aplicado DEPOIS da normalização, pode gerar inconsistências.

## 🚀 Recomendação Final

### TESTAR: `removeDefaultStemmer: true`

1. **Adicionar ao config**:
```javascript
removeDefaultStemmer: true,
```

2. **Manter normalização client-side**:
- Normalizar query antes de buscar
- Garantir consistência

3. **Testar**:
```bash
npm run clear
npm run build
npm run serve
```

### Por que deve funcionar:

1. **Sem stemmer**: Lunr não modifica "usuário" → "usuar"
2. **Index normalizado**: Todos os textos sem acento
3. **Query normalizada**: Busca também sem acento
4. **Match garantido**: "usuario" = "usuario" ✅

## 📝 Próximo Passo

Implementar `removeDefaultStemmer: true` no `docusaurus.config.js` e testar.

## 🔍 Verificação

Após implementar, verificar no console:
- Index não deve ter palavras com acentos
- Stemming não deve estar ativo
- Busca "usuario" deve encontrar "usuário" ✅
- Busca "usuário" deve encontrar "usuario" ✅

## ⚠️ Trade-offs

**Ganhos:**
- ✅ Busca funciona com/sem acentos
- ✅ Mais previsível
- ✅ Menos complexidade

**Perdas:**
- ⚠️ Stemming desativado
- ⚠️ "configurar" não encontra "configuração"
- ⚠️ Precisa digitar palavra mais completa

**Solução para o trade-off:**
- Usar wildcard search (já suportado pelo Lunr)
- "config*" encontra "configurar", "configuração", etc.

