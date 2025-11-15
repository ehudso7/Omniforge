// Rate limiting implementation
// This provides basic in-memory rate limiting
// For production with multiple instances, use Upstash Redis or similar

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // in milliseconds
  maxRequests: number;
}

export const rateLimitConfig = {
  // AI generation endpoints: 10 requests per minute
  generation: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // API endpoints: 60 requests per minute
  api: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Authentication: 5 requests per 5 minutes
  auth: {
    interval: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
  },
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success flag and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;

  // Initialize or reset if window has passed
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + config.interval,
    };
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: store[key].resetAt,
    };
  }

  // Increment count
  store[key].count++;

  // Check if limit exceeded
  const success = store[key].count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - store[key].count);

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: store[key].resetAt,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or admin overrides
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier];
}

// For production with Redis (Upstash):
/*
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "omniforge",
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, limit, remaining, reset };
}
*/
