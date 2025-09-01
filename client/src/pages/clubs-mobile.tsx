
import React, { useState } from 'react';
import { RefreshCw, Wifi } from 'lucide-react';
import { Header } from '../components/clubs/Header';
import { ClubCard } from '../components/clubs/ClubCard';
import { FilterSheet } from '../components/clubs/FilterSheet';
import { ClubDetailSheet } from '../components/clubs/ClubDetailSheet';
import { Button } from '../components/ui/button';
import { useClubs } from '../hooks/useClubs';
import { Club } from '../types/club';
import { tokens } from '../lib/design-tokens';

export default function ClubsMobile() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: 'all',
    types: [] as string[],
    sortBy: 'nearest' as const
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const { clubs, loading, error, cities, types, refetch } = useClubs({
    searchQuery,
    cityFilter: filters.city,
    typeFilters: filters.types,
    sortBy: filters.sortBy
  });

  const activeFiltersCount = [
    filters.city !== 'all' ? 1 : 0,
    filters.types.length,
    filters.sortBy !== 'nearest' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ backgroundColor: tokens.colors.bg, minHeight: '100vh' }}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setFilterSheetOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />
        <div className="max-w-md mx-auto p-4">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="mb-4 p-4 rounded animate-pulse"
              style={{
                backgroundColor: tokens.colors.card,
                borderRadius: tokens.radius
              }}
            >
              <div className="flex gap-3">
                <div 
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: tokens.colors.border }}
                />
                <div className="flex-1 space-y-2">
                  <div 
                    className="h-5 rounded"
                    style={{ backgroundColor: tokens.colors.border }}
                  />
                  <div 
                    className="h-4 w-2/3 rounded"
                    style={{ backgroundColor: tokens.colors.border }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ backgroundColor: tokens.colors.bg, minHeight: '100vh' }}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setFilterSheetOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />
        <div className="max-w-md mx-auto p-4">
          <div className="text-center py-12">
            <Wifi className="w-16 h-16 mx-auto mb-4" style={{ color: tokens.colors.muted }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: tokens.colors.text }}>
              Холболт алдаа
            </h3>
            <p className="mb-6" style={{ color: tokens.colors.muted }}>
              Интернет холболтоо шалгаад дахин оролдоно уу
            </p>
            <Button
              onClick={refetch}
              style={{
                backgroundColor: tokens.colors.primary,
                color: tokens.colors.bg,
                minHeight: tokens.minTouchTarget,
                borderRadius: tokens.radius
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Дахин оролдох
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: tokens.colors.bg, minHeight: '100vh' }}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => setFilterSheetOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="max-w-md mx-auto p-4">
        {clubs.length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: tokens.colors.card }}
            >
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: tokens.colors.text }}>
              Клуб олдсонгүй
            </h3>
            <p style={{ color: tokens.colors.muted }}>
              Хайлтын нөхцлөө өөрчилж үзнэ үү
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p style={{ color: tokens.colors.muted }}>
                {clubs.length} клуб олдлоо
              </p>
            </div>
            {clubs.map(club => (
              <ClubCard
                key={club.id}
                club={club}
                onDetailClick={setSelectedClub}
              />
            ))}
          </>
        )}
      </div>

      <FilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        cities={cities}
        types={types}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ClubDetailSheet
        club={selectedClub}
        open={!!selectedClub}
        onOpenChange={(open) => !open && setSelectedClub(null)}
      />
    </div>
  );
}
