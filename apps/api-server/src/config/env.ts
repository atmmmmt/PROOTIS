import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  MONGO_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
  AI_PROVIDER: z.enum(["disabled", "anthropic"]).default("disabled"),
  ANTHROPIC_API_KEY: z.string().optional(),
  WEBHOOK_PAYMENT_SECRET: z.string().default("dev-webhook-secret-change-me"),
  OBJECT_STORAGE_BUCKET: z.string().optional()
});

export const env = envSchema.parse(process.env);
