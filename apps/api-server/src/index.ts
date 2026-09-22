import { env } from "./config/env.js";
import { logger } from "./core/logger.js";
import { connectMongo } from "./db/mongo.js";
import { hydrateFromMongo } from "./db/persist.js";
import { db } from "./data/demo-store.js";
import { createApp } from "./app.js";

await connectMongo();
await hydrateFromMongo(db);

const app = createApp();
app.listen(env.PORT, () => {
  logger.info(`API server listening on http://localhost:${env.PORT}`);
});
