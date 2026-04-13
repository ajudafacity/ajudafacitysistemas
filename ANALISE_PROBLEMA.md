# 🔍 Análise do Problema Real

## ❌ O que Descobrimos

### 1. Lunr usa Índice Invertido Pré-processado

O arquivo `search-index.json` contém:
```json
{
  "0": {
    "documents": [...],  // ✅ Estes foram normalizados
    "index": {
      "version": "2.3.9",
      "fields": ["t"],
      "fieldVectors": [...],  // ❌ PROBLEMA: Vetores pré-calculados COM acentos
      "invertedIndex": {...}, // ❌ PROBLEMA: Índice invertido COM acentos
      "pipeline": ["stemmer-pt"]
    }
  }
}
```

### 2. Por que Normalizar Documentos Não Funciona

O Lunr.js **não busca nos documentos**, ele busca no **índice invertido**!

```
Fluxo do Lunr:
1. Durante BUILD: Processa documentos → Cria índice invertido
2. Durante BUSCA: Query → Busca no índice invertido → Retorna IDs
3. IDs → Busca documentos

Nosso problema:
- ✅ Normalizamos documentos
- ❌ NÃO normalizamos índice invertido (estrutura complexa)
- ❌ NÃO normalizamos fieldVectors (vetores pré-calculados)
```

### 3. Por que Client-Side Não Está Funcionando

O módulo client-side está procurando por "FlexSearch" mas o plugin usa "Lunr":

```javascript
// ERRADO:
const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
indexes = pluginData.indexes || pluginData.index || pluginData.searchIndex;

// CORRETO (precisa encontrar Lunr, não FlexSearch):
// O plugin carrega o índice e cria instâncias do Lunr
// Precisamos interceptar ANTES dele processar a query
```

## ✅ Solução Correta

### Opção A: Rebuild do Índice (Complexo)

Precisaríamos:
1. Normalizar documentos ✅
2. Recriar índice invertido do zero com Lunr
3. Recriar fieldVectors
4. Salvar tudo de volta

**Problema**: Muito complexo, requer entender estrutura interna do Lunr.

### Opção B: Interceptar ANTES do Lunr Processar (Recomendado)

Interceptar a query ANTES dela chegar no Lunr:
1. Encontrar o input de busca
2. Normalizar ANTES de enviar
3. Lunr recebe query já normalizada

**Vantagem**: Simples, confiável, funciona com índice normalizado.

### Opção C: Desabilitar Normalização do Build

1. Deixar índice com acentos (como está)
2. Client-side faz busca dupla (com e sem acento)
3. Combina resultados

**Problema**: Precisa que o client-side funcione corretamente.

## 🎯 Próximo Passo

Precisamos:
1. Ver no console do browser o que realmente está acontecendo
2. Verificar se o client-side está sendo carregado
3. Ajustar para interceptar no lugar certo

Abra http://localhost:3001 e veja o console (F12)

