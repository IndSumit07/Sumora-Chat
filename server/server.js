import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { initSocket } from "./src/socket/index.js";
import logger from "./src/config/logger.js";
import { closeBullMQ } from "./src/config/bullmq.js";
import {
  getRedisClient,
  getPubClient,
  getSubClient,
} from "./src/config/redis.js";

const PORT = process.env.PORT || 3001;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Start listening
httpServer.listen(PORT, () => {
  logger.info(`🚀 Sumora Chat Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`PID: ${process.pid}`);
});

// ========================
// Graceful Shutdown
// ========================
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(async (err) => {
    if (err) {
      logger.error(`Error closing HTTP server: ${err.message}`);
      process.exit(1);
    }

    try {
      // Close BullMQ
      await closeBullMQ();

      // Close Redis connections
      await getRedisClient().quit();
      await getPubClient().quit();
      await getSubClient().quit();

      // Close MongoDB
      const mongoose = (await import("mongoose")).default;
      await mongoose.connection.close();

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (shutdownErr) {
      logger.error(`Shutdown error: ${shutdownErr.message}`);
      process.exit(1);
    }
  });

  // Force exit after 30s
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err);
  process.exit(1);
});

export default httpServer;
