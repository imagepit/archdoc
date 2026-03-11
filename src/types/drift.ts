export type DriftSeverity = "added" | "removed" | "changed";

export interface SpecDiff {
  entityName: string;
  entityType: "class" | "interface" | "function";
  field: string;
  severity: DriftSeverity;
  designValue?: string;
  implementationValue?: string;
  description: string;
}

export interface DriftResult {
  layerName: string;
  diffs: SpecDiff[];
  hasDrift: boolean;
}
