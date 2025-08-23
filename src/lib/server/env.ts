import { z } from 'zod';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Environment validation schema
const envSchema = z.object({
  PUBLIC_SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required')
});

// Validate environment variables on import
const validatedEnv = envSchema.parse({
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
});

export default validatedEnv;

// Helper function to get validated environment variables
export function getValidatedEnv() {
  return validatedEnv;
}

// Type-safe environment variables
export type ValidatedEnv = z.infer<typeof envSchema>;