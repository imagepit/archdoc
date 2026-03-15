/** 仕様ドリフト検出の重大度レベル。 */
export type DriftSeverity = "added" | "removed" | "changed";

/** 2つの仕様スナップショット間で検出された単一の差分。 */
export interface SpecDiff {
  entityName: string;
  entityType: "class" | "interface" | "function";
  field: string;
  severity: DriftSeverity;
  designValue?: string;
  implementationValue?: string;
  description: string;
}

/** レイヤーのドリフト検出結果。 */
export interface DriftResult {
  layerName: string;
  diffs: SpecDiff[];
  hasDrift: boolean;
}
