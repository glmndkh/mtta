import React from 'react';

interface LoadingAnimationProps {
  size?: number;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  size = 200, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Bouncing white balls */}
        <div className="flex space-x-2">
          <div className="w-6 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
          <div className="w-6 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
          <div className="w-6 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;