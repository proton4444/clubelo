/**
 * Date Formatting Utilities
 *
 * Centralized date handling to prevent timezone drift issues.
 * This utility is duplicated across server.ts, dashboard.js, and api.js.
 */

/**
 * Format a Date object or ISO string to YYYY-MM-DD without timezone drift
 *
 * @param value - Date object, ISO string, or null
 * @returns Formatted date string (YYYY-MM-DD) or null
 *
 * @example
 * ```typescript
 * formatDateOnly(new Date("2024-11-20T10:00:00Z")) // "2024-11-20"
 * formatDateOnly("2024-11-20T10:00:00Z")           // "2024-11-20"
 * formatDateOnly(null)                             // null
 * ```
 */
export function formatDateOnly(value: Date | string | null): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  const d = value as Date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Validate if a string is a valid date in YYYY-MM-DD format
 *
 * @param dateString - Date string to validate
 * @returns True if valid date format
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 *
 * @returns Yesterday's date string
 */
export function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateOnly(yesterday)!;
}

/**
 * Get today's date in YYYY-MM-DD format
 *
 * @returns Today's date string
 */
export function getToday(): string {
  return formatDateOnly(new Date())!;
}
