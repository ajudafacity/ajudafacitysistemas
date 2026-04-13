# 🔍 Instruções para Debug da Busca

## ⚠️ Se a busca ainda não funcionar após fazer build

### Passo 1: Verificar se o plugin está processando arquivos

Execute o build e verifique os logs:

```bash
npm run clear
npm run build 2>&1 | grep -i "search normalizer"
```

**Deve aparecer**:
```
🔍 Search normalizer: Processando assets para normalização...
✅ Search normalizer: Índice "..." normalizado
✅ Search normalizer: X arquivo(s) normalizado(s)
```

**Se não aparecer**: O plugin não está encontrando os arquivos de índice.

### Passo 2: Verificar estrutura do índice no build

Após fazer build, verifique se os arquivos foram modificados:

```bash
# Windows PowerShell
Get-ChildItem -Path "build" -Recurse -Filter "*search*" | Select-Object FullName

# Verifique um arquivo manualmente
# Abra um arquivo search-index-*.json e veja se os textos estão sem acentos
```

### Passo 3: Verificar no console do navegador

Abra o site, abra o console (F12) e execute:

```javascript
// 1. Verificar se o módulo está carregado
console.log('Módulo carregado:', typeof window.__docusaurus !== 'undefined');

// 2. Verificar plugin data
const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
console.log('Plugin data:', pluginData);

// 3. Verificar índices
const indexes = pluginData?.indexes || pluginData?.index;
console.log('Indexes:', indexes);
console.log('Tipo:', Array.isArray(indexes) ? 'array' : typeof indexes);

// 4. Verificar se tem método search
if (indexes) {
  const index = Array.isArray(indexes) ? indexes[0] : indexes;
  console.log('Index tem search?', typeof index?.search === 'function');
  
  // 5. Testar busca manualmente
  if (typeof index?.search === 'function') {
    const results = index.search('usuario');
    console.log('Resultados para "usuario":', results);
  }
}

// 6. Verificar normalização
function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
console.log('Normalização teste:', normalizeText('usuário')); // Deve retornar "usuario"
```

### Passo 4: Verificar logs do módulo

No console, deve aparecer:

```
🔍 Search normalizer: Inicializando (modo agressivo)...
✅ Search normalizer: Input value interceptado diretamente
✅ Search normalizer: Eventos de input interceptados
✅ Search normalizer: FlexSearch encontrado, envolvendo...
✅ Search normalizer: Índice "index[0]" envolvido
✅ Search normalizer: X índice(s) envolvido(s)
```

**Se não aparecer**: O módulo não está sendo carregado ou não está encontrando o FlexSearch.

### Passo 5: Testar busca manualmente no console

```javascript
// Interceptar busca manualmente
const pluginData = window.__docusaurus?.pluginData?.['docusaurus-search-local'];
const indexes = pluginData?.indexes || pluginData?.index;
const index = Array.isArray(indexes) ? indexes[0] : indexes;

if (index && typeof index.search === 'function') {
  // Testar busca normalizada
  function normalizeText(text) {
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  
  const query = 'usuario';
  const normalizedQuery = normalizeText(query);
  console.log(`Buscando "${query}" (normalizado: "${normalizedQuery}")`);
  
  const results = index.search(normalizedQuery);
  console.log('Resultados:', results);
}
```

## 🐛 Problemas Comuns

### Problema: Plugin não processa arquivos

**Solução**: 
1. Verifique se o plugin está ativado no `docusaurus.config.js`
2. Verifique se os arquivos de índice existem no build
3. Tente fazer build limpo: `npm run clear && npm run build`

### Problema: Módulo não intercepta FlexSearch

**Solução**:
1. Verifique se o módulo está sendo carregado (veja logs no console)
2. Verifique a estrutura do `pluginData` (pode ser diferente do esperado)
3. Tente aumentar o timeout no código

### Problema: Busca não encontra resultados

**Solução**:
1. Verifique se o índice foi normalizado (textos devem estar sem acentos)
2. Verifique se a query está sendo normalizada (veja logs)
3. Teste busca manualmente no console

## 📝 Informações para Compartilhar

Se ainda não funcionar, compartilhe:

1. **Logs do build** (especialmente linhas com "search normalizer")
2. **Logs do console** do navegador
3. **Resultado do teste manual** no console (passo 5)
4. **Estrutura do pluginData** (resultado do passo 3)

Isso vai ajudar a identificar exatamente onde está o problema.

