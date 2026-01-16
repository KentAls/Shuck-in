import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const joinTeamSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = joinTeamSchema.parse(body);

    // Find team by invite code
    const team = await prisma.team.findUnique({
      where: { inviteCode },
    });

    if (!team) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: team.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        return NextResponse.json({ error: 'Already a member of this team' }, { status: 400 });
      }

      // Reactivate membership
      await prisma.teamMember.update({
        where: { id: existingMembership.id },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({ success: true, teamId: team.id });
    }

    // Create new membership
    await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: team.id,
        role: 'PLAYER',
      },
    });

    return NextResponse.json({ success: true, teamId: team.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error joining team:', error);
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
  }
}
