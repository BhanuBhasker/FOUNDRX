/**
 * Safely reads a JSON_ARRAYAGG/JSON_OBJECT column. mysql2 auto-decodes
 * MySQL JSON columns into JS values already, but a NULL aggregate (no
 * matching rows) comes back as the string "null" in some driver/column
 * type combinations and as JS `null` in others — normalize both to `[]`,
 * and only JSON.parse when the driver handed back a raw string.
 */
export function parseJsonAgg(value, fallback = []) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}
