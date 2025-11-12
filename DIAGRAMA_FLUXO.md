# 📊 Diagrama de Fluxo - Como Funciona o Deploy

## 🔄 Fluxo ATUAL (Manual)

```
┌─────────────────────────────────────────────────────────┐
│  VOCÊ (Localmente)                                     │
│                                                         │
│  1. npm run update-manual                              │
│     ↓                                                   │
│     Conecta ao blog WordPress via GraphQL              │
│     ↓                                                   │
│     Busca todos os posts                               │
│     ↓                                                   │
│     Gera arquivos .mdx em docs/[categoria]/           │
│     Gera arquivos .json em json/[categoria]/           │
│                                                         │
│  2. git add .                                          │
│  3. git commit -m "Atualização"                        │
│  4. git push origin main                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  GITHUB (Recebe o push)                                 │
│                                                         │
│  GitHub Actions detecta push na branch 'main'           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW EXECUTA (deploy.yml)                         │
│                                                         │
│  1. Checkout do código                                  │
│     (pega os arquivos .mdx que você commitou)          │
│                                                         │
│  2. npm install                                         │
│     (instala dependências)                              │
│                                                         │
│  3. npm run build                                       │
│     (gera HTML estático na pasta build/)                │
│                                                         │
│  4. Deploy para GitHub Pages                            │
│     (publica em manual.facitydelivery.com)              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  SITE PUBLICADO                                         │
│                                                         │
│  https://manual.facitydelivery.com                     │
│  (com os posts que você baixou e commitou)              │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Fluxo AUTOMATIZADO (Proposto)

```
┌─────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (Agendado ou Manual)                    │
│                                                         │
│  Workflow aciona automaticamente:                       │
│  - Por schedule (ex: diariamente às 2h)                │
│  - Ou manualmente via "Run workflow"                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW EXECUTA (deploy-auto-fetch.yml)               │
│                                                         │
│  1. Checkout do código                                  │
│                                                         │
│  2. npm install                                         │
│                                                         │
│  3. npm run update-manual  ← NOVO!                     │
│     ↓                                                   │
│     Busca posts do blog WordPress                       │
│     ↓                                                   │
│     Gera arquivos .mdx                                  │
│                                                         │
│  4. Commit automático (se houver mudanças)              │
│                                                         │
│  5. npm run build                                       │
│                                                         │
│  6. Deploy para GitHub Pages                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  SITE PUBLICADO (Sempre atualizado!)                    │
│                                                         │
│  https://manual.facitydelivery.com                     │
│  (com posts mais recentes do blog)                      │
└─────────────────────────────────────────────────────────┘
```

## 🔑 Diferenças Principais

| Aspecto | Fluxo Manual | Fluxo Automatizado |
|---------|--------------|-------------------|
| **Busca de Posts** | Você executa localmente | Workflow executa automaticamente |
| **Commit** | Você faz manualmente | Workflow faz automaticamente |
| **Frequência** | Quando você lembrar | Agendado (ex: diariamente) |
| **Controle** | Total | Automático (pode revisar depois) |

## 💡 Quando Usar Cada Um?

### Use Manual se:
- ✅ Quer revisar posts antes de publicar
- ✅ Quer controle total sobre quando atualizar
- ✅ Posts não mudam com frequência

### Use Automatizado se:
- ✅ Quer que o site sempre esteja atualizado
- ✅ Posts são adicionados frequentemente no blog
- ✅ Quer menos trabalho manual

