/**
 * Simple Logger Utility
 *
 * Centralized logging to make it easier to swap implementations later
 * (e.g., Winston, Pino, or cloud logging services).
 */

import { config } from "../config/environment";

type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Log a message with a specific level
 */
function log(level: LogLevel, message: string, meta?: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` ${JSON.stringify(meta)}` : "";

  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;

  switch (level) {
    case "error":
      console.error(logMessage);
      break;
    case "warn":
      console.warn(logMessage);
      break;
    case "debug":
      if (!config.isProduction) {
        console.debug(logMessage);
      }
      break;
    case "info":
    default:
      console.log(logMessage);
  }
}

/**
 * Logger instance
 */
export const logger = {
  info: (message: string, meta?: Record<string, any>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, any>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, any>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, any>) => log("debug", message, meta),
};
