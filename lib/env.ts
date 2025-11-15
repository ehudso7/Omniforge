import { z } from "zod";

// Environment variables validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith("sk-").min(1),
  
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Lazy validation - only validate when actually accessing values
// This prevents build-time errors when env vars aren't set
let validatedEnv: z.infer<typeof envSchema> | null = null;

function getEnv() {
  // During build time, skip validation
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      DATABASE_URL: process.env.DATABASE_URL || "",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
    };
  }

  // In production runtime, validate
  if (process.env.NODE_ENV === "production" && !validatedEnv) {
    try {
      validatedEnv = envSchema.parse({
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        NODE_ENV: process.env.NODE_ENV || "production",
      });
      return validatedEnv;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors.map((e) => e.path.join(".")).join(", ");
        throw new Error(
          `Missing or invalid environment variables: ${missingVars}\n` +
          `Please check your .env file or Vercel environment variables.`
        );
      }
      throw error;
    }
  }

  // Return cached validated env or defaults
  if (validatedEnv) {
    return validatedEnv;
  }

  // Development or build time - return with defaults
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };
}

// Export getter function for lazy evaluation
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    const envValues = getEnv();
    return envValues[prop as keyof typeof envValues];
  },
});

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;
