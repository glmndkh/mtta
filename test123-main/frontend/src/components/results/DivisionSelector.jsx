import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export const DivisionSelector = ({ divisions, category, selectedDivisionId, onSelectDivision }) => {
  const categoryDivisions = divisions.filter(d => d.category === category);

  if (categoryDivisions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Энэ ангиллын дивиз олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Дивиз сонгох
      </label>
      <Select value={selectedDivisionId || ''} onValueChange={onSelectDivision}>
        <SelectTrigger className="w-full md:w-96 h-12 text-lg font-medium">
          <SelectValue placeholder="Дивиз сонгоно уу..." />
        </SelectTrigger>
        <SelectContent>
          {categoryDivisions.map(division => (
            <SelectItem key={division.id} value={division.id} className="text-lg py-3">
              {division.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
