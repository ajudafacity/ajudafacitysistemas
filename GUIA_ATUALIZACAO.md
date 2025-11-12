# 📚 Guia de Atualização do Manual

Este guia explica como atualizar o manual do Facity Sistemas puxando os artigos do blog WordPress.

## 🎯 Processo de Atualização

O projeto possui scripts que buscam automaticamente os artigos do blog WordPress (`https://blog.facity.com.br`) via GraphQL e os convertem em arquivos MDX para o Docusaurus.

## 📋 Scripts Disponíveis

### 1. **Atualizar Manual Completo** (Recomendado)
```bash
npm run update-manual
# ou
yarn update-manual
```

Este script:
- ✅ Busca todos os posts do blog WordPress
- ✅ Cria arquivos `.mdx` na pasta `docs/` organizados por categoria
- ✅ Cria arquivos `.json` na pasta `json/` com o conteúdo limpo (sem HTML)
- ✅ Organiza os arquivos automaticamente por categoria

### 2. **Atualizar apenas MDX** (Sem JSON)
```bash
npm run fetch-posts
# ou
yarn fetch-posts
```

Este script cria apenas os arquivos `.mdx` na pasta `docs/`.

### 3. **Gerar Base de Conhecimento JSON Unificada**
```bash
npm run fetch-unified-json
# ou
yarn fetch-unified-json
```

Gera um único arquivo `output/knowledge-base.json` com todos os posts consolidados.

### 4. **Gerar Base de Conhecimento TXT Unificada**
```bash
npm run fetch-unified-txt
# ou
yarn fetch-unified-txt
```

Gera um único arquivo `output/knowledge-base.txt` com todos os posts em formato texto.

## 🚀 Passo a Passo para Atualizar o Manual

### Passo 1: Instalar Dependências (se necessário)
```bash
npm install
# ou
yarn install
```

### Passo 2: Executar o Script de Atualização
```bash
npm run update-manual
# ou
yarn update-manual
```

O script irá:
1. Conectar ao GraphQL do blog WordPress
2. Buscar todas as categorias disponíveis
3. Buscar todos os posts (com paginação automática)
4. Criar/atualizar os arquivos `.mdx` em `docs/[categoria]/`
5. Criar/atualizar os arquivos `.json` em `json/[categoria]/`

### Passo 3: Verificar os Arquivos Gerados
Os arquivos serão criados automaticamente nas seguintes estruturas:

```
docs/
  ├── cadastros/
  │   ├── como-aceitar-pedido-do-aplicativo-.mdx
  │   └── ...
  ├── configuracoes/
  │   ├── como-configurar-horario-de-atendimento-.mdx
  │   └── ...
  └── ...

json/
  ├── cadastros/
  │   ├── como-aceitar-pedido-do-aplicativo-.json
  │   └── ...
  └── ...
```

### Passo 4: Testar Localmente
```bash
npm start
# ou
yarn start
```

Acesse `http://localhost:3000` para verificar se tudo está funcionando corretamente.

### Passo 5: Build e Deploy (quando estiver pronto)
```bash
# Build
npm run build
# ou
yarn build

# Deploy
npm run deploy
# ou
yarn deploy
```

## ⚙️ Como Funciona

### Fonte de Dados
- **Endpoint GraphQL**: `https://blog.facity.com.br/graphql`
- Os scripts fazem queries GraphQL para buscar posts e categorias

### Processamento
1. **Sanitização de Nomes**: Os títulos são convertidos em nomes de arquivo válidos (sem acentos, espaços viram hífens)
2. **Organização por Categoria**: Cada post é salvo na pasta correspondente à sua categoria
3. **Formatação MDX**: O conteúdo HTML é preservado dentro de componentes React usando `dangerouslySetInnerHTML`
4. **Proteção**: O arquivo `intro.md` é protegido e não será sobrescrito

### Estrutura dos Arquivos MDX Gerados

```mdx
---
title: "Título do Artigo"
---

<>
  <div dangerouslySetInnerHTML={{ __html: `
    [Conteúdo HTML do post aqui]
  ` }} />
</>
```

## 🔍 Verificação e Troubleshooting

### Verificar se os Posts Foram Atualizados
```bash
# Contar arquivos MDX em docs
find docs -name "*.mdx" | wc -l

# Ver últimas modificações
ls -lt docs/*/*.mdx | head -10
```

### Problemas Comuns

1. **Erro de Conexão GraphQL**
   - Verifique se o blog WordPress está acessível
   - Verifique a URL do endpoint em `scripts/fetchPostsWithjson.js`

2. **Arquivos Não Aparecem no Site**
   - Execute `npm run clear` para limpar o cache
   - Reinicie o servidor de desenvolvimento

3. **Categorias Não Reconhecidas**
   - O Docusaurus gera a sidebar automaticamente
   - Verifique se os arquivos estão nas pastas corretas em `docs/`

## 📝 Notas Importantes

- ⚠️ **Backup**: Sempre faça backup antes de executar os scripts, especialmente se houver alterações manuais nos arquivos
- 🔄 **Sobrescrita**: Os scripts **sobrescrevem** arquivos existentes com o mesmo nome
- 🛡️ **Proteção**: O arquivo `intro.md` é protegido e não será sobrescrito
- 📁 **Organização**: Os arquivos são organizados automaticamente por categoria do WordPress

## 🔄 Fluxo de Trabalho Recomendado

1. **Desenvolvimento**: Faça alterações manuais nos arquivos `.mdx` quando necessário
2. **Sincronização**: Execute `npm run update-manual` periodicamente para sincronizar com o blog
3. **Teste**: Sempre teste localmente com `npm start` antes de fazer deploy
4. **Deploy**: Quando estiver satisfeito, faça o build e deploy

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas:
- Verifique os logs do script para identificar erros
- Consulte a documentação do Docusaurus: https://docusaurus.io
- Entre em contato com a equipe de desenvolvimento

