import { describe, it, expect } from "vitest";
import { projectConfigSchema } from "../../../src/config/schema.js";

describe("projectConfigSchema", () => {
  it("validates a complete config", () => {
    const config = {
      project: {
        name: "Test Project",
        description: "A test project",
        sourceRoot: "src",
      },
      layers: [
        {
          name: "Domain",
          nameJa: "ドメイン層",
          path: "src/domain",
          type: "domain",
          description: "Domain layer",
          responsibility: "Business rules",
          forbiddenImports: ["src/infrastructure"],
          categories: { entities: "Entity" },
        },
      ],
    };

    const result = projectConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const config = {
      project: { name: "Test" },
      layers: [
        {
          name: "Domain",
          nameJa: "ドメイン層",
          path: "src/domain",
          type: "domain",
        },
      ],
    };

    const result = projectConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.sourceRoot).toBe("src");
      expect(result.data.layers[0].forbiddenImports).toEqual([]);
      expect(result.data.layers[0].categories).toEqual({});
    }
  });

  it("rejects invalid layer type", () => {
    const config = {
      project: { name: "Test" },
      layers: [
        {
          name: "Domain",
          nameJa: "ドメイン層",
          path: "src/domain",
          type: "invalid",
        },
      ],
    };

    const result = projectConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects empty layers array", () => {
    const config = {
      project: { name: "Test" },
      layers: [],
    };

    const result = projectConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects missing project name", () => {
    const config = {
      project: {},
      layers: [
        {
          name: "Domain",
          nameJa: "ドメイン層",
          path: "src/domain",
          type: "domain",
        },
      ],
    };

    const result = projectConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
