
import { useState, useEffect, useMemo } from 'react';
import { Club } from '../types/club';

interface UseClubsOptions {
  searchQuery?: string;
  cityFilter?: string;
  typeFilters?: string[];
  sortBy?: 'nearest' | 'newest' | 'rating';
}

export const useClubs = (options: UseClubsOptions = {}) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/clubs.json');
        if (!response.ok) throw new Error('Failed to fetch clubs');
        const data = await response.json();
        setClubs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const filteredClubs = useMemo(() => {
    let filtered = [...clubs];

    // Search filter
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(query) ||
        club.city.toLowerCase().includes(query) ||
        club.district.toLowerCase().includes(query)
      );
    }

    // City filter
    if (options.cityFilter && options.cityFilter !== 'all') {
      filtered = filtered.filter(club => club.city === options.cityFilter);
    }

    // Type filters
    if (options.typeFilters && options.typeFilters.length > 0) {
      filtered = filtered.filter(club => options.typeFilters!.includes(club.type));
    }

    // Sort
    switch (options.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'nearest':
      default:
        // Keep original order for now
        break;
    }

    return filtered;
  }, [clubs, options]);

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(clubs.map(club => club.city)));
    return uniqueCities;
  }, [clubs]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(clubs.map(club => club.type)));
    return uniqueTypes;
  }, [clubs]);

  return {
    clubs: filteredClubs,
    loading,
    error,
    cities,
    types,
    refetch: () => {
      setError(null);
      setLoading(true);
      // Re-trigger fetch
    }
  };
};
