import { useMemo } from "react";

interface MemberAvatarCircleProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

interface AvatarPattern {
  colors: [string, string];
  pattern: 'gradient' | 'circles' | 'waves' | 'triangles';
}

function generateAvatarPattern(name: string): AvatarPattern {
  // Hash name to seed
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Select 2 colors from palette
  const colorPairs: [string, string][] = [
    ['#D69E2E', '#70E098'], // Gold + Sage
    ['#70E098', '#38BDF8'], // Sage + Sky
    ['#38BDF8', '#D97757'], // Sky + Terracotta
    ['#D97757', '#D69E2E'], // Terracotta + Gold
  ];
  const colors = colorPairs[hash % colorPairs.length];
  
  // Select pattern type
  const patterns: ('gradient' | 'circles' | 'waves' | 'triangles')[] = ['gradient', 'circles', 'waves', 'triangles'];
  const pattern = patterns[Math.floor(hash / 10) % patterns.length];
  
  return { colors, pattern };
}

export const MemberAvatarCircle = ({ name, size = 'md' }: MemberAvatarCircleProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-18 h-18 text-xl',
  };

  const pattern = useMemo(() => generateAvatarPattern(name || 'User'), [name]);
  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center relative flex-shrink-0`}>
      <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
        <defs>
          <linearGradient id={`grad-${name}-${pattern.pattern}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={pattern.colors[0]} />
            <stop offset="100%" stopColor={pattern.colors[1]} />
          </linearGradient>
        </defs>
        
        {pattern.pattern === 'gradient' && (
          <rect width="100" height="100" fill={`url(#grad-${name}-${pattern.pattern})`} />
        )}
        
        {pattern.pattern === 'circles' && (
          <>
            <rect width="100" height="100" fill={pattern.colors[0]} />
            <circle cx="30" cy="30" r="25" fill={pattern.colors[1]} opacity="0.6" />
            <circle cx="70" cy="70" r="25" fill={pattern.colors[1]} opacity="0.4" />
          </>
        )}
        
        {pattern.pattern === 'waves' && (
          <>
            <rect width="100" height="100" fill={pattern.colors[0]} />
            <path
              d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
              fill={pattern.colors[1]}
              opacity="0.5"
            />
          </>
        )}
        
        {pattern.pattern === 'triangles' && (
          <>
            <rect width="100" height="100" fill={pattern.colors[0]} />
            <polygon points="50,10 90,90 10,90" fill={pattern.colors[1]} opacity="0.5" />
          </>
        )}
      </svg>
      
      <span className="relative z-10 font-medium text-background mix-blend-difference">
        {initial}
      </span>
    </div>
  );
};
