// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ajuda Facity Sistemas',
  tagline: 'Ajuda Facity Sistemas',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  //url: 'https://ajudafacity.github.io',
  url: 'https://manual.facitydelivery.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ajudafacity', // Usually your GitHub org/user name.
  projectName: 'ajudafacitysistemas', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  trailingSlash: false,                 // Remove a barra no final das URLs
  deploymentBranch: 'gh-pages',         // Branch usada para deploy

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR','en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/ajudafacity/ajudafacitysistemas/edit/main/',
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/ajudafacity/ajudafacitysistemas/edit/main/blog/',
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: 'warn',
        //   onInlineAuthors: 'warn',
        //   onUntruncatedBlogPosts: 'warn',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [
    // Plugin de busca local melhorado
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ["pt", "en"],
        // Configurações avançadas para busca melhorada
        indexBlog: false, // Não indexar blog se não estiver usando
        indexPages: false, // Não indexar páginas se não necessário
        // Configurações do FlexSearch para busca fuzzy e tolerante a erros
        searchResultLimits: 20, // Limite de resultados
        searchResultContextMaxLength: 50, // Contexto máximo nos resultados
        explicitSearchResultPath: true,
      },
    ],
    // Plugin customizado para melhorar busca (normalização de acentos)
    function(context, options) {
      return {
        name: 'search-enhancer-plugin',
        getClientModules() {
          return [require.resolve('./src/client-modules/search-enhancer.js')];
        },
      };
    },
  ],
  // themes: [
  //   ['@docusaurus/theme-classic', {customCss: [require.resolve('./src/css/custom.css')]}],
  //   '@easyops-cn/docusaurus-search-local',
  // ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/facity-social-card.jpg',
      navbar: {
        //title: 'Ajuda Facity Sistemas',
        logo: {
          alt: 'Ajuda Facity Sistemas',
          src: 'img/logo.svg',
          srcDark: 'img/logowhite.svg', // Logo para o modo escuro
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'tutorialSidebar',
          //   position: 'left',
          //   label: 'Tutorial',
          // },
          // {to: '/blog', label: 'Blog', position: 'left'},
          // {
          //   href: 'https://github.com/facebook/docusaurus',
          //   label: 'GitHub',
          //   position: 'right',
          // },         
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Redes',
            items: [
              {
                label: 'Nosso site',
                href: 'https://www.facity.com.br',
              },
              {
                label: 'Facebook',
                href: 'https://www.facebook.com/facitysistemas',
              },
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/facitysistemas/',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                href: 'https://blog.facity.com.br',
              },
              // {
              //   label: 'GitHub',
              //   href: 'https://github.com/facebook/docusaurus',
              // },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
