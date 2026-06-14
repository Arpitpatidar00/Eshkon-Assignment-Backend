import type { DiffResult } from "../types";

/**
 * Generate a human-readable changelog from a diff result.
 */
export function generateChangelog(
  version: string,
  diff: DiffResult
): string {
  const lines: string[] = [`Version ${version}`, ""];

  // Added sections
  if (diff.addedSections.length > 0) {
    lines.push("Added:");
    for (const section of diff.addedSections) {
      lines.push(`- ${formatSectionType(section.type)} Section (${section.id})`);
    }
  } else {
    lines.push("Added:");
    lines.push("- None");
  }
  lines.push("");

  // Modified sections
  if (diff.modifiedProps.length > 0) {
    lines.push("Modified:");
    for (const mod of diff.modifiedProps) {
      const changeKeys = mod.changes.map((c) => c.key).join(", ");
      lines.push(
        `- ${formatSectionType(mod.sectionType)} Section (${mod.sectionId}): ${changeKeys}`
      );
    }
  } else {
    lines.push("Modified:");
    lines.push("- None");
  }
  lines.push("");

  // Removed sections
  if (diff.removedSections.length > 0) {
    lines.push("Removed:");
    for (const section of diff.removedSections) {
      lines.push(`- ${formatSectionType(section.type)} Section (${section.id})`);
    }
  } else {
    lines.push("Removed:");
    lines.push("- None");
  }

  return lines.join("\n");
}

/**
 * Format a section type for display.
 */
function formatSectionType(type: string): string {
  const mapping: Record<string, string> = {
    hero: "Hero",
    featureGrid: "Feature Grid",
    testimonial: "Testimonial",
    cta: "CTA",
  };
  return mapping[type] || type;
}
