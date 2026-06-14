import type { Page, DiffResult, SectionType } from "../types";

/**
 * Deterministic diff engine that compares a published page with a draft page.
 * Returns structured diff information used for SemVer calculation and changelog generation.
 */
export function diffPages(
  published: Page | null,
  draft: Page
): DiffResult {
  // If no published version exists, everything in the draft is new
  if (!published) {
    return {
      addedSections: draft.sections.map((s) => ({
        id: s.id,
        type: s.type as SectionType,
      })),
      removedSections: [],
      modifiedProps: [],
    };
  }

  const publishedMap = new Map(
    published.sections.map((s) => [s.id, s])
  );
  const draftMap = new Map(
    draft.sections.map((s) => [s.id, s])
  );

  // Find added sections (in draft but not in published)
  const addedSections = draft.sections
    .filter((s) => !publishedMap.has(s.id))
    .map((s) => ({ id: s.id, type: s.type as SectionType }));

  // Find removed sections (in published but not in draft)
  const removedSections = published.sections
    .filter((s) => !draftMap.has(s.id))
    .map((s) => ({ id: s.id, type: s.type as SectionType }));

  // Find modified sections (in both, but with different props or type)
  const modifiedProps: DiffResult["modifiedProps"] = [];

  for (const draftSection of draft.sections) {
    const publishedSection = publishedMap.get(draftSection.id);
    if (!publishedSection) continue;

    // Check if section type changed (this is a major change handled separately)
    if (publishedSection.type !== draftSection.type) {
      // Type change is treated as remove + add
      removedSections.push({
        id: publishedSection.id,
        type: publishedSection.type as SectionType,
      });
      addedSections.push({
        id: draftSection.id,
        type: draftSection.type as SectionType,
      });
      continue;
    }

    // Deep compare props
    const changes = compareProps(publishedSection.props, draftSection.props);
    if (changes.length > 0) {
      modifiedProps.push({
        sectionId: draftSection.id,
        sectionType: draftSection.type as SectionType,
        changes,
      });
    }
  }

  return { addedSections, removedSections, modifiedProps };
}

/**
 * Compares two prop objects and returns a list of changes.
 */
function compareProps(
  oldProps: Record<string, unknown>,
  newProps: Record<string, unknown>
): { key: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { key: string; oldValue: unknown; newValue: unknown }[] = [];
  const allKeys = new Set([
    ...Object.keys(oldProps),
    ...Object.keys(newProps),
  ]);

  for (const key of allKeys) {
    const oldVal = oldProps[key];
    const newVal = newProps[key];

    if (!deepEqual(oldVal, newVal)) {
      changes.push({ key, oldValue: oldVal, newValue: newVal });
    }
  }

  return changes;
}

/**
 * Deep equality check for arbitrary values.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}
