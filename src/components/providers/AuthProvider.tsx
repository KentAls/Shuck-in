'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface AuthUser {
  id: string;
  sub: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone?: string | null;
  jerseyNumber?: string | null;
  position?: string | null;
}

interface AuthContextType {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoading: true,
  isLoggedIn: false,
  user: null,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/hellocoop?op=auth');
      const data = await res.json();

      if (data.isLoggedIn) {
        // Fetch full user data from our API
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser({
            id: userData.id,
            sub: data.sub,
            name: userData.name || data.name,
            email: userData.email || data.email,
            image: userData.image || data.picture,
            phone: userData.phone,
            jerseyNumber: userData.jerseyNumber,
            position: userData.position,
          });
          setIsLoggedIn(true);
        } else {
          // User not in DB yet, use Hello data
          setUser({
            id: data.sub,
            sub: data.sub,
            name: data.name,
            email: data.email,
            image: data.picture,
          });
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching auth:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        user,
        refresh: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
