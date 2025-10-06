
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import mttaLogo from '@assets/download_1758183783829.png';

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
    ? 'bg-white dark:bg-black' 
    : 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-900 dark:to-black';

  return (
    <div className={`relative min-h-screen ${backgroundClass} overflow-hidden`}>
      {/* MTTA Logo - Centered at top */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <img 
          src={mttaLogo} 
          alt="MTTA Logo" 
          className="h-8 sm:h-10 md:h-12 w-auto"
        />
      </div>

      {/* Navigation Arrows - Mobile optimized */}
      {players.length > 1 && onPrevious && onNext && (
        <>
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 z-10 md:left-8"
            onClick={onPrevious}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 z-10 md:right-8"
            onClick={onNext}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
        </>
      )}

      {/* Main Content - Horizontal layout with text left, image right */}
      <div className="relative h-screen flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24">
        {/* Content Section - Left Side */}
        <div className="text-black dark:text-white text-left space-y-4 md:space-y-6 max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl md:mr-8">
          {/* National Team Label */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-green-500 text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase">
              ҮНДЭСНИЙ ШИГШЭЭ
            </h2>
          </div>

          {/* Player Name */}
          <div className="space-y-1 md:space-y-2">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-none tracking-tight"
              style={{ 
                fontFamily: 'Arial, sans-serif',
                textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
              }}
            >
              {currentPlayer?.firstName || 'Тамирчин'}
            </h1>
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-black/95 dark:text-white/95 leading-none tracking-tight"
              style={{ 
                fontFamily: 'Arial, sans-serif',
                textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
              }}
            >
              {currentPlayer?.lastName || 'MOHAMED'}
            </h2>
          </div>

          {/* Player Age */}
          {currentPlayer?.age && (
            <div className="text-lg sm:text-xl md:text-2xl font-medium">
              <span className="text-black/90 dark:text-white/90">Нас</span>
              <span className="font-bold ml-2 text-black dark:text-white">{currentPlayer.age}</span>
            </div>
          )}
        </div>

        {/* Player Image - Right Side */}
        <div className="flex-shrink-0 mt-8 md:mt-0">
          {currentPlayer?.imageUrl ? (
            <img
              src={currentPlayer.imageUrl}
              alt={`${currentPlayer.firstName} ${currentPlayer.lastName}`}
              className="w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-80 lg:w-80 lg:h-96 xl:w-96 xl:h-[28rem] object-cover rounded-xl md:rounded-2xl shadow-2xl"
              style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.7))' }}
            />
          ) : (
            <div className="w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-80 lg:w-80 lg:h-96 xl:w-96 xl:h-[28rem] bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl">
              <div className="text-black dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold opacity-60">
                {currentPlayer?.firstName?.[0]}{currentPlayer?.lastName?.[0]}
              </div>
            </div>
          )}
        </div>

        {/* Dots Indicator */}
        {players.length > 1 && onPlayerSelect && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3">
            {players.map((_, index) => (
              <button
                key={index}
                onClick={() => onPlayerSelect(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentPlayerIndex 
                    ? 'bg-black dark:bg-white scale-125' 
                    : 'bg-black/40 dark:bg-white/40 hover:bg-black/70 dark:hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="text-center text-black dark:text-white">
            <div className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl md:rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <div className="text-black dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold opacity-40">
                МТ
              </div>
            </div>
            
            {/* National Team Label */}
            <div className="mb-4 md:mb-6">
              <h2 className="text-green-500 text-xs sm:text-sm md:text-base font-bold tracking-widest uppercase">
                ҮНДЭСНИЙ ШИГШЭЭ
              </h2>
            </div>
            
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-none tracking-tight mb-4"
              style={{ 
                textShadow: '0 0 20px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.8)'
              }}
            >
              Үндэсний Шигшээ
            </h1>
            <p className="text-black/70 dark:text-white/70 text-lg sm:text-xl">Тун удахгүй...</p>
          </div>
        </div>
      )}
    </div>
  );
};
