import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, BASE } from './src/config.ts';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap()],
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
  markdown: {
    syntaxHighlight: false,
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
