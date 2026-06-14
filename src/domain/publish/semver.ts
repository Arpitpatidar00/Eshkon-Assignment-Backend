import type { DiffResult, SemVer, VersionBump } from "../types";

/**
 * Parse a SemVer string into its components.
 */
export function parseSemVer(version: string): SemVer {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid SemVer string: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format a SemVer object as a string.
 */
export function formatSemVer(ver: SemVer): string {
  return `${ver.major}.${ver.minor}.${ver.patch}`;
}

/**
 * Determine the version bump type from a diff result.
 *
 * Rules:
 * - Major: Section removed, section type changed, required property changed
 * - Minor: Section added, optional property added
 * - Patch: Text/property changes, URL changes
 * - None: No changes
 *
 * The highest bump wins when multiple change types exist.
 */
const REQUIRED_PROPS: Record<string, string[]> = {
  hero: ["title"],
  featureGrid: ["heading", "features"],
  testimonial: ["quote", "author"],
  cta: ["label", "url"],
};

export function determineVersionBump(diff: DiffResult): VersionBump {
  const hasRemovals = diff.removedSections.length > 0;
  const hasAdditions = diff.addedSections.length > 0;
  const hasModifications = diff.modifiedProps.length > 0;

  // No changes at all
  if (!hasRemovals && !hasAdditions && !hasModifications) {
    return "none";
  }

  // Major: removals always trigger major
  if (hasRemovals) {
    return "major";
  }

  let highestBump: VersionBump = "patch";

  // If there are additions, it's at least minor
  if (hasAdditions) {
    highestBump = "minor";
  }

  // Check modifications to see if any additions/removals of props raise the bump level
  if (hasModifications) {
    for (const mod of diff.modifiedProps) {
      const type = mod.sectionType;
      const reqFields = REQUIRED_PROPS[type] || [];
      for (const change of mod.changes) {
        const isAdded =
          change.oldValue === undefined && change.newValue !== undefined;
        const isRemoved =
          change.newValue === undefined && change.oldValue !== undefined;
        const isReq = reqFields.includes(change.key);

        if (isRemoved && isReq) {
          return "major"; // Breaking change
        }
        if (isAdded || isRemoved) {
          // Addition or removal of an optional property triggers minor
          if ((highestBump as string) !== "major") {
            highestBump = "minor";
          }
        }
      }
    }
  }

  return highestBump;
}

/**
 * Apply a version bump to a SemVer.
 */
export function applyBump(current: SemVer, bump: VersionBump): SemVer {
  switch (bump) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0 };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case "patch":
      return {
        major: current.major,
        minor: current.minor,
        patch: current.patch + 1,
      };
    case "none":
      return { ...current };
  }
}

/**
 * Calculate the next version from current version string and diff result.
 */
export function calculateNextVersion(
  currentVersion: string,
  diff: DiffResult,
): { version: string; bump: VersionBump } {
  const current = parseSemVer(currentVersion);
  const bump = determineVersionBump(diff);
  const next = applyBump(current, bump);
  return { version: formatSemVer(next), bump };
}
