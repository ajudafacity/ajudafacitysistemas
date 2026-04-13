const { GraphQLClient, gql } = require('graphql-request');
const fs = require('fs-extra');
const path = require('path');
const { convert } = require('html-to-text');

const endpoint = 'https://manual.facity.com.br/graphql';
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
        const normalizedContent = normalizeContentHtml(post.content);
        const descriptionRaw = removeHtmlAndNormalize(normalizedContent);
        const description = descriptionRaw.length > 160 ? `${descriptionRaw.slice(0, 157)}...` : descriptionRaw;
        const descriptionEscaped = escapeYamlDoubleQuotes(description);

        const filePath = path.join(categoryPath, `${postTitle}.mdx`);

        const content = `---
title: "${escapeYamlDoubleQuotes(post.title)}"
description: "${descriptionEscaped}"
---

<>
  <div dangerouslySetInnerHTML={{ __html: \`
    ${normalizedContent}
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

function addOrMergeStyle(tag, requiredStyle) {
  if (/style\s*=/i.test(tag)) {
    return tag.replace(/style\s*=\s*"([^"]*)"/i, (m, styleContent) => {
      const trimmed = String(styleContent || '').trim();
      const requiredTokens = requiredStyle
        .split(';')
        .map((token) => token.trim())
        .filter(Boolean);
      const hasAllRequired = requiredTokens.every((token) => trimmed.includes(token));
      if (hasAllRequired) {
        return m;
      }
      const sep = trimmed.length > 0 && !trimmed.endsWith(';') ? '; ' : '';
      return `style="${trimmed}${sep}${requiredStyle}"`;
    });
  }
  return tag.replace(/<([a-z0-9-]+)/i, `<$1 style="${requiredStyle}"`);
}

function normalizeContentHtml(html) {
  let normalized = String(html || '');

  // Segurança de migração: evita voltar ao domínio antigo ao sincronizar com WP.
  normalized = normalized.replace(/https?:\/\/blog\.facity\.com\.br/gi, 'https://manual.facity.com.br');

  // Compatibilidade com plugins de lazy-load do WP que trocam src/srcset por data-src/data-srcset.
  normalized = normalized
    .replace(/\sdata-srcset=/gi, ' srcset=')
    .replace(/\sdata-src=/gi, ' src=');

  normalized = normalized.replace(/<img\b[^>]*>/gi, (imgTag) =>
    addOrMergeStyle(imgTag, 'max-width: 100%; height: auto;')
  );
  normalized = normalized.replace(/<iframe\b[^>]*>/gi, (iframeTag) =>
    addOrMergeStyle(iframeTag, 'width: 100%; height: auto; aspect-ratio: 16/9;')
  );

  return normalized;
}

fetchPosts();