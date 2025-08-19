import React from "react";
import Navigation from "@/components/navigation";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <>
      <Navigation />
      <div className="main-bg">
        <div className={`container mx-auto px-4 py-8 ${className}`}>{children}</div>
      </div>
    </>
  );
}
