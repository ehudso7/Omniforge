/**
 * Simple in-memory rate limiter
 * For production, consider using:
 * - Vercel's built-in rate limiting
 * - Upstash Redis for distributed rate limiting
 * - @upstash/ratelimit package
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier: string; // Unique identifier (e.g., user ID, IP address)
}

export function checkRateLimit({
  windowMs,
  maxRequests,
  identifier,
}: RateLimitOptions): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  const entry = store[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 * Usage:
 * const rateLimitResult = checkRateLimit({
 *   windowMs: 60 * 1000, // 1 minute
 *   maxRequests: 10,
 *   identifier: user.id || request.headers.get("x-forwarded-for") || "anonymous",
 * });
 * if (!rateLimitResult.allowed) {
 *   return NextResponse.json(
 *     { error: "Rate limit exceeded" },
 *     { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)) } }
 *   );
 * }
 */
