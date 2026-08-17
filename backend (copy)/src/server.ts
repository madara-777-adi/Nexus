import "dotenv/config"; // MUST BE LINE 1!
import mongoose from "mongoose";
import app from "./app";
import env from "./config/env";
import connectDB from "./config/database";
import logger from "./shared/logger/logger";
import { ProviderFactory } from "./modules/ai/providers/provider.factory";

let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Fail fast on misconfigured AI provider keys (e.g. a tier set to
    // "cerebras" without CEREBRAS_API_KEY) instead of only discovering it
    // on a real user's first AI request in production.
    ProviderFactory.getInstance();

    server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "Server started");
    });
  } catch (error) {
    logger.error({ err: error }, "Server startup failed");
    process.exit(1);
  }
};

/**
 * Gracefully drains active HTTP requests and closes MongoDB connections.
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(
    { signal },
    "Received shutdown signal. Starting graceful shutdown...",
  );

  // Force exit after 10s if active sockets hang or refuse to close
  const forceExitTimeout = setTimeout(() => {
    logger.error("Forced shutdown triggered after timeout expiration.");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info("HTTP server stopped accepting new connections.");
          resolve();
        });
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info("MongoDB database connection closed.");
    }

    clearTimeout(forceExitTimeout);
    logger.info("Graceful shutdown completed successfully.");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error occurred during graceful shutdown.");
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
};

// Listen for process termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Global process crash handlers
process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught Exception thrown!");
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection detected!");
  gracefulShutdown("unhandledRejection");
});

startServer();
