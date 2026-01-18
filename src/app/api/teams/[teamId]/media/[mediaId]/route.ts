import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; mediaId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, mediaId } = params;

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

    const media = await prisma.teamMedia.findFirst({
      where: {
        id: mediaId,
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

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; mediaId: string } }
) {
  try {
    const { isLoggedIn, user } = await getAuth();
    if (!isLoggedIn || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, mediaId } = params;

    // Get the media to check ownership
    const media = await prisma.teamMedia.findFirst({
      where: {
        id: mediaId,
        teamId,
      },
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Check if user is the uploader or an admin/owner
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

    const isUploader = media.uploadedById === user.id;
    const isAdmin = membership.role === 'ADMIN' || membership.role === 'OWNER';

    if (!isUploader && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the uploader or team admins can delete this media' },
        { status: 403 }
      );
    }

    await prisma.teamMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
