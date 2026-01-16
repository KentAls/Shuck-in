import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone?: string | null;
      jerseyNumber?: string | null;
      position?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    phone?: string | null;
    jerseyNumber?: string | null;
    position?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
  }
}
