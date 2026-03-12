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
    const { expirationDate } = body;

    const updatedItem = await db.pantryItem.update({
      where: { id },
      data: { expirationDate: expirationDate ? new Date(expirationDate) : null },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}