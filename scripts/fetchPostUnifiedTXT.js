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
    let allCategories = [];
    let allPosts = [];

    // Busca as categorias (usando a primeira requisição)
    const initialData = await client.request(query, { first: 100 });
    allCategories = initialData.categories.nodes.map((category) => category.name);

    let hasNextPage = true;
    let after = null;

    // Loop para buscar os posts paginados
    while (hasNextPage) {
      const postsData = await client.request(query, { first: 100, after });

      postsData.posts.nodes.forEach((post) => {
        allPosts.push({
          title: post.title,
          content: removeHtml(post.content),
          link: `https://blog.facity.com.br${post.uri}`,
          categories: post.categories.nodes.map((cat) => cat.name),
        });
      });

      hasNextPage = postsData.posts.pageInfo.hasNextPage;
      after = postsData.posts.pageInfo.endCursor;
    }

    // Monta o conteúdo do arquivo TXT
    let textOutput = 'BASE DE CONHECIMENTO\n\n';

    textOutput += 'Categorias:\n';
    allCategories.forEach((category) => {
      textOutput += `- ${category}\n`;
    });
    textOutput += '\n';

    textOutput += 'Posts:\n\n';
    allPosts.forEach((post) => {
      textOutput += `Título: ${post.title}\n`;
      textOutput += `Link: ${post.link}\n`;
      textOutput += `Categorias: ${post.categories.join(', ')}\n`;
      textOutput += `Conteúdo:\n${post.content}\n`;
      textOutput += '--------------------------------------------------\n\n';
    });

    // Salva o arquivo TXT consolidado
    const outputPath = path.join(__dirname, '..', 'output', 'knowledge-base.txt');
    fs.ensureDirSync(path.dirname(outputPath)); // Garante que o diretório existe
    fs.writeFileSync(outputPath, textOutput, 'utf-8');

    console.log(`Arquivo TXT consolidado salvo em: ${outputPath}`);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
  }
}

fetchPosts();
