import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/chapters' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      nav: z.string(),
      order: z.number(),
      words: z.number(),
      minutes: z.number(),
      cover: image().optional(),
      coverOnly: z.boolean().optional(),
      achievement: z.string().optional(),
      chartCaption: z.string().optional(),
      source: z.string(),
    }),
});

const crises = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/crises' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      order: z.number(),
      ano: z.number(),
      mes: z.number(),
      local: z.string(),
      tipo: z.enum(['mania', 'depressao', 'intro']),
      seguidaDe: z.enum(['depressao']).optional(),
      nota: z.string().optional(),
      image: image().optional(),
      extraImage: image().optional(),
    }),
});

const parts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/parts' }),
  schema: z.object({ chapter: z.string(), order: z.number() }),
});

export const collections = { chapters, crises, parts };
