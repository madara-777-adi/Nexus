import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGO_URI: z.string().min(32, "JWT_SECRET must be 32 charecters long"),

//   RESEND_API_KEY: z.string().min(1),

//   EMAIL_FROM: z.email(),
});

const env = envSchema.parse(process.env);

export default env;
