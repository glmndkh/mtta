import React from 'react';
import { X, Phone, Mail, MapPin, Clock, GraduationCap, Wrench, Star } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Club } from '../../types/club';
import { tokens } from '../../lib/design-tokens';

interface ClubDetailSheetProps {
  club: Club | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClubDetailSheet: React.FC<ClubDetailSheetProps> = ({
  club,
  open,
  onOpenChange
}) => {
  if (!club) return null;

  const handleCall = () => {
    if (club.phone) {
      window.location.href = `tel:${club.phone}`;
    }
  };

  const handleMapOpen = () => {
    if (club.coordinates) {
      const url = `https://maps.google.com/?q=${club.coordinates.lat},${club.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

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
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tokens.colors.primary }}
              >
                {club.logo ? (
                  <img 
                    src={club.logo} 
                    alt={club.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold" style={{ color: tokens.colors.bg }}>
                    {club.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <SheetTitle style={{ color: tokens.colors.text }}>
                  {club.name}
                </SheetTitle>
                <div className="flex items-center gap-2">
                  {club.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" style={{ color: '#FFD700' }} />
                      <span style={{ color: tokens.colors.muted }}>{club.rating}</span>
                    </div>
                  )}
                  <Badge 
                    variant={club.status === 'active' ? 'default' : 'secondary'}
                    style={{
                      backgroundColor: club.status === 'active' ? tokens.colors.primary : tokens.colors.muted,
                      color: tokens.colors.bg
                    }}
                  >
                    {club.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Badge>
                </div>
              </div>
            </div>
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

        <div className="space-y-6 pb-20 overflow-y-auto">
          {/* Description */}
          {club.description && (
            <section>
              <h3 className="font-medium mb-2" style={{ color: tokens.colors.text }}>
                Тайлбар
              </h3>
              <p style={{ color: tokens.colors.muted }}>
                {club.description}
              </p>
            </section>
          )}

          {/* Location */}
          <section>
            <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
              Байршил
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1" style={{ color: tokens.colors.muted }} />
                <span style={{ color: tokens.colors.muted }}>
                  {club.address || `${club.city}, ${club.district}`}
                </span>
              </div>
              {club.coordinates && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMapOpen}
                  style={{
                    borderColor: tokens.colors.border,
                    color: tokens.colors.text,
                    minHeight: tokens.minTouchTarget,
                    borderRadius: tokens.radius
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Газрын зураг нээх
                </Button>
              )}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
              Холбоо барих
            </h3>
            <div className="space-y-2">
              {club.phone && (
                <a 
                  href={`tel:${club.phone}`}
                  className="flex items-center gap-2 p-2 rounded"
                  style={{
                    color: tokens.colors.primary,
                    backgroundColor: tokens.colors.card,
                    minHeight: tokens.minTouchTarget
                  }}
                >
                  <Phone className="w-4 h-4" />
                  {club.phone}
                </a>
              )}
              {club.email && (
                <a 
                  href={`mailto:${club.email}`}
                  className="flex items-center gap-2 p-2 rounded"
                  style={{
                    color: tokens.colors.primary,
                    backgroundColor: tokens.colors.card,
                    minHeight: tokens.minTouchTarget
                  }}
                >
                  <Mail className="w-4 h-4" />
                  {club.email}
                </a>
              )}
            </div>
          </section>

          {/* Schedule */}
          {club.schedule && (
            <section>
              <h3 className="font-medium mb-2" style={{ color: tokens.colors.text }}>
                Цагийн хуваарь
              </h3>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-1" style={{ color: tokens.colors.muted }} />
                <span style={{ color: tokens.colors.muted }}>
                  {club.schedule}
                </span>
              </div>
            </section>
          )}

          {/* Training */}
          {club.training && (
            <section>
              <h3 className="font-medium mb-2" style={{ color: tokens.colors.text }}>
                Сургалт
              </h3>
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 mt-1" style={{ color: tokens.colors.muted }} />
                <span style={{ color: tokens.colors.muted }}>
                  {club.training}
                </span>
              </div>
            </section>
          )}

          {/* Coaches */}
          {club.coaches && club.coaches.length > 0 && (
            <section>
              <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
                Дасгалжуулагч
              </h3>
              <div className="space-y-2">
                {club.coaches.map((coach, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 rounded"
                    style={{ backgroundColor: tokens.colors.card }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tokens.colors.primary }}
                    >
                      <span style={{ color: tokens.colors.bg, fontSize: '12px' }}>
                        {coach.charAt(0)}
                      </span>
                    </div>
                    <span style={{ color: tokens.colors.text }}>{coach}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Equipment */}
          {club.equipment && club.equipment.length > 0 && (
            <section>
              <h3 className="font-medium mb-3" style={{ color: tokens.colors.text }}>
                Тоног төхөөрөмж
              </h3>
              <div className="space-y-2">
                {club.equipment.map((equipment, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4" style={{ color: tokens.colors.muted }} />
                    <span style={{ color: tokens.colors.muted }}>{equipment}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Fixed bottom CTA */}
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 border-t"
          style={{
            backgroundColor: tokens.colors.bg,
            borderColor: tokens.colors.border
          }}
        >
          <Button
            onClick={handleCall}
            disabled={!club.phone}
            className="w-full py-3 text-sm min-h-[44px]"
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.bg,
              borderRadius: tokens.radius
            }}
          >
            <Phone className="w-4 h-4 mr-2" />
            Залгах
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};