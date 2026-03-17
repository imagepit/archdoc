import { MarkdownBuilder } from "./markdown-builder.js";
import { basename } from "node:path";
import type { ResponsibilityViolation } from "../analyzer/nextjs-responsibility-checker.js";

/** Severity display labels. */
const SEVERITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Rule display labels (en). */
const RULE_LABELS_EN: Record<string, string> = {
  "app-to-infra": "App → Infrastructure Direct Dependency",
  "app-to-domain": "App → Domain Direct Dependency",
  "fetch-in-app": "Direct fetch() in App Layer",
  "di-in-app": "DI Assembly in Page/Layout",
};

/** Rule display labels (ja). */
const RULE_LABELS_JA: Record<string, string> = {
  "app-to-infra": "App → Infrastructure 直接依存",
  "app-to-domain": "App → Domain 直接依存",
  "fetch-in-app": "App層での直接fetch()",
  "di-in-app": "Page/LayoutでのDI組み立て",
};

/**
 * Generate a Markdown section for Next.js responsibility separation violations.
 * Returns empty string if no violations found.
 */
export function generateResponsibilitySection(
  violations: ResponsibilityViolation[],
  locale: "en" | "ja" = "en",
): string {
  if (violations.length === 0) return "";

  const md = new MarkdownBuilder();
  const ruleLabels = locale === "ja" ? RULE_LABELS_JA : RULE_LABELS_EN;

  const title = locale === "ja"
    ? "Next.js 責務分離チェック"
    : "Next.js Responsibility Separation Check";

  md.heading(3, title);

  const summaryText = locale === "ja"
    ? `${violations.length}件の責務分離違反が検出されました。`
    : `${violations.length} responsibility separation violation(s) detected.`;
  md.paragraph(summaryText);

  // Group by rule
  const grouped = new Map<string, ResponsibilityViolation[]>();
  for (const v of violations) {
    const group = grouped.get(v.rule) ?? [];
    group.push(v);
    grouped.set(v.rule, group);
  }

  const headerFile = locale === "ja" ? "ファイル" : "File";
  const headerDetail = locale === "ja" ? "詳細" : "Detail";
  const headerRecommendation = locale === "ja" ? "推奨" : "Recommendation";
  const headerSeverity = locale === "ja" ? "深刻度" : "Severity";

  for (const [rule, ruleViolations] of grouped) {
    const ruleLabel = ruleLabels[rule] ?? rule;
    md.heading(4, `${ruleLabel}（${ruleViolations.length}件）`);

    md.table(
      [headerSeverity, headerFile, headerDetail, headerRecommendation],
      ruleViolations.map((v) => [
        SEVERITY_LABELS[v.severity] ?? v.severity,
        `\`${basename(v.filePath)}\``,
        v.detail,
        v.recommendation,
      ]),
    );
  }

  return md.build();
}
