
import React from 'react';

const GKCrackersLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GK Crackers Logo"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(30, 100%, 58%)', stopOpacity: 1 }} /> {/* Vibrant Orange */}
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="35"
        fontFamily="Poppins, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="url(#logoGradient)"
        className="font-headline"
        textAnchor="middle"
      >
        GK Crackers
        <animate 
            attributeName="opacity"
            values="1;0.7;1"
            dur="2s"
            repeatCount="indefinite"
        />
      </text>
      {/* Path 1 - Sparkle */}
      <path stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M20 42 Q 35 50, 50 42 T 80 42; M20 42 Q 35 34, 50 42 T 80 42; M20 42 Q 35 50, 50 42 T 80 42" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="stroke-dasharray" values="0 100; 70 30; 0 100" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0.7;0" dur="1.8s" repeatCount="indefinite"/>
      </path>
       {/* Path 2 - Sparkle */}
       <path stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M120 42 Q 135 34, 150 42 T 180 42; M120 42 Q 135 50, 150 42 T 180 42; M120 42 Q 135 34, 150 42 T 180 42" dur="2.0s" repeatCount="indefinite"/>
         <animate attributeName="stroke-dasharray" values="100 0; 30 70; 100 0" dur="2.0s" repeatCount="indefinite" />
         <animate attributeName="opacity" values="0;1;0.7;0" dur="2.0s" begin="0.2s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
};

export default GKCrackersLogo;
