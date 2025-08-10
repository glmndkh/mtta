import React from 'react';
import { usePageTransition } from '@/hooks/usePageTransition';
import LoadingAnimation from '@/components/LoadingAnimation';

interface PageWithLoadingProps {
  children: React.ReactNode;
  minimumLoadTime?: number;
}

const PageWithLoading: React.FC<PageWithLoadingProps> = ({ 
  children, 
  minimumLoadTime = 2000 
}) => {
  const { isLoading } = usePageTransition({ minimumLoadTime });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <LoadingAnimation size={300} />
          <p className="text-white text-xl mt-6 opacity-75">
            Уншиж байна...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageWithLoading;