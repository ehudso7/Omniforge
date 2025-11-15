import { NextRequest, NextResponse } from "next/server";

/**
 * Request validation utilities for API routes
 */

const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

/**
 * Validates request body size
 */
export async function validateRequestSize(
  request: NextRequest
): Promise<{ valid: boolean; error?: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Safely parse JSON request body with size validation
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const text = await request.text();
    
    if (text.length > MAX_REQUEST_SIZE) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Request body too large" },
          { status: 413 }
        ),
      };
    }

    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      ),
    };
  }
}
