import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/onboarding-complete
 *
 * Marks hasLoggedInBefore = true in the database so the first-time
 * onboarding modal never appears again, regardless of JWT state or
 * hot-reloads during development.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { hasLoggedInBefore: true },
  });

  return NextResponse.json({ success: true });
}
