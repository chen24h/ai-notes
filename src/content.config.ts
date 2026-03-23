import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const sourceSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  url: z.string().url(),
  accessedAt: z.string(),
  note: z.string().optional(),
});

const factSchema = z.object({
  claim: z.string(),
  evidence: z.string(),
  source: z.string().url(),
  confidence: z.enum(["high", "medium", "low"]),
  boundary: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    status: z.enum(["draft", "published"]).default("draft"),
    tags: z.array(z.string()).default([]),
    category: z.enum(["signal", "card", "theme", "essay", "project"]),
    truthStandard: z
      .string()
      .default("Only publish what can be verified through primary or clearly attributed sources."),
    thesis: z.string(),
    sources: z.array(sourceSchema).min(1),
    facts: z.array(factSchema).min(1),
  }),
});

export const collections = { posts };
