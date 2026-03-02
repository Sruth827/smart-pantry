import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if(!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorize'}, { status: 401 });
    }

    const pantryData = await db.category.findMany({
      where: {
        user: { email: session.user.email }
      },
      include: {
        items: true, 
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(pantryData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pantry' }, { status: 500 });
  }
}