# 🧪 Guia de Teste da Busca

## ✅ Versão Atual (Modo Seguro)

A solução atual foi simplificada para **não interferir** com a busca normal:

1. **Busca normal funciona primeiro** - Se encontrar resultados com a query original, retorna normalmente
2. **Fallback normalizado** - Apenas se não encontrar resultados, tenta com query normalizada
3. **Não modifica o índice** - Plugin de build desabilitado para evitar quebrar a busca
4. **Não intercepta input** - Apenas adiciona listener para logs

## 🧪 Como Testar

### 1. Limpar e fazer build

```bash
npm run clear
npm run build
```

### 2. Servir o build

```bash
npm run serve
```

### 3. Abrir no navegador

Abra `http://localhost:3000` e abra o console (F12)

### 4. Testar buscas

#### Teste 1: Busca normal (deve funcionar)
- Digite: "cadastro"
- **Esperado**: Encontra resultados normalmente
- **Console**: Não deve mostrar logs de normalização

#### Teste 2: Busca com acento (deve funcionar)
- Digite: "cadastros" ou "usuário"
- **Esperado**: Encontra resultados normalmente
- **Console**: Não deve mostrar logs de normalização

#### Teste 3: Busca sem acento procurando palavra com acento
- Digite: "usuario" (sem acento)
- **Esperado**: 
  - Primeiro tenta busca normal (pode não encontrar)
  - Depois tenta normalizada (deve encontrar "usuário")
- **Console**: Deve mostrar: `🔍 Search normalizer: "usuario" -> "usuario", encontrou X resultados`

#### Teste 4: Busca parcial
- Digite: "usuari" (parcial)
- **Esperado**: Deve encontrar resultados relacionados a "usuário"

## 🔍 Verificando Logs

### Logs Esperados no Console:

```
🔍 Search normalizer: Inicializando (modo seguro - não interfere com busca normal)...
✅ Search normalizer: FlexSearch encontrado, envolvendo índices...
✅ Search normalizer: Índice "index[0]" envolvido com segurança
✅ Search normalizer: 1 índice(s) configurado(s) com sucesso
```

### Quando buscar sem acento:

```
🔍 Search normalizer: Buscando "usuario" (será normalizado para "usuario" se necessário)
🔍 Search normalizer: "usuario" -> "usuario", encontrou X resultados
```

## ⚠️ Se Não Funcionar

### Problema: Busca normal não funciona mais

**Causa**: Algo está interferindo com o FlexSearch

**Solução**:
1. Verifique se há erros no console
2. Desabilite temporariamente o módulo comentando no `docusaurus.config.js`
3. Faça build novamente

### Problema: Busca normal funciona mas sem acento não funciona

**Causa**: O FlexSearch pode não estar sendo interceptado corretamente

**Solução**:
1. Verifique os logs do console
2. Execute no console: `window.__docusaurus.pluginData['docusaurus-search-local']`
3. Verifique a estrutura dos índices

### Problema: Nenhum log aparece

**Causa**: Módulo não está sendo carregado

**Solução**:
1. Verifique se o módulo está no `docusaurus.config.js`
2. Limpe cache: `npm run clear`
3. Faça build novamente: `npm run build`

## 📝 Teste Manual no Console

Execute no console do navegador:

```javascript
// 1. Verificar se plugin está disponível
const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
console.log('Plugin data:', pluginData);

// 2. Verificar índices
const indexes = pluginData?.indexes || pluginData?.index;
console.log('Indexes:', indexes);

// 3. Testar busca manual
if (indexes && Array.isArray(indexes) && indexes[0]) {
  const index = indexes[0];
  const results = index.search('usuario');
  console.log('Resultados para "usuario":', results);
}

// 4. Testar normalização
function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
console.log('Normalização:', normalizeText('usuário')); // Deve retornar "usuario"
```

## ✅ Checklist

- [ ] Build completo sem erros
- [ ] Console mostra logs de inicialização
- [ ] Busca normal funciona (ex: "cadastro")
- [ ] Busca com acento funciona (ex: "usuário")
- [ ] Busca sem acento encontra palavras com acento (ex: "usuario" -> "usuário")
- [ ] Não há erros no console

## 🎯 Resultado Esperado

A busca deve funcionar **exatamente como antes** para buscas normais, mas **adicionalmente** deve encontrar resultados quando você busca sem acentos palavras que têm acentos.

Se a busca normal parou de funcionar, algo está errado e precisa ser corrigido antes de adicionar a funcionalidade de normalização.

