import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env manually (no dotenv dependency needed)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = resolve(__dirname, "../../.env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env file not found — rely on actual env vars
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("5000")
    .transform((v) => parseInt(v, 10)),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  CLIENT_URL: z.string().default("http://localhost:5174"),
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:5173,http://localhost:5174",
    ),

  ENCRYPTION_KEY: z.string().min(64, "ENCRYPTION_KEY must be 64 hex chars"),

  SMTP_HOST: z.string().default("smtp.resend.com"),
  SMTP_PORT: z
    .string()
    .default("465")
    .transform((v) => parseInt(v, 10)),
  SMTP_USER: z.string().default("resend"),
  SMTP_PASS: z.string().default(""),
  EMAIL_FROM: z.string().default("noreply@aegis.dev"),

  SENTRY_DSN: z.string().optional(),

  // ── OpenAI / LLM ─────────────────────────────────────────
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai"),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // ── Redis ───────────────────────────────────────────────
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // ── CORS ────────────────────────────────────────────────
  ALLOWED_ORIGINS: z
    .string()
    .default(
      "http://localhost:3000,http://localhost:5173,http://localhost:5174",
    ),

  // ── Storage ─────────────────────────────────────────────
  STORAGE_PROVIDER: z.enum(["s3", "cloudinary", "local"]).default("local"),

  // S3 / R2 / MinIO
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Local (dev only)
  LOCAL_UPLOAD_DIR: z.string().default("./uploads"),
  LOCAL_UPLOAD_URL: z.string().default("http://localhost:5000/uploads"),
});

/**
 * Validated environment — parsed once at startup.
 * If any variable fails validation the process exits immediately
 * so we never run with bad configuration.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌  Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
