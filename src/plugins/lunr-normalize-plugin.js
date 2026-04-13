/**
 * Plugin para adicionar normalização de acentos ao pipeline do Lunr
 * PATCH no processo de build do @easyops-cn/docusaurus-search-local
 */

const Module = require('module');
const originalRequire = Module.prototype.require;

// Função de normalização
function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Patch no Lunr quando for carregado
Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  // Se for o Lunr sendo carregado pelo plugin de busca
  if (id === 'lunr' && !module.__patched) {
    console.log('🔧 Patching Lunr.js para adicionar normalização...');
    
    // Marca como patched
    module.__patched = true;
    
    // Cria função de normalização para o pipeline
    const normalizer = function(token) {
      if (typeof token.update === 'function') {
        return token.update(normalizeText);
      } else {
        return normalizeText(token);
      }
    };
    
    // Registra no pipeline do Lunr
    module.Pipeline.registerFunction(normalizer, 'normalizer');
    
    // Sobrescreve a função de build do índice
    const originalBuilder = module.Builder;
    module.Builder = function() {
      const builder = new originalBuilder();
      
      // Adiciona normalização ao pipeline ANTES do stemmer
      const originalBuild = builder.build;
      builder.build = function() {
        // Adiciona normalização no início do pipeline
        if (!this.pipeline._stack.some(fn => fn.label === 'normalizer')) {
          this.pipeline.before(module.stemmer, normalizer);
        }
        
        // Também adiciona no search pipeline
        if (this.searchPipeline && !this.searchPipeline._stack.some(fn => fn.label === 'normalizer')) {
          this.searchPipeline.before(module.stemmer, normalizer);
        }
        
        console.log('✅ Normalização adicionada ao pipeline do Lunr');
        return originalBuild.call(this);
      };
      
      return builder;
    };
    
    // Copia propriedades estáticas
    Object.keys(originalBuilder).forEach(key => {
      module.Builder[key] = originalBuilder[key];
    });
    
    console.log('✅ Lunr.js patched com sucesso!');
  }
  
  return module;
};

module.exports = function lunrNormalizePlugin(context, options) {
  return {
    name: 'lunr-normalize-plugin',
    
    // Executa antes de tudo
    async loadContent() {
      console.log('🔍 Plugin de normalização do Lunr carregado');
      return null;
    },
  };
};

