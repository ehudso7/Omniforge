/**
 * Environment variable validation and configuration
 * Validates all required environment variables at startup
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Please set it in your .env file or environment.`
    );
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  // NextAuth
  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL"),
  NEXTAUTH_SECRET: getEnvVar("NEXTAUTH_SECRET"),

  // OpenAI
  OPENAI_API_KEY: getEnvVar("OPENAI_API_KEY"),

  // Optional AI providers
  ANTHROPIC_API_KEY: getOptionalEnvVar("ANTHROPIC_API_KEY"),
  REPLICATE_API_KEY: getOptionalEnvVar("REPLICATE_API_KEY"),
  STABILITY_API_KEY: getOptionalEnvVar("STABILITY_API_KEY"),

  // Node environment
  NODE_ENV: getOptionalEnvVar("NODE_ENV", "development") as "development" | "production" | "test",

  // Vercel
  VERCEL_URL: getOptionalEnvVar("VERCEL_URL"),
} as const;

// Validate NEXTAUTH_SECRET is strong enough in production
if (env.NODE_ENV === "production" && env.NEXTAUTH_SECRET.length < 32) {
  throw new Error(
    "NEXTAUTH_SECRET must be at least 32 characters long in production. Generate one with: openssl rand -base64 32"
  );
}

// Validate NEXTAUTH_URL format
if (!env.NEXTAUTH_URL.match(/^https?:\/\//)) {
  throw new Error(
    "NEXTAUTH_URL must be a valid URL starting with http:// or https://"
  );
}
