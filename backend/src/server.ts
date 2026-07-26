import app from "./app";

import env from "./config/env";

import connectDB from "./config/database";
import logger from "./shared/logger/logger";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "Server started");
    });
  } catch (error) {
    logger.error({ err: error }, "Server startup failed");
    process.exit(1);
  }
};

startServer();
