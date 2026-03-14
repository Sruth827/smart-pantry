import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });
  const categories = await db.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, color } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  try {
    const category = await db.category.create({
      data: {
        name: name.trim(),
        color: color || null,
        userId: session.user.id,
      },
    });
    return NextResponse.json(category);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
