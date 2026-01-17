import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sport: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: user.id,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phone: true,
                jerseyNumber: true,
                position: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' },
          ],
        },
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
            games: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get user's membership for this team
    const userMembership = team.members.find((m: any) => m.userId === user.id);

    // Return only the fields needed by the frontend to avoid serialization issues
    // This prevents React error #438 (objects not valid as React children)
    const sanitizedResponse = {
      id: team.id,
      name: team.name,
      sport: team.sport,
      description: team.description,
      color: team.color,
      inviteCode: team.inviteCode,
      owner: {
        id: team.owner.id,
        name: team.owner.name,
      },
      members: team.members.map((m: any) => ({
        id: m.id,
        role: m.role,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          phone: m.user.phone,
          jerseyNumber: m.user.jerseyNumber,
          position: m.user.position,
        },
      })),
      userRole: userMembership?.role || null,
      _count: team._count,
    };

    return NextResponse.json(sanitizedResponse);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is admin or owner
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    const team = await prisma.team.update({
      where: { id: teamId },
      data: validatedData,
    });

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is owner
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: user.id,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
