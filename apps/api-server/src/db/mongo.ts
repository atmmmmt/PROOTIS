import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";
import "../models/index.js";

export async function connectMongo() {
  if (!env.MONGO_URI) {
    logger.warn("MONGO_URI not configured. API will use in-memory demo data.");
    return;
  }

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });
  logger.info("MongoDB connected.");
}
