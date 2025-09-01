
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
    <Card 
      className="mb-4"
      style={{
        backgroundColor: tokens.colors.card,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: tokens.colors.primary }}
          >
            {club.logo ? (
              <img 
                src={club.logo} 
                alt={club.name}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: tokens.colors.bg }}>
                {club.name.charAt(0)}
              </span>
            )}
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
              {club.verified && (
                <CheckCircle 
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: tokens.colors.primary }}
                />
              )}
            </div>

            <div className="flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3" style={{ color: tokens.colors.muted }} />
              <span 
                className="text-sm truncate"
                style={{ color: tokens.colors.muted }}
              >
                {club.city} • {club.district} • {club.type}
              </span>
            </div>

            {/* Contact chips */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {club.phone && (
                <a 
                  href={`tel:${club.phone}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: tokens.colors.bg,
                    color: tokens.colors.primary,
                    minHeight: tokens.minTouchTarget
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  {club.phone}
                </a>
              )}
              {club.email && (
                <a 
                  href={`mailto:${club.email}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: tokens.colors.bg,
                    color: tokens.colors.primary,
                    minHeight: tokens.minTouchTarget
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="w-3 h-3" />
                  {club.email}
                </a>
              )}
            </div>

            {/* Status and Detail button */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={club.status === 'active' ? 'default' : 'secondary'}
                style={{
                  backgroundColor: club.status === 'active' ? tokens.colors.primary : tokens.colors.muted,
                  color: tokens.colors.bg
                }}
              >
                {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDetailClick(club)}
                style={{
                  borderColor: tokens.colors.primary,
                  color: tokens.colors.primary,
                  minHeight: tokens.minTouchTarget,
                  borderRadius: tokens.radius
                }}
                className="focus:ring-2 focus:ring-offset-2"
              >
                Дэлгэрэнгүй
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
