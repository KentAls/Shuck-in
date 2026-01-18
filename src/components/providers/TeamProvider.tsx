'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCacheKey, getCache, setCache, getStaleCache } from '@/lib/cache';

const DEFAULT_TEAM_KEY = 'shuckin_default_team';

interface Team {
  id: string;
  name: string;
  sport: string;
  color: string;
  logo: string | null;
  userRole: string | null;
  _count?: {
    members: number;
  };
}

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeamId: (teamId: string | null) => void;
  isLoading: boolean;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  teams: [],
  currentTeam: null,
  setCurrentTeamId: () => {},
  isLoading: true,
  refreshTeams: async () => {},
});

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load default team from localStorage on mount
  useEffect(() => {
    const storedDefault = localStorage.getItem(DEFAULT_TEAM_KEY);
    if (storedDefault) {
      setCurrentTeamIdState(storedDefault);
    }
  }, []);

  // Fetch teams
  const refreshTeams = useCallback(async () => {
    // Load cached teams immediately
    const cached = getStaleCache<Team[]>(getCacheKey('teams'));
    if (cached) {
      setTeams(cached);
      // Auto-select first team if no current team
      if (!currentTeamId && cached.length > 0) {
        const defaultId = localStorage.getItem(DEFAULT_TEAM_KEY);
        if (defaultId && cached.find(t => t.id === defaultId)) {
          setCurrentTeamIdState(defaultId);
        } else {
          setCurrentTeamIdState(cached[0].id);
        }
      }
      setIsLoading(false);
    }

    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        setCache(getCacheKey('teams'), data);

        // Auto-select first team if no current team
        if (!currentTeamId && data.length > 0 && !cached) {
          const defaultId = localStorage.getItem(DEFAULT_TEAM_KEY);
          if (defaultId && data.find((t: Team) => t.id === defaultId)) {
            setCurrentTeamIdState(defaultId);
          } else {
            setCurrentTeamIdState(data[0].id);
          }
        }

        // Auto-set default if user only has one team
        if (data.length === 1) {
          localStorage.setItem(DEFAULT_TEAM_KEY, data[0].id);
          setCurrentTeamIdState(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeamId]);

  // Fetch teams on mount
  useEffect(() => {
    refreshTeams();
  }, []);

  // Set current team and persist to localStorage
  const setCurrentTeamId = useCallback((teamId: string | null) => {
    setCurrentTeamIdState(teamId);
    if (teamId) {
      localStorage.setItem(DEFAULT_TEAM_KEY, teamId);
    } else {
      localStorage.removeItem(DEFAULT_TEAM_KEY);
    }
  }, []);

  // Get current team object
  const currentTeam = teams.find(t => t.id === currentTeamId) || teams[0] || null;

  return (
    <TeamContext.Provider
      value={{
        teams,
        currentTeam,
        setCurrentTeamId,
        isLoading,
        refreshTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
