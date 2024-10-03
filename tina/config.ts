import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  //clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  clientId: 'f353c34a-8ad1-44d3-8ffd-055046ae9f16',
  // Get this from tina.io
  //token: process.env.TINA_TOKEN,
  token: '79feba4d158bf377bc76d885c3fff6bff8fa7eca',

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  schema: {
    collections: [
      {
        name: "docs",
        label: "Docs",
        path: "docs",
        format: "md", // Aceita arquivos markdown
        match: {
          include: "**/*", // Inclui todos os arquivos e subpastas
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
