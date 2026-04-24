import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { sendAccountUpdatedEmail, sendPasswordChangedEmail } from "@/lib/mailer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, email: true, unitPref: true, createdAt: true, hasLoggedInBefore: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, unitPref, currentPassword, newPassword } = body;

  // Fetch current user data so we can detect what changed and send the right email
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, email: true, unitPref: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updateData: any = {};
  const changes: { field: string; newValue: string }[] = [];

  if (fullName && fullName.trim() !== user.fullName) {
    updateData.fullName = fullName.trim();
    changes.push({ field: "Full Name", newValue: fullName.trim() });
  }
  if (unitPref && unitPref !== user.unitPref) {
    updateData.unitPref = unitPref;
    changes.push({ field: "Units of Measurement", newValue: unitPref });
  }

  let passwordChanged = false;
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    passwordChanged = true;
  }

  // If nothing actually changed, return early without hitting the DB
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ id: user.id, fullName: user.fullName, email: user.email, unitPref: user.unitPref });
  }

  try {
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, fullName: true, email: true, unitPref: true },
    });

    // Send appropriate email — fire-and-forget
    if (passwordChanged) {
      sendPasswordChangedEmail(user.email, updated.fullName).catch((err) =>
        console.error("Password changed email failed:", err)
      );
    } else if (changes.length > 0) {
      sendAccountUpdatedEmail(user.email, updated.fullName, changes).catch((err) =>
        console.error("Account updated email failed:", err)
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
