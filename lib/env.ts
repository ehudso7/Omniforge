// Environment variable validation
// This file ensures all required environment variables are present at runtime

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'OPENAI_API_KEY',
] as const;

// Validate in non-build environments
if (process.env.NODE_ENV !== 'production' || process.env.SKIP_ENV_VALIDATION !== 'true') {
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Logging helper that respects environment
export const isDevelopment = env.NODE_ENV === 'development';

export function devLog(...args: any[]) {
  if (isDevelopment) {
    console.log('[DEV]', ...args);
  }
}

export function devError(...args: any[]) {
  if (isDevelopment) {
    console.error('[DEV ERROR]', ...args);
  }
}
