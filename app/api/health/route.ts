import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasAuth: !!process.env.NEXTAUTH_SECRET,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
    }
  });
}
