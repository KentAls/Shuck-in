import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendBulkReminders } from '@/lib/twilio';
import { format } from 'date-fns';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId } = await params;

    // Get game and check permissions
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] },
                status: 'ACTIVE',
              },
            },
          },
        },
        rsvps: {
          where: {
            status: 'PENDING',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.team.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Filter to only users with phone numbers who haven't responded
    const recipientsWithPhones = game.rsvps
      .filter((rsvp) => rsvp.user.phone)
      .map((rsvp) => ({
        userId: rsvp.user.id,
        phone: rsvp.user.phone!,
        name: rsvp.user.name || 'Player',
      }));

    if (recipientsWithPhones.length === 0) {
      return NextResponse.json({
        message: 'No pending RSVPs with phone numbers to remind',
        sent: 0,
        failed: 0,
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://shuck-in.vercel.app';
    const rsvpLink = `${baseUrl}/schedule/${gameId}`;
    const gameDate = format(new Date(game.startTime), 'EEEE, MMM d @ h:mm a');

    const result = await sendBulkReminders(
      recipientsWithPhones,
      game.team.name,
      game.title + (game.opponent ? ` vs ${game.opponent}` : ''),
      gameDate,
      rsvpLink
    );

    // Record reminders sent
    if (result.sent > 0) {
      await prisma.reminderSent.createMany({
        data: recipientsWithPhones
          .filter((_, i) => result.results[i]?.success)
          .map((recipient) => ({
            gameId,
            userId: recipient.userId,
            type: 'sms',
          })),
      });
    }

    return NextResponse.json({
      message: `Sent ${result.sent} reminder(s)`,
      sent: result.sent,
      failed: result.failed,
      totalPending: game.rsvps.length,
      withPhone: recipientsWithPhones.length,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
