# 🔄 DECISÃO: Trocar Plugin de Busca

## ❌ Problema do Plugin Atual

O `@easyops-cn/docusaurus-search-local`:
- Usa Lunr.js com pipeline fixo
- NÃO expõe configuração do Lunr
- Stemmer de português mantém acentos
- Índice invertido pré-processado (impossível normalizar depois)
- Não tem opção nativa para normalizar acentos

## ✅ Soluções Alternativas Encontradas

### Opção 1: Algolia DocSearch (Recomendado)
- ✅ **Gratuito** para projetos open source
- ✅ **Suporte nativo** a acentos
- ✅ **Oficial** do Docusaurus
- ✅ **Funciona perfeitamente**
- ⚠️ Requer site público
- ⚠️ Indexação externa (não local)

### Opção 2: docusaurus-lunr-search
- ✅ Busca local
- ✅ Suporte a múltiplos idiomas
- ✅ Mais configurável
- ⚠️ Menos popular

### Opção 3: Typesense
- ✅ Open source
- ✅ Self-hosted
- ✅ Suporte a acentos
- ⚠️ Mais complexo de configurar

## 🎯 Recomendação

Trocar para **Algolia DocSearch** - é a solução oficial e funciona perfeitamente.

Se não puder usar Algolia (site precisa ser público), usar **docusaurus-lunr-search**.

Quer que eu implemente qual?

