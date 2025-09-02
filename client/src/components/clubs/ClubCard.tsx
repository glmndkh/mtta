import React from 'react';
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Club } from '../../types/club';
import { tokens } from '../../lib/design-tokens';

interface ClubCardProps {
  club: Club;
  onDetailClick: (club: Club) => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, onDetailClick }) => {
  return (
    <div
      className="mb-4 p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
      style={{
        backgroundColor: tokens.colors.card,
        borderRadius: tokens.radius,
        border: `1px solid ${tokens.colors.border}`,
        boxShadow: tokens.shadows.card
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = tokens.colors.cardHover;
        e.currentTarget.style.boxShadow = tokens.shadows.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = tokens.colors.card;
        e.currentTarget.style.boxShadow = tokens.shadows.card;
      }}
    >
      <div className="flex gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={club.logo || '/api/placeholder/56/56'}
              alt={`${club.name} лого`}
              className="w-14 h-14 rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
              style={{
                border: `3px solid ${tokens.colors.primary}`,
                boxShadow: `0 0 0 2px ${tokens.colors.card}, 0 0 20px ${tokens.colors.primary}30`
              }}
              loading="lazy"
            />
            {club.verified && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tokens.colors.primary }}
              >
                <CheckCircle
                  className="w-3 h-3"
                  style={{ color: tokens.colors.card }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold text-lg truncate"
              style={{ color: tokens.colors.text }}
            >
              {club.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${tokens.colors.secondary}20` }}
            >
              <MapPin className="w-4 h-4" style={{ color: tokens.colors.secondary }} />
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: tokens.colors.textSecondary }}
            >
              {club.city} • {club.district}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: `${tokens.colors.secondary}15`,
                color: tokens.colors.secondary,
                border: `1px solid ${tokens.colors.secondary}30`
              }}
            >
              {club.type}
            </span>
            {club.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm font-medium" style={{ color: tokens.colors.text }}>
                  {club.rating}
                </span>
              </div>
            )}
          </div>

          {/* Contact chips */}
          <div className="flex gap-2 mb-4">
            {club.phone && (
              <a
                href={`tel:${club.phone}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${tokens.colors.primary}20`,
                  color: tokens.colors.primary,
                  border: `1px solid ${tokens.colors.primary}40`,
                  minHeight: tokens.minTouchTarget,
                  textDecoration: 'none'
                }}
              >
                <Phone className="w-4 h-4" />
                Залгах
              </a>
            )}

            {club.email && (
              <a
                href={`mailto:${club.email}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${tokens.colors.border}`,
                  color: tokens.colors.text,
                  border: `1px solid ${tokens.colors.border}`,
                  minHeight: tokens.minTouchTarget,
                  textDecoration: 'none'
                }}
              >
                <Mail className="w-4 h-4" />
                И-мэйл
              </a>
            )}
          </div>

          {/* Status and Detail button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: club.status === 'active' ? tokens.colors.success : tokens.colors.muted
                }}
              />
              <span
                className="text-sm font-medium"
                style={{
                  color: club.status === 'active' ? tokens.colors.success : tokens.colors.muted
                }}
              >
                {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
              </span>
            </div>

            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white text-xs font-medium px-4 py-2 h-auto min-w-fit whitespace-nowrap"
              onClick={() => onDetailClick(club)}
            >
              Дэлгэрэнгүй
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};