/**
 * Common API route helpers
 */

import { NextRequest, NextResponse } from "next/server";

const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

/**
 * Validate request size
 */
export function validateRequestSize(request: NextRequest): void {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    throw new Error("Request body too large");
  }
}

/**
 * Parse JSON body with size validation
 */
export async function parseJsonBody<T>(request: Request): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
    throw new Error("Request body too large (max 1MB)");
  }

  const text = await request.text();
  if (text.length > MAX_REQUEST_SIZE) {
    throw new Error("Request body too large (max 1MB)");
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Invalid JSON in request body");
  }
}
