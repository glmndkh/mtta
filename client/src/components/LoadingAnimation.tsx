import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoadingAnimationProps {
  size?: number;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  size = 200, 
  className = "" 
}) => {
  const [hasError, setHasError] = useState(false);

  // Fallback CSS loading animation
  const FallbackLoader = () => (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 animate-spin"></div>
      <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-green-400 animate-spin" style={{ animationDirection: 'reverse' }}></div>
      <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
    </div>
  );

  if (hasError) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <FallbackLoader />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/bce4c993-042b-440a-9f37-9f3e1c8a49b1/0c9h2697za.lottie"
          loop
          autoplay
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
};

export default LoadingAnimation;