import { useState, useEffect } from 'react';

interface UsePageTransitionProps {
  minimumLoadTime?: number;
}

export const usePageTransition = ({ minimumLoadTime = 2000 }: UsePageTransitionProps = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = minimumLoadTime - elapsedTime;
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } else {
        setIsLoading(false);
      }
    }, 100); // Small delay to ensure smooth transition

    return () => clearTimeout(timer);
  }, [startTime, minimumLoadTime]);

  return { isLoading };
};