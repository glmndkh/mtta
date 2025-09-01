import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { tokens } from '../../lib/design-tokens';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  activeFiltersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onFilterClick,
  activeFiltersCount
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearch, onSearchChange]);

  return (
    <header 
      className="sticky top-0 z-50 p-6 border-b backdrop-blur-md"
      style={{
        backgroundColor: `${tokens.colors.bg}95`,
        borderColor: tokens.colors.border,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 
            className="text-3xl font-black mb-2 bg-gradient-to-r bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.secondary})`
            }}
          >
            🏢 Клубууд
          </h1>
          <p className="text-sm" style={{ color: tokens.colors.muted }}>
            Монголын спорт клубуудын мэдээлэл
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
              style={{ color: tokens.colors.primary }}
            />
            <input
              type="text"
              placeholder="Клубын нэр, байршлаар хайх..."
              value={debouncedSearch}
              onChange={(e) => setDebouncedSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-300 focus:scale-[1.02]"
              style={{
                backgroundColor: tokens.colors.card,
                borderColor: tokens.colors.border,
                color: tokens.colors.text,
                minHeight: tokens.minTouchTarget,
                boxShadow: tokens.shadows.card
              }}
              onFocus={(e) => {
                e.target.style.borderColor = tokens.colors.primary;
                e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.primary}20, ${tokens.shadows.card}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = tokens.colors.border;
                e.target.style.boxShadow = tokens.shadows.card;
              }}
            />
          </div>

          <button
            onClick={onFilterClick}
            className="px-4 py-4 rounded-xl border-2 flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 relative"
            style={{
              backgroundColor: tokens.colors.card,
              borderColor: tokens.colors.border,
              color: tokens.colors.text,
              minHeight: tokens.minTouchTarget,
              boxShadow: tokens.shadows.card
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.cardHover;
              e.currentTarget.style.borderColor = tokens.colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.card;
              e.currentTarget.style.borderColor = tokens.colors.border;
            }}
          >
            <Filter className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span 
                className="absolute -top-2 -right-2 w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.card,
                  boxShadow: `0 0 12px ${tokens.colors.primary}60`
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};