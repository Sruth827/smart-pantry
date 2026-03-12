import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const updateData: any = {};
    if ('expirationDate' in body) updateData.expirationDate = body.expirationDate ? new Date(body.expirationDate) : null;
    if ('lowThreshold' in body) updateData.lowThreshold = body.lowThreshold;
    if ('quantity' in body) updateData.quantity = body.quantity;
    if ('unitLabel' in body) updateData.unitLabel = body.unitLabel || null;
    if ('itemName' in body) updateData.itemName = body.itemName;
    if ('categoryId' in body) updateData.categoryId = body.categoryId || null;
    const updatedItem = await db.pantryItem.update({ where: { id }, data: updateData });
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.pantryItem.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
