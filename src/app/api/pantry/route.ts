import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch categorized items
    const categorizedData = await db.category.findMany({
      where: { user: { email: session.user.email } },
      include: { items: true },
      orderBy: { name: 'asc' },
    });

    // Fetch uncategorized items (categoryId is null)
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    const uncategorizedItems = user
      ? await db.pantryItem.findMany({
          where: { userId: user.id, categoryId: null },
        })
      : [];

    // Serialize dates to ISO strings so the client gets consistent strings
    const serialize = (item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      lowThreshold: Number(item.lowThreshold),
      expirationDate: item.expirationDate
        ? (item.expirationDate instanceof Date
            ? item.expirationDate.toISOString().split('T')[0]
            : String(item.expirationDate).split('T')[0])
        : null,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    });

    const result = categorizedData.map((cat: any) => ({
      ...cat,
      color: cat.color ?? null,
      items: cat.items.map(serialize),
    }));

    // Append uncategorized as a virtual group (only if there are any)
    if (uncategorizedItems.length > 0) {
      result.push({
        id: null,
        name: 'Uncategorized',
        color: null,
        items: uncategorizedItems.map(serialize),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pantry' }, { status: 500 });
  }
}
