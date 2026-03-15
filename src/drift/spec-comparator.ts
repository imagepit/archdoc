import type { LayerExtraction, ClassInfo, InterfaceInfo } from "../types/extracted.js";
import type { DriftResult, SpecDiff } from "../types/drift.js";

/**
 * 2つのレイヤー抽出スナップショットを比較し、仕様ドリフトを検出する。
 * @param layerName - レイヤー名
 * @param baseline - ベースライン（前回の抽出結果）
 * @param current - 現在の抽出結果
 * @returns ドリフト検出結果
 */
export function compareSpecs(
  layerName: string,
  baseline: LayerExtraction,
  current: LayerExtraction,
): DriftResult {
  const diffs: SpecDiff[] = [];

  compareEntitySets(
    "class",
    baseline.classes.map((c) => ({ name: c.name, data: c })),
    current.classes.map((c) => ({ name: c.name, data: c })),
    diffs,
  );

  compareEntitySets(
    "interface",
    baseline.interfaces.map((i) => ({ name: i.name, data: i })),
    current.interfaces.map((i) => ({ name: i.name, data: i })),
    diffs,
  );

  compareEntitySets(
    "function",
    baseline.functions.map((f) => ({ name: f.name, data: f })),
    current.functions.map((f) => ({ name: f.name, data: f })),
    diffs,
  );

  return {
    layerName,
    diffs,
    hasDrift: diffs.length > 0,
  };
}

interface Named<T> {
  name: string;
  data: T;
}

function compareEntitySets(
  entityType: "class" | "interface" | "function",
  baseline: Named<ClassInfo | InterfaceInfo | unknown>[],
  current: Named<ClassInfo | InterfaceInfo | unknown>[],
  diffs: SpecDiff[],
): void {
  const baselineMap = new Map(baseline.map((b) => [b.name, b.data]));
  const currentMap = new Map(current.map((c) => [c.name, c.data]));

  for (const [name] of currentMap) {
    if (!baselineMap.has(name)) {
      diffs.push({
        entityName: name,
        entityType,
        field: "entity",
        severity: "added",
        description: `New ${entityType} added: ${name}`,
      });
    }
  }

  for (const [name] of baselineMap) {
    if (!currentMap.has(name)) {
      diffs.push({
        entityName: name,
        entityType,
        field: "entity",
        severity: "removed",
        description: `${entityType} removed: ${name}`,
      });
    }
  }

  for (const [name, baseData] of baselineMap) {
    const currData = currentMap.get(name);
    if (!currData) continue;

    if (entityType === "class") {
      compareClassDetails(
        name,
        baseData as ClassInfo,
        currData as ClassInfo,
        diffs,
      );
    } else if (entityType === "interface") {
      compareInterfaceDetails(
        name,
        baseData as InterfaceInfo,
        currData as InterfaceInfo,
        diffs,
      );
    }
  }
}

function compareClassDetails(
  entityName: string,
  baseline: ClassInfo,
  current: ClassInfo,
  diffs: SpecDiff[],
): void {
  const baseMethodNames = new Set(baseline.methods.map((m) => m.name));
  const currMethodNames = new Set(current.methods.map((m) => m.name));

  for (const name of currMethodNames) {
    if (!baseMethodNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `method:${name}`,
        severity: "added",
        description: `New method added: ${name}`,
      });
    }
  }

  for (const name of baseMethodNames) {
    if (!currMethodNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `method:${name}`,
        severity: "removed",
        description: `Method removed: ${name}`,
      });
    }
  }

  for (const baseMethod of baseline.methods) {
    const currMethod = current.methods.find((m) => m.name === baseMethod.name);
    if (!currMethod) continue;

    if (baseMethod.signature !== currMethod.signature) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `method:${baseMethod.name}`,
        severity: "changed",
        designValue: baseMethod.signature,
        implementationValue: currMethod.signature,
        description: `Method signature changed: ${baseMethod.name}`,
      });
    }
  }

  const basePropNames = new Set(baseline.properties.map((p) => p.name));
  const currPropNames = new Set(current.properties.map((p) => p.name));

  for (const name of currPropNames) {
    if (!basePropNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `property:${name}`,
        severity: "added",
        description: `New property added: ${name}`,
      });
    }
  }

  for (const name of basePropNames) {
    if (!currPropNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `property:${name}`,
        severity: "removed",
        description: `Property removed: ${name}`,
      });
    }
  }

  for (const baseProp of baseline.properties) {
    const currProp = current.properties.find((p) => p.name === baseProp.name);
    if (!currProp) continue;

    if (baseProp.type !== currProp.type) {
      diffs.push({
        entityName,
        entityType: "class",
        field: `property:${baseProp.name}`,
        severity: "changed",
        designValue: baseProp.type,
        implementationValue: currProp.type,
        description: `Property type changed: ${baseProp.name}`,
      });
    }
  }
}

function compareInterfaceDetails(
  entityName: string,
  baseline: InterfaceInfo,
  current: InterfaceInfo,
  diffs: SpecDiff[],
): void {
  const baseMethodNames = new Set(baseline.methods.map((m) => m.name));
  const currMethodNames = new Set(current.methods.map((m) => m.name));

  for (const name of currMethodNames) {
    if (!baseMethodNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "interface",
        field: `method:${name}`,
        severity: "added",
        description: `New method added: ${name}`,
      });
    }
  }

  for (const name of baseMethodNames) {
    if (!currMethodNames.has(name)) {
      diffs.push({
        entityName,
        entityType: "interface",
        field: `method:${name}`,
        severity: "removed",
        description: `Method removed: ${name}`,
      });
    }
  }

  for (const baseMethod of baseline.methods) {
    const currMethod = current.methods.find((m) => m.name === baseMethod.name);
    if (!currMethod) continue;

    if (baseMethod.signature !== currMethod.signature) {
      diffs.push({
        entityName,
        entityType: "interface",
        field: `method:${baseMethod.name}`,
        severity: "changed",
        designValue: baseMethod.signature,
        implementationValue: currMethod.signature,
        description: `Method signature changed: ${baseMethod.name}`,
      });
    }
  }
}
