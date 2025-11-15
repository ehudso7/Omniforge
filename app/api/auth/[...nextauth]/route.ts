import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
// Ensure environment variables are validated
import "@/lib/env";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
