import chalk from "chalk";
import type { DriftResult } from "../types/drift.js";

export function formatDriftReport(result: DriftResult): string {
  const lines: string[] = [];

  lines.push(chalk.bold(`\n  ${result.layerName}: ${result.diffs.length} drift(s) detected`));
  lines.push("");

  for (const diff of result.diffs) {
    const icon =
      diff.severity === "added"
        ? chalk.green("+")
        : diff.severity === "removed"
          ? chalk.red("-")
          : chalk.yellow("~");

    lines.push(`    ${icon} [${diff.entityType}] ${diff.description}`);

    if (diff.designValue && diff.implementationValue) {
      lines.push(chalk.gray(`      baseline: ${diff.designValue}`));
      lines.push(chalk.gray(`      current:  ${diff.implementationValue}`));
    }
  }

  return lines.join("\n");
}

export function formatDriftReportMd(result: DriftResult): string {
  const lines: string[] = [];

  lines.push(`## ${result.layerName}`);
  lines.push("");

  if (!result.hasDrift) {
    lines.push("No drift detected.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(`| Entity | Type | Field | Change | Description |`);
  lines.push(`| --- | --- | --- | --- | --- |`);

  for (const diff of result.diffs) {
    lines.push(
      `| ${diff.entityName} | ${diff.entityType} | ${diff.field} | ${diff.severity} | ${diff.description} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}
