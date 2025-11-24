/**
 * Express API Server (REFACTORED - Modular Monolith)
 *
 * This is the NEW implementation following Modular Monolith principles.
 * The old server.ts remains for comparison.
 *
 * ARCHITECTURE:
 * - Thin orchestration layer (this file is <100 lines)
 * - All routes delegated to domain modules
 * - Centralized middleware
 * - Clean separation of concerns
 */

import express, { Request, Response } from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import * as openApiSpec from "../openapi.json";

// Shared utilities
import { config } from "./shared/config/environment";
import { logger } from "./shared/utils/logger";
import { errorHandler } from "./shared/middleware/error-handler";

// Domain module routes
import { rankingsRoutes } from "./modules/rankings";
import { clubsRoutes } from "./modules/clubs";
import { fixturesRoutes } from "./modules/fixtures";
import { cronRoutes } from "./modules/external-data";

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());

// API Documentation (Development only)
if (!config.isProduction) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "ClubElo API Documentation",
    }),
  );
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================================================
// API ROUTES (MODULAR)
// ============================================================================

// Mount domain routes
app.use("/api/elo/rankings", rankingsRoutes);
app.use("/api/elo/clubs", clubsRoutes);
app.use("/api/elo/fixtures", fixturesRoutes);

// Mount cron routes (protected by CRON_SECRET)
app.use("/api/cron", cronRoutes);

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 404 handler for API routes only
app.use("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ============================================================================
// ERROR HANDLING (MUST BE LAST)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Export app for testing
export default app;

// Start server (only if not in test mode and not on Vercel)
if (!config.isTest && !config.isVercel) {
  const PORT = config.port;

  app.listen(PORT, () => {
    logger.info(`ClubElo API server running on http://localhost:${PORT}`);

    console.log("\nAvailable endpoints:");
    console.log("  GET  /health");
    console.log(
      "  GET  /api/elo/rankings?date=YYYY-MM-DD&country=ENG&limit=100",
    );
    console.log(
      "  GET  /api/elo/clubs/:id/history?from=YYYY-MM-DD&to=YYYY-MM-DD",
    );
    console.log("  GET  /api/elo/clubs?q=search&country=ENG&limit=100");
    console.log("  GET  /api/elo/fixtures?date=YYYY-MM-DD&country=ENG");

    if (!config.isProduction) {
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    }

    console.log("");
  });
}
