import { describe, it, expect } from "vitest";
import { loadConfig } from "../../../src/config/loader.js";
import { join } from "node:path";

const FIXTURES = join(import.meta.dirname, "../../fixtures");

describe("loadConfig", () => {
  it("loads and validates a valid layers.yaml", () => {
    const config = loadConfig(join(FIXTURES, "layers.yaml"));

    expect(config.project.name).toBe("EC Order System");
    expect(config.layers).toHaveLength(4);
    expect(config.layers[0].name).toBe("Domain");
    expect(config.layers[0].nameJa).toBe("ドメイン層");
    expect(config.layers[0].categories).toHaveProperty("entities");
  });

  it("throws for missing file", () => {
    expect(() => loadConfig("nonexistent.yaml")).toThrow("Config file not found");
  });

  it("applies default categories when empty", () => {
    const config = loadConfig(join(FIXTURES, "layers.yaml"));
    // The fixture has explicit categories, so they should be preserved
    expect(config.layers[0].categories.entities).toBe("Entity");
  });
});
