import SHA256 from "crypto-js/sha256";
import type { Page } from "../types";

/**
 * Generate a deterministic SHA-256 hash of a page.
 * Uses sorted keys to ensure consistent hashing regardless of property order.
 */
export function hashPage(page: Page): string {
  const normalized = JSON.stringify(page, Object.keys(page).sort());
  return SHA256(normalized).toString();
}

/**
 * Deep sort an object's keys for deterministic serialization.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Generate a deterministic hash using deep-sorted keys.
 */
export function hashPageDeep(page: Page): string {
  const sorted = sortObjectKeys(page);
  return SHA256(JSON.stringify(sorted)).toString();
}

/**
 * Check if two pages produce the same hash (are identical).
 */
export function arePagesIdentical(a: Page, b: Page): boolean {
  return hashPageDeep(a) === hashPageDeep(b);
}
