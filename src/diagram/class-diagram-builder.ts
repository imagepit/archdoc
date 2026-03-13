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

  return buildDiagramFromItems(classes, interfaces);
}

export function buildCategoryClassDiagrams(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string[] {
  const exportedClasses = classes.filter((c) => c.isExported);
  const exportedInterfaces = interfaces.filter((i) => i.isExported);

  const total = exportedClasses.length + exportedInterfaces.length;
  if (total === 0) return [];

  // Single diagram per category with direction LR for vertical layout
  const diagram = buildDiagramFromItems(exportedClasses, exportedInterfaces);
  return diagram ? [diagram] : [];
}

function buildDiagramFromItems(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = ["classDiagram", "  direction LR"];

  for (const iface of interfaces) {
    renderInterfaceMembers(lines, iface);
  }

  for (const cls of classes) {
    renderClassMembers(lines, cls);
  }

  // Relationships
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

function renderInterfaceMembers(lines: string[], iface: InterfaceInfo): void {
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

function renderClassMembers(lines: string[], cls: ClassInfo): void {
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
  result = collapseObjectLiterals(result);

  result = result
    .replace(/</g, "~")
    .replace(/>/g, "~")
    .replace(/\|/g, " or ");

  return result;
}

function collapseObjectLiterals(type: string): string {
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
