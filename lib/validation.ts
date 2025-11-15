/**
 * Input validation and sanitization utilities
 */

import { z } from "zod";

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and > characters
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * Validate and sanitize prompt input
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }

  const sanitized = sanitizeString(prompt);
  
  if (sanitized.length < 1) {
    throw new Error("Prompt cannot be empty");
  }

  if (sanitized.length > 10000) {
    throw new Error("Prompt is too long (max 10000 characters)");
  }

  return sanitized;
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): string {
  const sanitized = sanitizeString(name);
  
  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new Error("Project name must be between 1 and 100 characters");
  }

  return sanitized;
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email().max(255);

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    throw new Error("Password is too long (max 128 characters)");
  }

  // Check for at least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Password must contain at least one letter and one number");
  }
}
