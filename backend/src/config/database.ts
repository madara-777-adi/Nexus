import mongoose from "mongoose";

import env from "./env";
import logger from "../shared/logger/logger";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);

    logger.info({ db: "mongodb" }, "MongoDB connected");
  } catch (error) {
    logger.error({ err: error, db: "mongodb" }, "MongoDB connection failed");

    process.exit(1);
  }
};

export default connectDB;
