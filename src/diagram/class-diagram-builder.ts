import type {
  LayerExtraction,
  ClassInfo,
  InterfaceInfo,
} from "../types/extracted.js";

const MAX_MEMBERS_PER_CLASS = 6;
const MAX_CLASSES_PER_DIAGRAM = 5;

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

  if (total <= MAX_CLASSES_PER_DIAGRAM) {
    const diagram = buildDiagramFromItems(exportedClasses, exportedInterfaces);
    return diagram ? [diagram] : [];
  }

  // Split into groups, keeping related items (via extends/implements) together
  const groups = splitIntoRelatedGroups(exportedClasses, exportedInterfaces);
  const diagrams: string[] = [];

  for (const group of groups) {
    const diagram = buildDiagramFromItems(group.classes, group.interfaces);
    if (diagram) {
      diagrams.push(diagram);
    }
  }

  return diagrams;
}

interface ItemGroup {
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
}

function splitIntoRelatedGroups(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): ItemGroup[] {
  // Build a union-find to group related items
  const nameToItem = new Map<string, ClassInfo | InterfaceInfo>();
  for (const c of classes) nameToItem.set(c.name, c);
  for (const i of interfaces) nameToItem.set(i.name, i);

  const parent = new Map<string, string>();
  const allNames = [...nameToItem.keys()];
  for (const name of allNames) parent.set(name, name);

  function find(x: string): string {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  }

  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Union related items
  for (const cls of classes) {
    if (cls.extendsClass && nameToItem.has(cls.extendsClass)) {
      union(cls.name, cls.extendsClass);
    }
    for (const impl of cls.implementsInterfaces) {
      if (nameToItem.has(impl)) {
        union(cls.name, impl);
      }
    }
  }

  for (const iface of interfaces) {
    for (const ext of iface.extendsInterfaces) {
      if (nameToItem.has(ext)) {
        union(iface.name, ext);
      }
    }
  }

  // Collect groups
  const groupMap = new Map<string, ItemGroup>();
  for (const name of allNames) {
    const root = find(name);
    if (!groupMap.has(root)) {
      groupMap.set(root, { classes: [], interfaces: [] });
    }
    const item = nameToItem.get(name)!;
    const group = groupMap.get(root)!;
    if ("businessRules" in item) {
      group.classes.push(item as ClassInfo);
    } else {
      group.interfaces.push(item as InterfaceInfo);
    }
  }

  // Split large groups, then consolidate small groups into chunks
  const splitGroups: ItemGroup[] = [];
  for (const group of groupMap.values()) {
    const size = group.classes.length + group.interfaces.length;
    if (size <= MAX_CLASSES_PER_DIAGRAM) {
      splitGroups.push(group);
    } else {
      const allItems: Array<{ type: "class" | "interface"; item: ClassInfo | InterfaceInfo }> = [
        ...group.classes.map((c) => ({ type: "class" as const, item: c })),
        ...group.interfaces.map((i) => ({ type: "interface" as const, item: i })),
      ];
      for (let i = 0; i < allItems.length; i += MAX_CLASSES_PER_DIAGRAM) {
        const chunk = allItems.slice(i, i + MAX_CLASSES_PER_DIAGRAM);
        splitGroups.push({
          classes: chunk.filter((x) => x.type === "class").map((x) => x.item as ClassInfo),
          interfaces: chunk.filter((x) => x.type === "interface").map((x) => x.item as InterfaceInfo),
        });
      }
    }
  }

  // Merge small groups together until they reach MAX_CLASSES_PER_DIAGRAM
  const result: ItemGroup[] = [];
  let current: ItemGroup = { classes: [], interfaces: [] };
  let currentSize = 0;

  for (const group of splitGroups) {
    const groupSize = group.classes.length + group.interfaces.length;
    if (currentSize + groupSize > MAX_CLASSES_PER_DIAGRAM && currentSize > 0) {
      result.push(current);
      current = { classes: [], interfaces: [] };
      currentSize = 0;
    }
    current.classes.push(...group.classes);
    current.interfaces.push(...group.interfaces);
    currentSize += groupSize;
  }

  if (currentSize > 0) {
    result.push(current);
  }

  return result;
}

function buildDiagramFromItems(
  classes: ClassInfo[],
  interfaces: InterfaceInfo[],
): string {
  if (classes.length === 0 && interfaces.length === 0) return "";

  const lines: string[] = ["classDiagram"];

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

  let count = 0;
  const total = iface.properties.length + iface.methods.length;

  for (const prop of iface.properties) {
    if (count >= MAX_MEMBERS_PER_CLASS) {
      lines.push(`    +... ${total - count} more`);
      break;
    }
    lines.push(`    +${prop.name}: ${sanitizeType(prop.type)}`);
    count++;
  }

  for (const method of iface.methods) {
    if (count >= MAX_MEMBERS_PER_CLASS) {
      lines.push(`    +... ${total - count} more`);
      break;
    }
    lines.push(`    +${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
    count++;
  }

  lines.push("  }");
}

function renderClassMembers(lines: string[], cls: ClassInfo): void {
  lines.push(`  class ${cls.name} {`);

  let count = 0;
  const total = cls.properties.length + cls.methods.length;

  for (const prop of cls.properties) {
    if (count >= MAX_MEMBERS_PER_CLASS) {
      lines.push(`    ... ${total - count} more`);
      break;
    }
    const vis = visibilityPrefix(prop.visibility);
    lines.push(`    ${vis}${prop.name}: ${sanitizeType(prop.type)}`);
    count++;
  }

  for (const method of cls.methods) {
    if (count >= MAX_MEMBERS_PER_CLASS) {
      lines.push(`    ... ${total - count} more`);
      break;
    }
    const vis = visibilityPrefix(method.visibility);
    lines.push(`    ${vis}${method.name}(${formatParams(method.parameters)}) ${sanitizeType(method.returnType)}`);
    count++;
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
