import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGO_URI: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string(),

  JWT_REFRESH_EXPIRES_IN: z.string(),

  RESEND_API_KEY: z.string().min(1),

  EMAIL_FROM: z.string().min(1),

  FRONTEND_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

export default env;
