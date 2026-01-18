import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'PHOTO' or 'VIDEO'
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

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

    const where: any = { teamId };
    if (type === 'PHOTO' || type === 'VIDEO') {
      where.type = type;
    }

    const media = await prisma.teamMedia.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (media.length > limit) {
      const nextItem = media.pop();
      nextCursor = nextItem?.id || null;
    }

    return NextResponse.json({
      media,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create media record
    const media = await prisma.teamMedia.create({
      data: {
        type: isImage ? 'PHOTO' : 'VIDEO',
        url: dataUrl,
        title: title || null,
        description: description || null,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id,
        teamId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}
