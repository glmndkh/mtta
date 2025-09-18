
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface NationalTeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  imageUrl?: string | null;
}

interface ChampionsSpotlightDarkProps {
  variant?: 'default' | 'alt' | 'empty';
  players?: NationalTeamPlayer[];
  currentPlayerIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onPlayerSelect?: (index: number) => void;
}

export const ChampionsSpotlightDark: React.FC<ChampionsSpotlightDarkProps> = ({
  variant = 'default',
  players = [],
  currentPlayerIndex = 0,
  onPrevious,
  onNext,
  onPlayerSelect
}) => {
  const currentPlayer = players[currentPlayerIndex];

  const backgroundClass = variant === 'alt' 
    ? 'bg-black' 
    : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black';

  return (
    <div className={`relative min-h-screen ${backgroundClass} overflow-hidden`}>
      {/* MTTA Logo */}
      <div className="absolute top-6 right-6 z-10">
        <div className="text-white font-bold text-xl tracking-wider">
          MTTA
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-screen flex items-center justify-center px-8">
        {/* Navigation Arrows */}
        {players.length > 1 && onPrevious && onNext && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="absolute left-8 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={onPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={onNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Player Content */}
        <div className="flex items-center gap-16 max-w-6xl mx-auto">
          {/* Player Image */}
          <div className="flex-shrink-0">
            {currentPlayer?.imageUrl ? (
              <img
                src={currentPlayer.imageUrl}
                alt={`${currentPlayer.firstName} ${currentPlayer.lastName}`}
                className="w-[24rem] h-[28rem] object-cover rounded-2xl shadow-2xl"
                style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}
              />
            ) : (
              <div className="w-[24rem] h-[28rem] bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-white text-6xl font-bold opacity-60">
                  {currentPlayer?.firstName?.[0]}{currentPlayer?.lastName?.[0]}
                </div>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="text-white space-y-8">
            {/* Champions Spotlight Title */}
            <div className="mb-8">
              <h2 className="text-green-500 text-sm font-bold tracking-widest uppercase mb-2">
                ҮНДЭСНИЙ ШИГШЭЭ
              </h2>
              <div className="w-12 h-0.5 bg-green-500"></div>
            </div>

            {/* Player Name */}
            <div>
              <h1 
                className="text-6xl font-extrabold leading-tight mb-2"
                style={{ 
                  lineHeight: '0.95',
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
                }}
              >
                {currentPlayer?.firstName || 'Тамирчин'}
              </h1>
              <h2 
                className="text-5xl font-extrabold text-white/90 leading-tight"
                style={{ 
                  lineHeight: '0.95',
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
                }}
              >
                {currentPlayer?.lastName || 'Байхгүй'}
              </h2>
            </div>

            {/* Player Details */}
            {currentPlayer?.age && (
              <div className="text-2xl">
                <span className="text-white/80">Нас:</span>
                <span className="font-bold ml-3">{currentPlayer.age}</span>
              </div>
            )}

            {/* Player Count */}
            {players.length > 0 && (
              <div className="text-white/60 text-lg">
                {currentPlayerIndex + 1} / {players.length}
              </div>
            )}
          </div>
        </div>

        {/* Dots Indicator */}
        {players.length > 1 && onPlayerSelect && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-3">
            {players.map((_, index) => (
              <button
                key={index}
                onClick={() => onPlayerSelect(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentPlayerIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-48 h-56 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <div className="text-6xl font-bold opacity-40">
                МТ
              </div>
            </div>
            <h1 
              className="text-6xl font-extrabold leading-tight mb-4"
              style={{ 
                lineHeight: '0.95',
                textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
              }}
            >
              Үндэсний Шигшээ
            </h1>
            <p className="text-white/70 text-xl">Тун удахгүй...</p>
          </div>
        </div>
      )}
    </div>
  );
};
