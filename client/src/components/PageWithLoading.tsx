import React from "react";
import { usePageTransition } from "@/hooks/usePageTransition";
import LoadingAnimation from "@/components/LoadingAnimation";

interface PageWithLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: unknown;
  fallback?: React.ReactNode;
}

const PageWithLoading: React.FC<PageWithLoadingProps> = ({
  children,
  isLoading,
  error,
  fallback,
}) => {
  const { isLoading: transitionLoading } = usePageTransition();
  const showLoading = typeof isLoading === "boolean" ? isLoading || transitionLoading : transitionLoading;

  if (error) {
    return (
      <div className="main-bg flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-950/80 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl font-semibold">Мэдээлэл авахад алдаа гарлаа</h2>
          <p className="mt-3 text-sm text-emerald-100/80">
            Түр хүлээгээд дахин оролдоно уу. Хэрэв асуудал үргэлжилбэл системийн администраторт мэдэгдэнэ үү.
          </p>
        </div>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="main-bg flex min-h-screen items-center justify-center">
        {fallback ?? (
          <div className="text-center">
            <LoadingAnimation size={120} />
            <p className="mt-8 text-xl text-white opacity-75">Уншиж байна...</p>
          </div>
        )}
      </div>
    );
  }

  return <div className="main-bg min-h-screen">{children}</div>;
};

export default PageWithLoading;
