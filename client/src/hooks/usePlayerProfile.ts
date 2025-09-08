
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type PlayerProfile = {
  id?: string;
  fullName: string;
  gender: 'male' | 'female';
  birthDate: string;
};

export function usePlayerProfile() {
  const { user, isAuthenticated } = useAuth();

  const { data: profile, isLoading, error } = useQuery<PlayerProfile>({
    queryKey: ['/api/players/me'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return null;
      }

      try {
        // Try /api/players/me first
        const response = await fetch('/api/players/me');
        if (response.ok) {
          const data = await response.json();
          return {
            id: data.id,
            fullName: data.fullName || data.name || 'Unknown',
            gender: data.gender || 'male',
            birthDate: data.birthDate || '1990-01-01'
          };
        }
      } catch (error) {
        console.log('Failed to fetch from /api/players/me, trying fallback');
      }

      try {
        // Try /api/me as fallback
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          return {
            id: data.id,
            fullName: data.fullName || data.name || 'Unknown',
            gender: data.gender || 'male',
            birthDate: data.birthDate || '1990-01-01'
          };
        }
      } catch (error) {
        console.log('Failed to fetch from /api/me, using user object');
      }

      // Fallback to user object conversion
      if (user) {
        const emailName = user.email?.split('@')[0] || 'Unknown';
        return {
          id: user.id,
          fullName: user.fullName || user.name || emailName,
          gender: user.gender || 'male',
          birthDate: user.birthDate || '1990-01-01'
        };
      }

      return null;
    },
    enabled: isAuthenticated,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    profile,
    loading: isLoading,
    error
  };
}
