import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createEvent, EventAttributes } from 'ics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;

    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        team: {
          members: {
            some: {
              userId: user.id,
              status: 'ACTIVE',
            },
          },
        },
      },
      include: {
        team: {
          select: {
            name: true,
            sport: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const startDate = new Date(game.startTime);
    const endDate = game.endTime ? new Date(game.endTime) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    const event: EventAttributes = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ],
      title: game.opponent
        ? `${game.team.name} vs ${game.opponent}`
        : `${game.team.name} - ${game.title}`,
      description: game.notes || undefined,
      location: game.address || game.location,
      categories: [game.team.sport, game.gameType],
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: game.team.name },
      productId: 'shuck-in/ics',
    };

    const { error, value } = createEvent(event);

    if (error || !value) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
    }

    return new NextResponse(value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${game.team.name}-${game.title}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
  }
}
