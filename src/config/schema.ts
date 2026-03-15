import { z } from "zod";

const layerTypeSchema = z.enum([
  "domain",
  "application",
  "presentation",
  "infrastructure",
  "custom",
]);

const categoryOverrideSchema = z.object({
  pattern: z.string().min(1),
  category: z.string().min(1),
});

const layerConfigSchema = z.object({
  name: z.string().min(1),
  nameJa: z.string().min(1),
  path: z.string().min(1),
  type: layerTypeSchema,
  description: z.string().default(""),
  responsibility: z.string().default(""),
  forbiddenImports: z.array(z.string()).default([]),
  categories: z.record(z.string()).default({}),
  dependsOn: z.array(z.string()).optional(),
  categoryOverrides: z.array(categoryOverrideSchema).optional(),
  framework: z.string().optional(),
});

/** layers.yamlプロジェクト設定のバリデーション用Zodスキーマ。 */
export const projectConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    sourceRoot: z.string().default("src"),
    locale: z.enum(["en", "ja"]).default("en"),
  }),
  layers: z.array(layerConfigSchema).min(1),
});
