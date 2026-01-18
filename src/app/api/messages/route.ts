import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createMessageSchema = z.object({
  teamId: z.string(),
  content: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

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

    // Fetch both regular messages and chirper messages
    const [messages, chirperMessages] = await Promise.all([
      prisma.message.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      }),
      prisma.chirperMessage.findMany({
        where: { teamId },
        include: {
          chirper: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Transform chirper messages to match regular message format
    const transformedChirperMessages = chirperMessages.map((cm: { id: string; content: string; createdAt: Date; chirper: { id: string; name: string; avatar: string | null } }) => ({
      id: cm.id,
      content: cm.content,
      createdAt: cm.createdAt,
      isChirper: true,
      chirperName: cm.chirper.name,
      chirperAvatar: cm.chirper.avatar,
      user: {
        id: `chirper-${cm.chirper.id}`,
        name: cm.chirper.name,
        image: cm.chirper.avatar,
      },
    }));

    // Transform regular messages
    const transformedMessages = messages.map((m: { id: string; content: string; createdAt: Date; user: { id: string; name: string | null; image: string | null } }) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      isChirper: false,
      user: m.user,
    }));

    // Combine and sort by createdAt
    const allMessages = [...transformedMessages, ...transformedChirperMessages]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);

    return NextResponse.json({
      messages: allMessages,
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, content } = createMessageSchema.parse(body);

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

    const message = await prisma.message.create({
      data: {
        teamId,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Randomly trigger chirper response (10% chance)
    // This makes chirpers occasionally chime in on conversations
    if (Math.random() < 0.1) {
      triggerChirperResponse(teamId).catch((err) => {
        console.error('Error triggering chirper:', err);
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Background function to trigger chirper response
async function triggerChirperResponse(teamId: string) {
  try {
    // Check if team has active chirpers
    const chirperCount = await prisma.chirper.count({
      where: {
        teamId,
        isActive: true,
      },
    });

    if (chirperCount === 0) return;

    // Check rate limiting - don't chirp more than once every 5 minutes per team
    const recentChirp = await prisma.chirperMessage.findFirst({
      where: {
        teamId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentChirp) return;

    // Get team and chirpers
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true, sport: true },
    });

    if (!team) return;

    const chirpers = await prisma.chirper.findMany({
      where: { teamId, isActive: true },
    });

    if (chirpers.length === 0) return;

    // Get recent messages for context
    const recentMessages = await prisma.message.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
      },
    });

    const chatContext = recentMessages
      .reverse()
      .map((m: { content: string; user: { name: string | null } }) => `${m.user.name}: ${m.content}`)
      .join('\n');

    // Select random chirper
    const chirper = chirpers[Math.floor(Math.random() * chirpers.length)];

    const systemPrompt = `You are ${chirper.name}${chirper.nickname ? ` (${chirper.nickname})` : ''}, a famous ${team.sport} legend in a team chat for ${team.name}.

Personality: ${chirper.personality}

Keep it SHORT (1-2 sentences). Be encouraging and fun. React to what the team is discussing.`;

    const userPrompt = `Recent chat:\n${chatContext || '(quiet)'}\n\nWrite a short comment as ${chirper.name}:`;

    // Call Vercel AI Gateway
    const response = await fetch('https://gateway.ai.vercel.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_AI_GATEWAY_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) return;

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content?.trim();

    if (content) {
      await prisma.chirperMessage.create({
        data: {
          content,
          chirperId: chirper.id,
          teamId,
        },
      });
    }
  } catch (error) {
    console.error('Chirper response error:', error);
  }
}
