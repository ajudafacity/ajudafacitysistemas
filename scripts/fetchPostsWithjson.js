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

function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
}

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
    const data = await client.request(query, { first: 100 });

    // Criar diretórios para categorias em docs e json
    data.categories.nodes.forEach((category) => {
      const docsPath = path.join(__dirname, '..', 'docs', sanitizeFileName(category.name));
      const jsonPath = path.join(__dirname, '..', 'json', sanitizeFileName(category.name));
      fs.ensureDirSync(docsPath);
      fs.ensureDirSync(jsonPath);
      console.log(`Diretórios criados para categoria: ${docsPath} e ${jsonPath}`);
    });

    let hasNextPage = true;
    let after = null;

    while (hasNextPage) {
      const postsData = await client.request(query, { first: 100, after });

      postsData.posts.nodes.forEach((post) => {
        const categoryName =
          post.categories.nodes.length > 0 ? post.categories.nodes[0].name : 'uncategorized';
        const docsPath = path.join(__dirname, '..', 'docs', sanitizeFileName(categoryName));
        const jsonPath = path.join(__dirname, '..', 'json', sanitizeFileName(categoryName));

        fs.ensureDirSync(docsPath);
        fs.ensureDirSync(jsonPath);

        // Criar arquivo MDX com HTML formatado
        const postTitle = sanitizeFileName(post.title);

          // Proteção para não sobrescrever intro.md
          if (postTitle === 'intro') {
            console.log(`Arquivo intro.md protegido. Ignorando.`);
            return;
          }

          
        const filePathMdx = path.join(docsPath, `${postTitle}.mdx`);

        const mdxContent = `---
title: "${post.title}"
---

<>
  <div dangerouslySetInnerHTML={{ __html: \`
    ${post.content
      .replace(/<img /g, '<img style="max-width: 100%; height: auto;" ')
      .replace(/<iframe /g, '<iframe style="width: 100%; height: auto; aspect-ratio: 16/9;" ')}
  \` }} />
</>`;

        fs.writeFileSync(filePathMdx, mdxContent);
        console.log(`Post salvo como MDX: ${filePathMdx}`);

        // Criar arquivo JSON com texto limpo
        const filePathJson = path.join(jsonPath, `${postTitle}.json`);

        const jsonContent = {
          title: post.title,
          content: removeHtml(post.content), // Remove tags HTML
          categories: post.categories.nodes.map((cat) => cat.name),
        };

        fs.writeJsonSync(filePathJson, jsonContent, { spaces: 2 });
        console.log(`Post salvo como JSON: ${filePathJson}`);
      });

      hasNextPage = postsData.posts.pageInfo.hasNextPage;
      after = postsData.posts.pageInfo.endCursor;
    }

    console.log('Posts importados com sucesso!');
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
  }
}

fetchPosts();
