import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
//import { prisma } from "@/lib/prisma";

// GET /api/shopping-list — fetch all items for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const items = await db.shoppingItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/shopping-list — add a new item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { itemName, quantity, source, sourceLabel } = body;

  if (!itemName?.trim()) {
    return NextResponse.json({ error: "itemName is required" }, { status: 400 });
  }

  const item = await db.shoppingItem.create({
    data: {
      userId: user.id,
      itemName: itemName.trim(),
      quantity: quantity ?? null,
      source: source ?? null,
      sourceLabel: sourceLabel ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH /api/shopping-list — toggle checked, or bulk operations
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();

  // Bulk clear checked items
  if (body.action === "clearChecked") {
    await db.shoppingItem.deleteMany({
      where: { userId: user.id, checked: true },
    });
    return NextResponse.json({ ok: true });
  }

  // Toggle a single item's checked state
  const { id, checked } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await db.shoppingItem.findFirst({ where: { id, userId: user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.shoppingItem.update({
    where: { id },
    data: { checked: checked ?? !item.checked },
  });

  return NextResponse.json(updated);
}

// PUT /api/shopping-list — edit an existing manual item's details
// Schema mapping: itemName→itemName, quantity+unitLabel→quantity (combined string),
// notes→sourceLabel, categoryId is not stored (display-only via categories query)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { id, itemName, quantity, unitLabel, notes } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await db.shoppingItem.findFirst({ where: { id, userId: user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build combined quantity string (e.g. "2 kg" or just "2")
  let combinedQty: string | null = item.quantity;
  if (quantity !== undefined || unitLabel !== undefined) {
    const qPart = (quantity ?? "").toString().trim();
    const uPart = (unitLabel ?? "").toString().trim();
    combinedQty = qPart && uPart ? `${qPart} ${uPart}` : qPart || uPart || null;
  }

  const updated = await db.shoppingItem.update({
    where: { id },
    data: {
      ...(itemName !== undefined && { itemName: itemName.trim() }),
      quantity: combinedQty,
      ...(notes !== undefined && { sourceLabel: notes ?? null }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/shopping-list?id=... — delete a single item
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const item = await db.shoppingItem.findFirst({ where: { id, userId: user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}