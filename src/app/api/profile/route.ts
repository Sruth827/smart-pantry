import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, email: true, unitPref: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, unitPref, currentPassword, newPassword } = body;

  const updateData: any = {};
  if (fullName) updateData.fullName = fullName.trim();
  if (unitPref) updateData.unitPref = unitPref;

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, fullName: true, email: true, unitPref: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
