# 🧪 Como Testar a Busca Localmente

## ⚠️ Problema

A busca do Docusaurus só funciona após o build porque o índice é gerado durante o processo de build, não durante o desenvolvimento.

## ✅ Solução: Testar Localmente Após Build

### Passo 1: Fazer o Build

```bash
npm run build
```

Isso vai:
- Gerar o índice de busca
- Normalizar os textos no índice (remover acentos)
- Criar os arquivos estáticos em `build/`

### Passo 2: Servir o Build Localmente

```bash
npm run serve
```

Isso vai:
- Servir os arquivos do build em `http://localhost:3000`
- A busca vai funcionar normalmente porque o índice foi gerado

### Passo 3: Testar a Busca

1. Abra `http://localhost:3000` no navegador
2. Abra o console do navegador (F12)
3. Digite na busca termos **sem acentos**:
   - "usuario" → deve encontrar "usuário"
   - "configuracao" → deve encontrar "configuração"
   - "cadastro" → deve encontrar "cadastros"
   - "relatorio" → deve encontrar "relatórios"

4. Verifique os logs no console:
   - Deve aparecer: `🔍 Search normalizer: Input encontrado, inicializando...`
   - Deve aparecer: `✅ Search normalizer: FlexSearch interceptado`
   - Deve aparecer: `🔍 Search normalizer [index]: Query "usuario" -> "usuario", encontrou X resultados`

## 🔍 Verificando se Funcionou

### ✅ Sinais de que está funcionando:

1. **Console mostra logs de normalização**
2. **Busca encontra resultados mesmo sem acentos**
3. **Não há erros no console**

### ❌ Se não funcionar:

1. **Verifique se fez o build**: `npm run build`
2. **Verifique se está servindo o build**: `npm run serve` (não `npm start`)
3. **Verifique os logs do console** para erros
4. **Limpe o cache**: `npm run clear && npm run build`

## 🚀 Script Rápido para Testar

Crie um script no `package.json`:

```json
{
  "scripts": {
    "test-search": "npm run build && npm run serve"
  }
}
```

Depois execute:
```bash
npm run test-search
```

## 📝 Notas Importantes

- **`npm start`** = modo desenvolvimento (busca NÃO funciona)
- **`npm run build`** = gera os arquivos estáticos (gera o índice)
- **`npm run serve`** = serve os arquivos do build (busca FUNCIONA)

## 🔧 Como Funciona

1. **Durante o build**: O plugin `search-normalizer-plugin.js` normaliza todos os textos no índice
2. **No cliente**: O módulo `search-accent-normalizer.js` normaliza as queries de busca
3. **Resultado**: Buscas sem acentos encontram documentos com acentos porque ambos foram normalizados

