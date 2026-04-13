/**
 * Script de teste para verificar se a normalização de busca está funcionando
 * Execute: node scripts/test-search-normalization.js
 */

function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Simula um índice de busca
const mockIndex = [
  { t: 'usuário', c: 'Como cadastrar um usuário', url: '/docs/usuario' },
  { t: 'configuração', c: 'Configuração do sistema', url: '/docs/configuracao' },
  { t: 'cadastro', c: 'Cadastro de produtos', url: '/docs/cadastro' },
];

// Simula busca do FlexSearch
function mockSearch(query, index) {
  const normalizedQuery = normalizeText(query);
  return index.filter(doc => {
    const titleNormalized = normalizeText(doc.t);
    const contentNormalized = normalizeText(doc.c);
    return titleNormalized.includes(normalizedQuery) || 
           contentNormalized.includes(normalizedQuery) ||
           doc.t.includes(query) || 
           doc.c.includes(query);
  });
}

// Testes
console.log('🧪 Testando normalização de busca...\n');

// Teste 1: Busca sem acento encontra palavra com acento
console.log('Teste 1: Buscar "usuario" (sem acento) deve encontrar "usuário"');
const results1 = mockSearch('usuario', mockIndex);
console.log(`Resultados: ${results1.length}`);
console.log(`✅ ${results1.length > 0 ? 'PASSOU' : 'FALHOU'}: Encontrou ${results1.length} resultado(s)`);
results1.forEach(r => console.log(`   - ${r.t}`));
console.log('');

// Teste 2: Busca com acento encontra palavra sem acento
console.log('Teste 2: Buscar "usuário" (com acento) deve encontrar "usuario"');
const results2 = mockSearch('usuário', mockIndex);
console.log(`Resultados: ${results2.length}`);
console.log(`✅ ${results2.length > 0 ? 'PASSOU' : 'FALHOU'}: Encontrou ${results2.length} resultado(s)`);
results2.forEach(r => console.log(`   - ${r.t}`));
console.log('');

// Teste 3: Busca parcial
console.log('Teste 3: Buscar "usuari" (parcial) deve encontrar "usuário"');
const results3 = mockSearch('usuari', mockIndex);
console.log(`Resultados: ${results3.length}`);
console.log(`✅ ${results3.length > 0 ? 'PASSOU' : 'FALHOU'}: Encontrou ${results3.length} resultado(s)`);
results3.forEach(r => console.log(`   - ${r.t}`));
console.log('');

// Teste 4: Busca normal deve funcionar
console.log('Teste 4: Buscar "cadastro" (normal) deve encontrar "cadastro"');
const results4 = mockSearch('cadastro', mockIndex);
console.log(`Resultados: ${results4.length}`);
console.log(`✅ ${results4.length > 0 ? 'PASSOU' : 'FALHOU'}: Encontrou ${results4.length} resultado(s)`);
results4.forEach(r => console.log(`   - ${r.t}`));
console.log('');

// Teste 5: Normalização de texto
console.log('Teste 5: Verificar função normalizeText');
const tests = [
  { input: 'usuário', expected: 'usuario' },
  { input: 'configuração', expected: 'configuracao' },
  { input: 'CADASTRO', expected: 'cadastro' },
  { input: '  espaços  ', expected: 'espacos' },
];

let allPassed = true;
tests.forEach(({ input, expected }) => {
  const result = normalizeText(input);
  const passed = result === expected;
  console.log(`   "${input}" -> "${result}" ${passed ? '✅' : '❌'} (esperado: "${expected}")`);
  if (!passed) allPassed = false;
});

console.log(`\n${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);

