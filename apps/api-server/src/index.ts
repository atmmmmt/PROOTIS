import { env } from "./config/env.js";
import { logger } from "./core/logger.js";
import { connectMongo } from "./db/mongo.js";
import { hydrateFromMongo } from "./db/persist.js";
import { db } from "./data/demo-store.js";
import { ensureOwnershipDefaults, hydrateOwnershipFromMongo } from "./data/ownership-store.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`API server listening on http://localhost:${env.PORT}`);
});

async function initializeData() {
  try {
    await connectMongo();
    await Promise.all([
      hydrateFromMongo(db),
      hydrateOwnershipFromMongo()
    ]);
    ensureOwnershipDefaults();
    logger.info("Application data initialization complete.");
  } catch (error) {
    logger.error({ error }, "MongoDB initialization failed; continuing with in-memory data.");
    ensureOwnershipDefaults();
  }
}

void initializeData();
