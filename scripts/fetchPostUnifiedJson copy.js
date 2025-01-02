const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs-extra');
const path = require('path');
const { convert } = require('html-to-text');

const endpoint = 'https://blog.facity.com.br/graphql';
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

function removeHtml(content) {
  return convert(content, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' }, // Ignora imagens, se necessário
    ],
  });
}

async function fetchPosts() {
  try {
    // Inicializa a estrutura para armazenar todos os posts e categorias
    const consolidatedData = {
      categories: [],
      posts: [],
    };

    // Busca categorias
    const initialData = await client.request(query, { first: 100 });
    consolidatedData.categories = initialData.categories.nodes.map((category) => category.name);

    let hasNextPage = true;
    let after = null;

    // Loop para buscar posts paginados
    while (hasNextPage) {
      const postsData = await client.request(query, { first: 100, after });

      // Adiciona os posts à estrutura consolidada
      postsData.posts.nodes.forEach((post) => {
        consolidatedData.posts.push({
          title: post.title,
          content: removeHtml(post.content), // Remove tags HTML
          categories: post.categories.nodes.map((cat) => cat.name),
        });
      });

      hasNextPage = postsData.posts.pageInfo.hasNextPage;
      after = postsData.posts.pageInfo.endCursor;
    }

    // Salva o arquivo JSON consolidado
    const outputPath = path.join(__dirname, '..', 'output', 'knowledge-base.json');
    fs.ensureDirSync(path.dirname(outputPath)); // Garante que o diretório existe
    fs.writeJsonSync(outputPath, consolidatedData, { spaces: 2 });

    console.log(`Arquivo consolidado salvo em: ${outputPath}`);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
  }
}

fetchPosts();
