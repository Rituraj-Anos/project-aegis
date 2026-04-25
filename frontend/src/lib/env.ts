import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url({ message: 'VITE_API_BASE_URL must be a valid URL' }),
  VITE_ENABLE_REAL_TIME: z.preprocess(
    (v) => (v === 'true' || v === true),
    z.boolean()
  ).default(true),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your .env file.');
}

export const env = parsed.data;
