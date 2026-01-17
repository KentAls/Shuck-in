import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'PLAYER']),
});

// Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, memberId } = params;

    // Check if user is owner or admin
    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the member being updated
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change owner's role
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    // Only owner can make someone admin
    if (userMembership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMemberSchema.parse(body);

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: validatedData.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; memberId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, memberId } = params;

    // Check if user is owner or admin
    const userMembership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the member being removed
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 });
    }

    // Admins can only remove players, not other admins
    if (userMembership.role === 'ADMIN' && targetMember.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 403 });
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
