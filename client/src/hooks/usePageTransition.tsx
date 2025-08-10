import { useState, useEffect } from 'react';

export const usePageTransition = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Quick loading state that turns off after a brief moment
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Just enough time to show the animation briefly

    return () => clearTimeout(timer);
  }, []);

  return { isLoading };
};