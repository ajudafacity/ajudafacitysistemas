const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs-extra');
const path = require('path');
const { convert } = require('html-to-text');

const DEFAULT_ENDPOINT = 'https://manual.facity.com.br/graphql';
const DEFAULT_OUT = path.join(__dirname, '..', 'output', 'knowledge-base.md');
const DEFAULT_FIRST = 100;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!key.startsWith('--')) continue;
    if (next && !next.startsWith('--')) {
      args[key.slice(2)] = next;
      i += 1;
    } else {
      args[key.slice(2)] = true;
    }
  }
  return args;
}

function escapeForHeading(text) {
  return String(text ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function removeHtmlToText(html) {
  // Converte HTML do GraphQL em texto puro para ficar amigável para o GPT.
  return convert(html || '', {
    wordwrap: false,
    selectors: [{ selector: 'img', format: 'skip' }],
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const endpoint = args.endpoint || DEFAULT_ENDPOINT;
  const outPath = args.out || DEFAULT_OUT;
  const first = args.first ? Number(args.first) : DEFAULT_FIRST;

  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetPostsAndCategories($first: Int, $after: String) {
      posts(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          title
          content
          uri
          categories {
            nodes {
              name
            }
          }
        }
      }
      categories {
        nodes {
          name
        }
      }
    }
  `;

  console.log(`Buscando posts no endpoint: ${endpoint}`);
  console.log(`Saida: ${outPath}`);
  console.log(`Lote (first): ${first}`);

  const initialData = await client.request(query, { first: first });

  const allCategories = initialData.categories?.nodes?.map((c) => c.name) || [];
  const allPosts = [];

  let hasNextPage = true;
  let after = null;
  while (hasNextPage) {
    const postsData = await client.request(query, { first: first, after });

    for (const post of postsData.posts.nodes) {
      const categories = post.categories?.nodes?.map((c) => c.name) || [];
      const contentText = normalizeText(removeHtmlToText(post.content));

      allPosts.push({
        title: post.title,
        link: post.uri ? `https://manual.facity.com.br${post.uri}` : '',
        categories,
        contentText,
      });
    }

    hasNextPage = postsData.posts.pageInfo.hasNextPage;
    after = postsData.posts.pageInfo.endCursor;
  }

  let md = `# Base de conhecimento (Blog - Ajuda Facity Sistemas)\n\n`;
  md += `_Gerado em: ${new Date().toISOString()}_\n\n`;

  md += `## Categorias\n\n`;
  if (allCategories.length === 0) {
    md += `- (nenhuma)\n\n`;
  } else {
    md += allCategories.map((c) => `- ${escapeForHeading(c)}`).join('\n');
    md += '\n\n';
  }

  md += `## Artigos\n`;

  for (const post of allPosts) {
    md += `\n---\n\n`;
    md += `## ${escapeForHeading(post.title)}\n\n`;
    md += `- **Link:** ${post.link || '(sem link)'}\n`;
    md += `- **Categorias:** ${post.categories.length > 0 ? post.categories.join(', ') : 'uncategorized'}\n\n`;
    md += `${post.contentText}\n`;
  }

  fs.ensureDirSync(path.dirname(outPath));
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`Arquivo MD consolidado gerado com sucesso em: ${outPath}`);
}

main().catch((err) => {
  console.error('Erro ao gerar conhecimento em MD:', err);
  process.exitCode = 1;
});

