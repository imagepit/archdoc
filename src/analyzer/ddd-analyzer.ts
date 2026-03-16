import type { LayerExtraction, DddRole, DddWarning } from "../types/extracted.js";

const EXTENDS_PATTERNS: [RegExp, DddRole][] = [
  [/^Entity$/i, "entity"],
  [/^ValueObject$/i, "valueObject"],
  [/^DomainError$/i, "domainError"],
  [/^Error$/i, "domainError"],
];

const CLASS_NAME_PATTERNS: [RegExp, DddRole][] = [
  [/Service$/, "domainService"],
];

const INTERFACE_NAME_PATTERNS: [RegExp, DddRole][] = [
  [/Repository$/, "repository"],
];

/**
 * Classify DDD roles for classes and interfaces in a domain layer extraction.
 * Only applies to layers with type "domain". Mutates extraction in place.
 */
export function classifyDddRoles(extraction: LayerExtraction, layerType: string): void {
  if (layerType !== "domain") return;

  // Phase 1: Direct classification
  for (const cls of extraction.classes) {
    if (cls.extendsClass) {
      cls.dddRole = matchPatterns(cls.extendsClass, EXTENDS_PATTERNS);
    }
    if (!cls.dddRole) {
      cls.dddRole = matchPatterns(cls.name, CLASS_NAME_PATTERNS);
    }
  }

  for (const iface of extraction.interfaces) {
    iface.dddRole = matchPatterns(iface.name, INTERFACE_NAME_PATTERNS);
  }

  // Phase 2: Inheritance chain resolution (2 passes for up to 2-level chains)
  for (let pass = 0; pass < 2; pass++) {
    const roleMap = new Map<string, DddRole>();
    for (const cls of extraction.classes) {
      if (cls.dddRole) {
        roleMap.set(cls.name, cls.dddRole);
      }
    }

    for (const cls of extraction.classes) {
      if (!cls.dddRole && cls.extendsClass && roleMap.has(cls.extendsClass)) {
        cls.dddRole = roleMap.get(cls.extendsClass);
      }
    }
  }
}

/**
 * Check for DDD structural violations and return warnings.
 * Only applies to layers with type "domain".
 */
export function checkDddWarnings(extraction: LayerExtraction, layerType: string): DddWarning[] {
  if (layerType !== "domain") return [];

  const warnings: DddWarning[] = [];

  for (const cls of extraction.classes) {
    if (!cls.dddRole) continue;

    switch (cls.dddRole) {
      case "entity": {
        const idProp = cls.properties.find((p) => p.name === "id");
        if (idProp && !idProp.isReadonly) {
          warnings.push({
            componentName: cls.name,
            filePath: cls.filePath,
            role: cls.dddRole,
            warningType: "mutableEntityId",
            propertyName: "id",
          });
        }
        break;
      }
      case "valueObject": {
        for (const prop of cls.properties) {
          if (!prop.isReadonly) {
            warnings.push({
              componentName: cls.name,
              filePath: cls.filePath,
              role: cls.dddRole,
              warningType: "mutableValueObjectProperty",
              propertyName: prop.name,
            });
          }
        }
        break;
      }
      case "domainService": {
        for (const prop of cls.properties) {
          if (!prop.isReadonly) {
            warnings.push({
              componentName: cls.name,
              filePath: cls.filePath,
              role: cls.dddRole,
              warningType: "statefulDomainService",
              propertyName: prop.name,
            });
          }
        }
        break;
      }
    }
  }

  return warnings;
}

function matchPatterns(value: string, patterns: [RegExp, DddRole][]): DddRole | undefined {
  for (const [pattern, role] of patterns) {
    if (pattern.test(value)) return role;
  }
  return undefined;
}
