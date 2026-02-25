import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// These lines tell Next.js: "DO NOT TOUCH THIS DURING THE BUILD"
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
