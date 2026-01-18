import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Generate a chirper message based on recent chat context
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

    // Get team info including sport
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true, sport: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get active chirpers for this team
    const chirpers = await prisma.chirper.findMany({
      where: {
        teamId,
        isActive: true,
      },
    });

    if (chirpers.length === 0) {
      return NextResponse.json({ error: 'No active chirpers' }, { status: 400 });
    }

    // Get recent messages (last 10) for context
    const recentMessages = await prisma.message.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Also get recent chirper messages to avoid repetition
    const recentChirperMessages = await prisma.chirperMessage.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        chirper: {
          select: { name: true },
        },
      },
    });

    // Build chat context
    const chatContext = recentMessages
      .reverse()
      .map((m: { content: string; user: { name: string | null } }) => `${m.user.name}: ${m.content}`)
      .join('\n');

    const previousChirps = recentChirperMessages
      .map((m: { content: string; chirper: { name: string } }) => `${m.chirper.name}: ${m.content}`)
      .join('\n');

    // Randomly select a chirper
    const selectedChirper = chirpers[Math.floor(Math.random() * chirpers.length)];

    // Build the prompt
    const systemPrompt = `You are ${selectedChirper.name}${selectedChirper.nickname ? ` (${selectedChirper.nickname})` : ''}, a famous ${team.sport} legend impersonating yourself in a team chat for ${team.name}.

Your personality: ${selectedChirper.personality}

Rules:
- Keep responses SHORT (1-2 sentences max, like a real chat message)
- Be encouraging, fun, and authentic to your character
- Reference your playing career naturally when relevant
- React to what the team is discussing
- Use occasional sports slang or your famous catchphrases
- Don't be preachy or give long lectures
- Sometimes just make a funny quip or observation
- You can use light trash talk if someone mentions an opponent

DO NOT:
- Repeat what you've said before
- Use excessive emojis
- Be generic or boring
- Write more than 2 sentences`;

    const userPrompt = `Recent team chat:
${chatContext || '(No recent messages)'}

${previousChirps ? `Your previous comments (don't repeat these):\n${previousChirps}` : ''}

Write a short, authentic comment as ${selectedChirper.name}:`;

    // Call Vercel AI Gateway (using OpenAI-compatible API)
    // The gateway is configured in the user's Vercel account
    const response = await fetch('https://gateway.ai.vercel.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VERCEL_AI_GATEWAY_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a cheap, fast model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    // Save the chirper message
    const chirperMessage = await prisma.chirperMessage.create({
      data: {
        content: generatedContent,
        chirperId: selectedChirper.id,
        teamId,
      },
      include: {
        chirper: true,
      },
    });

    return NextResponse.json({
      message: {
        id: chirperMessage.id,
        content: chirperMessage.content,
        createdAt: chirperMessage.createdAt,
        isChirper: true,
        chirperName: selectedChirper.name,
        chirperAvatar: selectedChirper.avatar,
        user: {
          id: `chirper-${selectedChirper.id}`,
          name: selectedChirper.name,
          image: selectedChirper.avatar,
        },
      },
    });
  } catch (error) {
    console.error('Error generating chirper message:', error);
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
  }
}
