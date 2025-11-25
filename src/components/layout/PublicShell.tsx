import React from 'react';

interface PublicShellProps {
  children: React.ReactNode;
  className?: string;
}

export const PublicShell = ({ children, className = "" }: PublicShellProps) => {
  return (
    // THE VIEWPORT LOCK for public pages (no dock layer needed)
    <div className="fixed inset-0 w-full h-[100dvh] bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      
      {/* THE SAFE AREA CONTAINER */}
      <div className="relative w-full h-full flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* THE SCROLLABLE ZONE */}
        <main className={`flex-1 overflow-y-auto overscroll-none scroll-smooth no-scrollbar ${className}`}>
          {children}
        </main>

      </div>

      {/* GLOBAL TEXTURE OVERLAY */}
      <div className="absolute inset-0 z-[9999] pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

    </div>
  );
};

export default PublicShell;
