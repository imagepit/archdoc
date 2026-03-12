import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
} from "../types/extracted.js";

export function buildClassDiagram(extraction: LayerExtraction): string {
  const classes = extraction.classes.filter((c) => c.isExported);
  const interfaces = extraction.interfaces.filter((i) => i.isExported);

  if (classes.length === 0 && interfaces.length === 0) {
    return "";
  }

  const lines: string[] = ["classDiagram"];

  for (const iface of interfaces) {
    lines.push(`  class ${iface.name} {`);
    lines.push(`    <<interface>>`);
    for (const prop of iface.properties) {
      lines.push(`    +${prop.name}: ${sanitizeType(prop.type)}`);
    }
    for (const method of iface.methods) {
      lines.push(`    +${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
    }
    lines.push("  }");
  }

  for (const cls of classes) {
    lines.push(`  class ${cls.name} {`);
    for (const prop of cls.properties) {
      const vis = visibilityPrefix(prop.visibility);
      lines.push(`    ${vis}${prop.name}: ${sanitizeType(prop.type)}`);
    }
    for (const method of cls.methods) {
      const vis = visibilityPrefix(method.visibility);
      lines.push(`    ${vis}${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
    }
    lines.push("  }");
  }

  const allNames = new Set([
    ...classes.map((c) => c.name),
    ...interfaces.map((i) => i.name),
  ]);

  for (const cls of classes) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${cls.extendsClass} <|-- ${cls.name}`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${impl} <|.. ${cls.name}`);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${ext} <|-- ${iface.name}`);
      }
    }
  }

  return lines.join("\n");
}

export function buildCategoryClassDiagram(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  const exported = [
    ...classes.filter((c) => c.isExported),
    ...interfaces.filter((i) => i.isExported),
  ];

  if (exported.length === 0) return "";

  const lines: string[] = ["classDiagram"];

  for (const item of exported) {
    const isInterface = !("methods" in item && "businessRules" in item);
    const iface = isInterface ? (item as InterfaceInfo) : null;
    const cls = isInterface ? null : (item as ClassInfo);

    lines.push(`  class ${item.name} {`);
    if (iface) {
      lines.push(`    <<interface>>`);
      for (const prop of iface.properties) {
        lines.push(`    +${prop.name}: ${sanitizeType(prop.type)}`);
      }
      for (const method of iface.methods) {
        lines.push(`    +${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
      }
    }
    if (cls) {
      for (const prop of cls.properties) {
        const vis = visibilityPrefix(prop.visibility);
        lines.push(`    ${vis}${prop.name}: ${sanitizeType(prop.type)}`);
      }
      for (const method of cls.methods) {
        const vis = visibilityPrefix(method.visibility);
        lines.push(`    ${vis}${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
      }
    }
    lines.push("  }");
  }

  const allNames = new Set(exported.map((e) => e.name));

  for (const cls of classes.filter((c) => c.isExported)) {
    if (cls.extendsClass && allNames.has(cls.extendsClass)) {
      lines.push(`  ${cls.extendsClass} <|-- ${cls.name}`);
    }
    for (const impl of cls.implementsInterfaces) {
      if (allNames.has(impl)) {
        lines.push(`  ${impl} <|.. ${cls.name}`);
      }
    }
  }

  for (const iface of interfaces.filter((i) => i.isExported)) {
    for (const ext of iface.extendsInterfaces) {
      if (allNames.has(ext)) {
        lines.push(`  ${ext} <|-- ${iface.name}`);
      }
    }
  }

  return lines.join("\n");
}

function visibilityPrefix(vis: "public" | "protected" | "private"): string {
  switch (vis) {
    case "public":
      return "+";
    case "protected":
      return "#";
    case "private":
      return "-";
  }
}

function sanitizeType(type: string): string {
  let result = type.replace(/\n/g, " ");

  // Collapse object literals like { foo: string; bar: number } → Object
  // Must run before < > replacement to handle nested generics with objects
  result = collapseObjectLiterals(result);

  result = result
    .replace(/</g, "~")
    .replace(/>/g, "~")
    .replace(/\|/g, " or ");

  return result;
}

function collapseObjectLiterals(type: string): string {
  // Replace object type literals { ... } with "Object"
  // Handle nested braces by iterating from inside out
  let result = type;
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/\{[^{}]*\}/g, "Object");
  }
  return result;
}

function formatParams(
  params: { name: string; type: string }[],
): string {
  if (params.length === 0) return "";
  return params
    .map((p) => `${p.name}`)
    .join(", ");
}
