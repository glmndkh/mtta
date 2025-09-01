
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
      className="sticky top-0 z-50 p-4 border-b"
      style={{ 
        backgroundColor: tokens.colors.bg,
        borderColor: tokens.colors.border
      }}
    >
      <div className="max-w-md mx-auto space-y-3">
        <h1 
          className="text-2xl font-bold text-center"
          style={{ color: tokens.colors.text }}
        >
          Клубууд
        </h1>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: tokens.colors.muted }}
            />
            <Input
              placeholder="Клуб хайх..."
              value={debouncedSearch}
              onChange={(e) => setDebouncedSearch(e.target.value)}
              className="pl-10 h-11"
              style={{
                backgroundColor: tokens.colors.card,
                borderColor: tokens.colors.border,
                color: tokens.colors.text,
                borderRadius: tokens.radius
              }}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onFilterClick}
            className="relative"
            style={{
              backgroundColor: tokens.colors.card,
              borderColor: tokens.colors.border,
              color: tokens.colors.text,
              width: tokens.minTouchTarget,
              height: tokens.minTouchTarget,
              borderRadius: tokens.radius
            }}
          >
            <Filter className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.bg
                }}
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
