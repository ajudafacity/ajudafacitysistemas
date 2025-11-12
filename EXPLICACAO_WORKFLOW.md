# 🔄 Como Funciona o Workflow do GitHub Actions

## 📊 Situação Atual

### Workflow Atual (`deploy.yml`)
O workflow atual **NÃO busca posts automaticamente**. Ele apenas:
1. ✅ Faz checkout do código
2. ✅ Instala dependências  
3. ✅ Faz build do site (`npm run build`)
4. ✅ Faz deploy para GitHub Pages

**Fluxo Manual Atual:**
```
1. Você executa localmente: npm run update-manual
   ↓ (Busca posts do blog WordPress)
   ↓ (Gera arquivos .mdx em docs/)
   
2. Você faz commit: git add . && git commit && git push
   ↓
   
3. Workflow executa automaticamente:
   - Checkout → Build → Deploy
   (usa os arquivos que você já commitou)
```

## 🚀 Opções de Automação

### Opção 1: Workflow com Busca Automática (Recomendado)

Criei um novo workflow (`deploy-auto-fetch.yml`) que:
- ✅ Busca posts automaticamente antes do build
- ✅ Pode ser acionado manualmente
- ✅ Pode executar em horários agendados (ex: diariamente)

**Como usar:**

1. **Renomear o workflow atual:**
   ```bash
   mv .github/workflows/deploy.yml .github/workflows/deploy-manual.yml
   ```

2. **Usar o novo workflow:**
   ```bash
   mv .github/workflows/deploy-auto-fetch.yml .github/workflows/deploy.yml
   ```

3. **Fazer commit:**
   ```bash
   git add .github/workflows/
   git commit -m "Atualizar workflow para buscar posts automaticamente"
   git push
   ```

### Opção 2: Manter Manual + Agendar Busca Separada

Criar um workflow separado apenas para buscar posts periodicamente:

```yaml
name: Atualizar Posts do Blog

on:
  schedule:
    - cron: '0 2 * * *' # Diariamente às 2h UTC
  workflow_dispatch: # Pode acionar manualmente

jobs:
  fetch-posts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20.9.0
      - run: npm ci
      - run: npm run update-manual
      - name: Commit e Push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add docs/ json/ output/
          git diff --staged --quiet || git commit -m "Auto-update: posts do blog"
          git push
```

## 📋 Comparação das Abordagens

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Manual (atual)** | ✅ Controle total<br>✅ Revisa antes de commitar | ❌ Precisa executar manualmente<br>❌ Pode esquecer de atualizar |
| **Automático no Deploy** | ✅ Sempre atualizado<br>✅ Automático | ❌ Pode fazer deploy mesmo sem mudanças<br>❌ Menos controle |
| **Agendado Separado** | ✅ Busca automática<br>✅ Deploy separado<br>✅ Mais controle | ❌ Dois workflows |

## 🎯 Recomendação

**Para começar:** Use a **Opção 1** (workflow com busca automática), pois:
- ✅ Mantém o site sempre atualizado
- ✅ Pode ser acionado manualmente quando necessário
- ✅ Pode agendar execuções automáticas
- ✅ Continua funcionando mesmo se a busca falhar (`continue-on-error: true`)

## ⚙️ Configuração do Schedule (Cron)

O workflow usa formato cron para agendar execuções:

```yaml
schedule:
  - cron: '0 2 * * *'  # Diariamente às 2h UTC
```

**Exemplos de horários:**
- `'0 2 * * *'` - Todo dia às 2h UTC (23h horário de Brasília)
- `'0 6 * * *'` - Todo dia às 6h UTC (3h horário de Brasília)
- `'0 0 * * 0'` - Todo domingo à meia-noite UTC
- `'0 */6 * * *'` - A cada 6 horas

**Converter horário:**
- UTC para Brasília: UTC - 3 horas (horário padrão) ou UTC - 2 horas (horário de verão)

## 🔍 Como Verificar Qual Workflow Está Ativo

```bash
# Listar workflows
ls .github/workflows/

# Ver conteúdo
cat .github/workflows/deploy.yml
```

## 💡 Dicas

1. **Testar localmente primeiro:**
   ```bash
   npm run update-manual
   npm run build
   npm start
   ```

2. **Verificar mudanças antes de commitar:**
   ```bash
   git status
   git diff docs/
   ```

3. **Logs do workflow:**
   - Acesse: https://github.com/ajudafacity/ajudafacitysistemas/actions
   - Clique no workflow para ver logs detalhados

4. **Acionar manualmente:**
   - Vá em Actions → Selecione o workflow → "Run workflow"

