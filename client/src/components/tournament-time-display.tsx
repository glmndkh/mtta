import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface TournamentTimeDisplayProps {
  startDate: string;
  endDate: string;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  status: 'upcoming' | 'live' | 'completed';
}

export default function TournamentTimeDisplay({ startDate, endDate, className = "" }: TournamentTimeDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, status: 'upcoming' });

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      let status: 'upcoming' | 'live' | 'completed';
      let days = 0, hours = 0, minutes = 0;

      if (now < start) {
        // Upcoming event
        status = 'upcoming';
        const difference = start - now;
        days = Math.floor(difference / (1000 * 60 * 60 * 24));
        hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      } else if (now >= start && now <= end) {
        // Live event
        status = 'live';
      } else {
        // Completed event
        status = 'completed';
      }

      setTimeRemaining({ days, hours, minutes, status });
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const formatStartDate = () => {
    const date = new Date(startDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');
  };

  const renderTimeStatus = () => {
    switch (timeRemaining.status) {
      case 'upcoming':
        const timeText = timeRemaining.days > 0 
          ? `${timeRemaining.days}d ${timeRemaining.hours}h`
          : timeRemaining.hours > 0 
            ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
            : `${timeRemaining.minutes}m`;
        
        return (
          <div className="text-sm text-gray-600">
            Starts in <span className="font-semibold text-blue-600">{timeText}</span>
          </div>
        );
      
      case 'live':
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-2 py-1">
            LIVE
          </Badge>
        );
      
      case 'completed':
        return (
          <div className="text-sm text-gray-500 font-medium">
            Completed
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {formatStartDate()}
          </div>
          {renderTimeStatus()}
        </div>
        
        {timeRemaining.status === 'upcoming' && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {timeRemaining.days.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500 uppercase font-medium">
              {timeRemaining.days === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}