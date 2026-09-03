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

  CEREBRAS_MODEL: z.string().min(1).optional(),

  GROQ_MODEL: z.string().min(1).optional(),

  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),

  // Groq AI Keys (Dual-Key Routing)
  AI_TIER1_API_KEY: z.string().min(1, "AI_TIER1_API_KEY is required"),
  AI_TIER2_API_KEY: z.string().min(1, "GROQ_API_KEY_TEACHER is required"),
  AI_TIER3_API_KEY: z.string().min(1, "AI_TIER3_API_KEY is required"),

  // Per-tier provider selection (ECR-001). Each tier independently selects its provider.
  AI_TIER1_PROVIDER: z.enum(["groq", "cerebras", "gemini"]).default("groq"),
  AI_TIER2_PROVIDER: z.enum(["groq", "cerebras", "gemini"]).default("groq"),
  AI_TIER3_PROVIDER: z.enum(["groq", "cerebras", "gemini"]).default("groq"),

  // Cerebras key — single shared key across all tiers that select it.
  // Optional: only required if a tier's provider is set to "cerebras".

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.string().url(),
});

const parsedEnv = envSchema.parse(process.env);

const checkProviderModel = (tier: string, provider: string) => {
  if (provider === "cerebras" && !parsedEnv.CEREBRAS_MODEL) {
    throw new Error(`Configuration Error: ${tier} is set to "cerebras", but CEREBRAS_MODEL is missing.`);
  }
  if (provider === "groq" && !parsedEnv.GROQ_MODEL) {
    throw new Error(`Configuration Error: ${tier} is set to "groq", but GROQ_MODEL is missing.`);
  }
  if (provider === "gemini" && !parsedEnv.GEMINI_MODEL) {
    throw new Error(`Configuration Error: ${tier} is set to "gemini", but GEMINI_MODEL is missing.`);
  }
};

checkProviderModel("AI_TIER1_PROVIDER", parsedEnv.AI_TIER1_PROVIDER);
checkProviderModel("AI_TIER2_PROVIDER", parsedEnv.AI_TIER2_PROVIDER);
checkProviderModel("AI_TIER3_PROVIDER", parsedEnv.AI_TIER3_PROVIDER);

export const env = parsedEnv as typeof parsedEnv & {
  CEREBRAS_MODEL: string;
  GROQ_MODEL: string;
};

export default env;
