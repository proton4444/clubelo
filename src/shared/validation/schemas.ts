/**
 * Validation Schemas
 *
 * Centralized Zod schemas for request validation.
 * These provide runtime type checking and automatic error messages.
 */

import { z } from "zod";

/**
 * Date string schema (YYYY-MM-DD format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (date) => !isNaN(new Date(date).getTime()),
    "Invalid date"
  );

/**
 * Country code schema (2-3 uppercase letters)
 */
export const countryCodeSchema = z
  .string()
  .min(2)
  .max(3)
  .regex(/^[A-Z]+$/, "Country code must be uppercase letters");

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(1000).default(100),
});

/**
 * Rankings filters schema
 */
export const rankingsFiltersSchema = z.object({
  date: dateStringSchema.optional(),
  country: countryCodeSchema.optional(),
  level: z.number().int().min(1).max(10).optional(),
  minElo: z.number().min(0).max(3000).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(1000).default(100),
});

/**
 * Club search filters schema
 */
export const clubSearchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  country: countryCodeSchema.optional(),
  level: z.number().int().min(1).max(10).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

/**
 * Club history filters schema
 */
export const clubHistorySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});

/**
 * Fixtures filters schema
 */
export const fixturesFiltersSchema = z.object({
  date: dateStringSchema.optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  country: countryCodeSchema.optional(),
  competition: z.string().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

/**
 * Helper to validate query parameters
 *
 * Converts string query params to correct types and validates.
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, any>
): z.infer<T> {
  // Convert string numbers to actual numbers
  const parsed: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Try to convert to number if it looks like a number
    if (typeof value === "string" && !isNaN(Number(value))) {
      parsed[key] = Number(value);
    } else {
      parsed[key] = value;
    }
  }

  return schema.parse(parsed);
}
