import React from 'react';
import { usePageTransition } from '@/hooks/usePageTransition';
import LoadingAnimation from '@/components/LoadingAnimation';

interface PageWithLoadingProps {
  children: React.ReactNode;
}

const PageWithLoading: React.FC<PageWithLoadingProps> = ({ 
  children
}) => {
  const { isLoading } = usePageTransition();

  if (isLoading) {
    return (
      <div className="min-h-screen main-bg flex items-center justify-center">
        <div className="text-center">
          <LoadingAnimation size={120} />
          <p className="text-white text-xl mt-8 opacity-75">
            Уншиж байна...
          </p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen main-bg">{children}</div>;
};

export default PageWithLoading;