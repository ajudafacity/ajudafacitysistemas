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

async function fetchPosts() {
  try {
    const data = await client.request(query, { first: 100 });

    data.categories.nodes.forEach((category) => {
      const categoryPath = path.join(__dirname, '..', 'docs', sanitizeFileName(category.name));
      fs.ensureDirSync(categoryPath);
      console.log(`Diretório criado para categoria: ${categoryPath}`);
    });

    let hasNextPage = true;
    let after = null;

    while (hasNextPage) {
      const postsData = await client.request(query, { first: 100, after });

      postsData.posts.nodes.forEach((post) => {
        const categoryName =
          post.categories.nodes.length > 0 ? post.categories.nodes[0].name : 'uncategorized';
        const categoryPath = path.join(__dirname, '..', 'docs', sanitizeFileName(categoryName));

        fs.ensureDirSync(categoryPath);

        const postTitle = sanitizeFileName(post.title);

         // Proteção para não sobrescrever intro.md
         if (postTitle === 'intro') {
          console.log(`Arquivo intro.md protegido. Ignorando.`);
          return;
        }

        // O WhatsApp monta prévia usando `meta name="description"` / `og:description`.
        // Como os MDX começam com `dangerouslySetInnerHTML`, precisamos garantir um resumo em TEXTO PURO.
        const descriptionRaw = removeHtmlAndNormalize(post.content);
        const description = descriptionRaw.length > 160 ? `${descriptionRaw.slice(0, 157)}...` : descriptionRaw;
        const descriptionEscaped = escapeYamlDoubleQuotes(description);

        const filePath = path.join(categoryPath, `${postTitle}.mdx`);

        const content = `---
title: "${escapeYamlDoubleQuotes(post.title)}"
description: "${descriptionEscaped}"
---

<>
  <div dangerouslySetInnerHTML={{ __html: \`
    ${post.content
      .replace(/<img /g, '<img style="max-width: 100%; height: auto;" ')
      .replace(/<iframe /g, '<iframe style="width: 100%; height: auto; aspect-ratio: 16/9;" ')}
  \` }} />
</>`;

        fs.writeFileSync(filePath, content);
        console.log(`Post salvo: ${filePath}`);
      });

      hasNextPage = postsData.posts.pageInfo.hasNextPage;
      after = postsData.posts.pageInfo.endCursor;
    }

    console.log('Posts importados com sucesso!');
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
  }
}

function sanitizeFileName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

function removeHtmlAndNormalize(html) {
  return convert(html || '', {
    wordwrap: false,
    selectors: [{ selector: 'img', format: 'skip' }],
  })
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeYamlDoubleQuotes(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

fetchPosts();