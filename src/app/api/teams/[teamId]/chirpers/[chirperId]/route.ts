import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateChirperSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nickname: z.string().max(50).optional(),
  avatar: z.string().optional(),
  personality: z.string().min(10).max(1000).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get a single chirper
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; chirperId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, chirperId } = await params;

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

    const chirper = await prisma.chirper.findFirst({
      where: {
        id: chirperId,
        teamId,
      },
    });

    if (!chirper) {
      return NextResponse.json({ error: 'Chirper not found' }, { status: 404 });
    }

    return NextResponse.json(chirper);
  } catch (error) {
    console.error('Error fetching chirper:', error);
    return NextResponse.json({ error: 'Failed to fetch chirper' }, { status: 500 });
  }
}

// PATCH - Update a chirper (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; chirperId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, chirperId } = await params;

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

    const body = await request.json();
    const data = updateChirperSchema.parse(body);

    const chirper = await prisma.chirper.update({
      where: {
        id: chirperId,
        teamId,
      },
      data,
    });

    return NextResponse.json(chirper);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating chirper:', error);
    return NextResponse.json({ error: 'Failed to update chirper' }, { status: 500 });
  }
}

// DELETE - Delete a chirper (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; chirperId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, chirperId } = await params;

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

    await prisma.chirper.delete({
      where: {
        id: chirperId,
        teamId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chirper:', error);
    return NextResponse.json({ error: 'Failed to delete chirper' }, { status: 500 });
  }
}
