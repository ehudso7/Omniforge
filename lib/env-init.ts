/**
 * Initialize and validate environment variables
 * This should be imported early in the application lifecycle
 */

import { env } from "./env";

// This file exists to ensure env validation happens
// The actual validation is in env.ts and will throw if invalid
export { env };
