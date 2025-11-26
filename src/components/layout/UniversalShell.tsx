import React from 'react';

interface UniversalShellProps {
  children: React.ReactNode;
  className?: string;
}

export const UniversalShell = ({ children, className = "" }: UniversalShellProps) => {
  return (
    // 1. THE VIEWPORT LOCK
    // h-[100dvh]: Matches exact visible screen height (fixes Safari address bar issue)
    // w-full: Full width
    // fixed: Prevents the whole page from scrolling/bouncing
    // overflow-hidden: Clips content outside the shell
    <div className="fixed inset-0 w-full h-[100dvh] bg-background text-foreground overflow-hidden overflow-x-hidden font-sans selection:bg-secondary/30">
      
      {/* 2. THE SAFE AREA CONTAINER */}
      {/* pt-[env(safe-area-inset-top)]: Pushes content below The Notch */}
      {/* pb-[env(safe-area-inset-bottom)]: Pushes content above The Home Bar */}
      <div className="relative w-full h-full flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* 3. THE SCROLLABLE ZONE */}
        {/* flex-1: Takes up all remaining space */}
        {/* overflow-y-auto: Allows internal scrolling */}
        {/* overscroll-none: Disables "Rubber Band" bounce on iOS */}
        {/* pb-32: Extra padding at bottom so content isn't hidden behind Floating Docks */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-none scroll-smooth no-scrollbar px-4 pb-32 ${className}`}>
          <div className="max-w-screen-xl mx-auto w-full">
             {children}
          </div>
        </main>

        {/* 4. THE FLOATING DOCK LAYER (Z-Index High) */}
        {/* This layer sits ON TOP of the scroll view for your FOB/Nav */}
        <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 pointer-events-none">
          {/* Content injected here via Portal or fixed position children */}
        </div>

      </div>

      {/* 5. GLOBAL TEXTURE OVERLAY */}
      <div className="absolute inset-0 z-[9999] pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

    </div>
  );
};

export default UniversalShell;
