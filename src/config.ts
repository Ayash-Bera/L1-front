import { z } from 'zod';

// Define a schema for environment variables
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
});

// Parse environment variables
const env = envSchema.parse(import.meta.env);

// Configuration object
export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL,
} as const;