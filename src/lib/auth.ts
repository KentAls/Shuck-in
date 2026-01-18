import { auth as helloAuth } from '@hellocoop/nextjs';
import prisma from './prisma';

export interface AuthUser {
  id: string;
  sub: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone?: string | null;
  jerseyNumber?: string | null;
  position?: string | null;
}

export interface AuthResult {
  isLoggedIn: boolean;
  user: AuthUser | null;
}

// Server-side auth check
export async function getAuth(): Promise<AuthResult> {
  const hello = await helloAuth();

  if (!hello.isLoggedIn) {
    return { isLoggedIn: false, user: null };
  }

  // Find or create user in database
  let user = await prisma.user.findUnique({
    where: { email: hello.email },
  });

  if (!user && hello.email) {
    // Create user on first login
    user = await prisma.user.create({
      data: {
        email: hello.email,
        name: hello.name || null,
        image: hello.picture || null,
      },
    });
  } else if (user) {
    // Update name if changed (but NOT image - user controls their own profile picture)
    if (user.name !== hello.name && hello.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: hello.name,
        },
      });
    }
  }

  if (!user) {
    return { isLoggedIn: false, user: null };
  }

  return {
    isLoggedIn: true,
    user: {
      id: user.id,
      sub: hello.sub,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone,
      jerseyNumber: user.jerseyNumber,
      position: user.position,
    },
  };
}

// Helper to get user ID from auth
export async function getAuthUserId(): Promise<string | null> {
  const { isLoggedIn, user } = await getAuth();
  return isLoggedIn && user ? user.id : null;
}

// Require auth or throw
export async function requireAuth(): Promise<AuthUser> {
  const { isLoggedIn, user } = await getAuth();
  if (!isLoggedIn || !user) {
    throw new Error('Unauthorized');
  }
  return user;
}
