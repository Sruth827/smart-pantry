import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const pantryData = await prisma.category.findMany({
      where: {
        user: { email: 'sean@test.local' }
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