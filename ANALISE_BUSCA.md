# 🔍 Análise da Busca - Normalização de Acentos e Erros Leves

## 📊 Status Atual da Implementação

### ✅ O que está implementado:

1. **Plugin de Busca**: `@easyops-cn/docusaurus-search-local` v0.44.5
   - Busca local usando FlexSearch
   - Configurado para português e inglês
   - Limite de 20 resultados

2. **Módulos Client-Side** (atualizados):
   - ✅ `search-accent-normalizer.js` - **NOVO módulo unificado** que intercepta o FlexSearch
   - ⚠️ `search-enhancer.js` - Módulo antigo (mantido mas não usado)
   - ⚠️ `search-accent-fix.js` - Módulo antigo (mantido mas não usado)

3. **Utilitários**:
   - `src/utils/searchNormalizer.js` - Funções de normalização e fuzzy search

### 🔧 Como Funciona Atualmente

#### Módulo Unificado (`search-accent-normalizer.js`)

O novo módulo funciona da seguinte forma:

1. **Aguarda o plugin carregar**: Verifica se `window.__docusaurus.pluginData['docusaurus-search-local']` está disponível

2. **Intercepta os índices do FlexSearch**: 
   - Envolve o método `search()` de cada índice
   - Quando uma query é feita, normaliza automaticamente removendo acentos
   - Busca tanto com a query original quanto com a normalizada
   - Combina resultados removendo duplicatas

3. **Normalização de texto**:
   ```javascript
   function normalizeText(text) {
     return text
       .normalize('NFD')  // Decompõe caracteres acentuados
       .replace(/[\u0300-\u036f]/g, '')  // Remove diacríticos
       .toLowerCase()
       .trim();
   }
   ```

### 🎯 Funcionalidades Esperadas

#### ✅ Normalização de Acentos
- **Deve funcionar**: Buscar "configuracao" encontra "configuração"
- **Como funciona**: O módulo intercepta a query e busca com versão normalizada

#### ⚠️ Busca Fuzzy (Tolerante a Erros)
- **Status**: Parcialmente implementado
- **O que funciona**: Normalização de acentos
- **O que pode não funcionar**: Erros de digitação (ex: "configuracao" vs "configuracao" com erro)
- **Nota**: O FlexSearch tem suporte nativo a fuzzy search, mas precisa ser configurado

### 🔍 Como Verificar se Está Funcionando

1. **Abra o console do navegador** (F12)
2. **Digite na busca** um termo com acentos (ex: "configuração")
3. **Verifique os logs**:
   - Deve aparecer: `🔍 Search normalizer: Input encontrado, inicializando...`
   - Deve aparecer: `✅ Search normalizer: FlexSearch interceptado`
   - Deve aparecer: `🔍 Search normalizer [index]: Query "configuração" -> "configuracao", encontrou X resultados`

4. **Teste buscas**:
   - Buscar "configuracao" (sem acento) deve encontrar páginas com "configuração"
   - Buscar "configuração" (com acento) deve encontrar páginas com "configuracao"

### ⚠️ Possíveis Problemas

1. **Módulos conflitantes**: 
   - Os módulos antigos (`search-enhancer.js` e `search-accent-fix.js`) podem estar causando conflitos
   - **Solução**: Remover ou comentar esses módulos do `docusaurus.config.js`

2. **Timing de inicialização**:
   - O FlexSearch pode não estar disponível quando o módulo tenta interceptá-lo
   - **Solução**: O módulo atual aguarda até 10 segundos

3. **Estrutura do índice**:
   - A estrutura dos índices pode variar entre versões do plugin
   - **Solução**: O módulo tenta diferentes estruturas (array, objeto, método direto)

### 🚀 Melhorias Recomendadas

1. **Adicionar configuração explícita do FlexSearch** (se o plugin suportar):
   ```javascript
   {
     flexSearchOptions: {
       threshold: 0.3,  // Tolerância a erros (0-1)
       depth: 3,        // Profundidade de busca
     }
   }
   ```

2. **Normalizar o índice durante o build**:
   - Ativar o plugin `search-normalizer-plugin.js` para normalizar documentos durante o build
   - Isso garantiria que tanto queries quanto documentos sejam normalizados

3. **Adicionar testes**:
   - Criar testes automatizados para verificar se a normalização está funcionando
   - Testar diferentes cenários de busca

### 📝 Próximos Passos

1. ✅ Criar módulo unificado (`search-accent-normalizer.js`)
2. ✅ Atualizar configuração para usar apenas o módulo unificado
3. ⏳ Testar a busca em ambiente de desenvolvimento
4. ⏳ Verificar logs do console para confirmar funcionamento
5. ⏳ Considerar ativar normalização durante o build se necessário

### 🐛 Troubleshooting

**Problema**: Busca não ignora acentos
- **Verificar**: Console do navegador para erros
- **Verificar**: Se o módulo está sendo carregado (procurar por logs)
- **Solução**: Verificar se `window.__docusaurus.pluginData['docusaurus-search-local']` existe

**Problema**: Múltiplos resultados duplicados
- **Causa**: Módulos antigos ainda ativos
- **Solução**: Remover módulos antigos do `docusaurus.config.js`

**Problema**: Busca muito lenta
- **Causa**: Múltiplas buscas sendo executadas
- **Solução**: Verificar se há múltiplos listeners ou interceptações

