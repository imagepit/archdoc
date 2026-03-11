import { describe, it, expect, beforeAll } from "vitest";
import { Project } from "ts-morph";
import { extractClass } from "../../../src/extractor/class-extractor.js";
import { join } from "node:path";

const FIXTURES = join(import.meta.dirname, "../../fixtures/sample-project");

describe("extractClass", () => {
  let project: Project;

  beforeAll(() => {
    project = new Project({
      tsConfigFilePath: join(FIXTURES, "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
    project.addSourceFilesAtPaths(join(FIXTURES, "src/**/*.ts"));
  });

  it("extracts Order class with full metadata", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    expect(result.name).toBe("Order");
    expect(result.category).toBe("Entity");
    expect(result.isExported).toBe(true);
    expect(result.description).toContain("customer order");
  });

  it("extracts business rules from JSDoc", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    expect(result.businessRules).toHaveLength(2);
    expect(result.businessRules[0]).toContain("at least one line item");
  });

  it("extracts public and protected properties (not private)", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    const propNames = result.properties.map((p) => p.name);
    expect(propNames).toContain("id");
    expect(propNames).toContain("customerId");
    expect(propNames).toContain("status");
    // private items should not be included
    expect(propNames).not.toContain("items");
  });

  it("extracts methods with parameters and return types", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    const addItem = result.methods.find((m) => m.name === "addItem");
    expect(addItem).toBeDefined();
    expect(addItem!.parameters).toHaveLength(3);
    expect(addItem!.parameters[0].name).toBe("productId");
    expect(addItem!.returnType).toContain("Money");
  });

  it("extracts @throws from method JSDoc", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    const addItem = result.methods.find((m) => m.name === "addItem");
    expect(addItem!.throws).toHaveLength(1);
    expect(addItem!.throws[0].type).toBe("OrderNotEditableError");
  });

  it("extracts method-level business rules", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/entities/Order.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Order");
    const result = extractClass(classDecl, "Entity");

    const addItem = result.methods.find((m) => m.name === "addItem");
    expect(addItem!.businessRules).toHaveLength(1);
    expect(addItem!.businessRules[0]).toContain("Duplicate products");
  });

  it("extracts Money value object", () => {
    const sourceFile = project.getSourceFileOrThrow(
      join(FIXTURES, "src/domain/valueObjects/Money.ts"),
    );
    const classDecl = sourceFile.getClassOrThrow("Money");
    const result = extractClass(classDecl, "Value Object");

    expect(result.name).toBe("Money");
    expect(result.businessRules).toHaveLength(2);
    expect(result.properties).toHaveLength(2);
    expect(result.methods).toHaveLength(2);
  });
});
