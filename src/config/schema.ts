import { z } from "zod";

const layerTypeSchema = z.enum([
  "domain",
  "application",
  "presentation",
  "infrastructure",
  "custom",
]);

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
});

export const projectConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    description: z.string().default(""),
    sourceRoot: z.string().default("src"),
  }),
  layers: z.array(layerConfigSchema).min(1),
});
