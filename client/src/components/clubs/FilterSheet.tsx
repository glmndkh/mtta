import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { tokens } from '../../lib/design-tokens';

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cities: string[];
  types: string[];
  filters: {
    city: string;
    types: string[];
    sortBy: 'nearest' | 'newest' | 'rating';
  };
  onFiltersChange: (filters: any) => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  open,
  onOpenChange,
  cities,
  types,
  filters,
  onFiltersChange
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      city: 'all',
      types: [],
      sortBy: 'nearest' as const
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeCount = [
    localFilters.city !== 'all' ? 1 : 0,
    localFilters.types.length,
    localFilters.sortBy !== 'nearest' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh]"
        style={{
          backgroundColor: tokens.colors.bg,
          borderColor: tokens.colors.border
        }}
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle style={{ color: tokens.colors.text }}>
              Шүүлтүүр
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              style={{
                color: tokens.colors.muted,
                width: tokens.minTouchTarget,
                height: tokens.minTouchTarget
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-20">
          {/* City Filter */}
          <div>
            <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
              Хот
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={localFilters.city === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                style={{
                  backgroundColor: localFilters.city === 'all' ? tokens.colors.primary : 'transparent',
                  borderColor: tokens.colors.border,
                  color: localFilters.city === 'all' ? tokens.colors.bg : tokens.colors.text,
                  minHeight: tokens.minTouchTarget
                }}
                onClick={() => setLocalFilters({ ...localFilters, city: 'all' })}
              >
                Бүгд
              </Badge>
              {cities.map(city => (
                <Badge
                  key={city}
                  variant={localFilters.city === city ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: localFilters.city === city ? tokens.colors.primary : 'transparent',
                    borderColor: tokens.colors.border,
                    color: localFilters.city === city ? tokens.colors.bg : tokens.colors.text,
                    minHeight: tokens.minTouchTarget
                  }}
                  onClick={() => setLocalFilters({ ...localFilters, city })}
                >
                  {city}
                </Badge>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
              Төрөл
            </h3>
            <div className="space-y-3">
              {types.map(type => (
                <div key={type} className="flex items-center space-x-3">
                  <Checkbox
                    id={type}
                    checked={localFilters.types.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocalFilters({
                          ...localFilters,
                          types: [...localFilters.types, type]
                        });
                      } else {
                        setLocalFilters({
                          ...localFilters,
                          types: localFilters.types.filter(t => t !== type)
                        });
                      }
                    }}
                    style={{
                      borderColor: tokens.colors.border,
                      width: tokens.minTouchTarget,
                      height: tokens.minTouchTarget
                    }}
                  />
                  <label 
                    htmlFor={type}
                    className="cursor-pointer flex-1"
                    style={{ color: tokens.colors.text }}
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
              Эрэмбэлэх
            </h3>
            <div className="space-y-2">
              {[
                { key: 'nearest', label: 'Ойрхон' },
                { key: 'newest', label: 'Шинээр' },
                { key: 'rating', label: 'Үнэлгээ' }
              ].map(({ key, label }) => (
                <Badge
                  key={key}
                  variant={localFilters.sortBy === key ? 'default' : 'outline'}
                  className="cursor-pointer w-full justify-start"
                  style={{
                    backgroundColor: localFilters.sortBy === key ? tokens.colors.primary : 'transparent',
                    borderColor: tokens.colors.border,
                    color: localFilters.sortBy === key ? tokens.colors.bg : tokens.colors.text,
                    minHeight: tokens.minTouchTarget
                  }}
                  onClick={() => setLocalFilters({ ...localFilters, sortBy: key as any })}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 border-t flex gap-3"
          style={{
            backgroundColor: tokens.colors.bg,
            borderColor: tokens.colors.border
          }}
        >
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
            style={{
              borderColor: tokens.colors.border,
              color: tokens.colors.text,
              minHeight: tokens.minTouchTarget,
              borderRadius: tokens.radius
            }}
          >
            Цэвэрлэх
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.bg,
              minHeight: tokens.minTouchTarget,
              borderRadius: tokens.radius
            }}
          >
            Хэрэглэх {activeCount > 0 && `(${activeCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};