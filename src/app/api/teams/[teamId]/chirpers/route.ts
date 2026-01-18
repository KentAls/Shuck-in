import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createChirperSchema = z.object({
  name: z.string().min(1).max(100),
  nickname: z.string().max(50).optional(),
  avatar: z.string().optional(),
  personality: z.string().min(10).max(1000),
});

const updateChirperSchema = createChirperSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET - List all chirpers for a team
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const chirpers = await prisma.chirper.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ chirpers });
  } catch (error) {
    console.error('Error fetching chirpers:', error);
    return NextResponse.json({ error: 'Failed to fetch chirpers' }, { status: 500 });
  }
}

// POST - Create a new chirper (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Check if user is admin or owner
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Must be admin to manage chirpers' }, { status: 403 });
    }

    // Check chirper count (max 3 per team)
    const chirperCount = await prisma.chirper.count({
      where: { teamId },
    });

    if (chirperCount >= 3) {
      return NextResponse.json({ error: 'Maximum of 3 chirpers per team' }, { status: 400 });
    }

    const body = await request.json();
    const data = createChirperSchema.parse(body);

    const chirper = await prisma.chirper.create({
      data: {
        ...data,
        teamId,
      },
    });

    return NextResponse.json(chirper, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating chirper:', error);
    return NextResponse.json({ error: 'Failed to create chirper' }, { status: 500 });
  }
}
