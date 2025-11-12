const https = require('https');

console.log('🔍 Verificando status do deploy...\n');

const repo = 'ajudafacity/ajudafacitysistemas';
const apiUrl = `https://api.github.com/repos/${repo}/actions/runs?per_page=1`;

console.log('📊 Último workflow do GitHub Actions:\n');

https.get(apiUrl, {
  headers: {
    'User-Agent': 'Node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.workflow_runs && response.workflow_runs.length > 0) {
        const run = response.workflow_runs[0];
        const status = run.status;
        const conclusion = run.conclusion;
        const createdAt = new Date(run.created_at).toLocaleString('pt-BR');
        
        console.log(`📝 Commit: ${run.head_commit?.message || 'N/A'}`);
        console.log(`🕐 Criado em: ${createdAt}`);
        console.log(`📊 Status: ${status}`);
        console.log(`✅ Conclusão: ${conclusion || 'Em andamento...'}`);
        console.log(`🔗 URL: ${run.html_url}\n`);
        
        if (conclusion === 'success') {
          console.log('✅ Deploy concluído com sucesso!');
          console.log('🌐 Site: https://manual.facitydelivery.com');
        } else if (conclusion === 'failure') {
          console.log('❌ Deploy falhou. Verifique os logs no GitHub Actions.');
        } else {
          console.log('⏳ Deploy ainda em andamento...');
        }
      } else {
        console.log('⚠️ Nenhum workflow encontrado.');
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error.message);
      console.log('\n💡 Acesse manualmente: https://github.com/ajudafacity/ajudafacitysistemas/actions');
    }
  });
}).on('error', (error) => {
  console.error('❌ Erro ao conectar:', error.message);
  console.log('\n💡 Acesse manualmente: https://github.com/ajudafacity/ajudafacitysistemas/actions');
  console.log('🌐 Site: https://manual.facitydelivery.com');
});

