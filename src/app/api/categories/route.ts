import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const categories = await db.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(categories);
}