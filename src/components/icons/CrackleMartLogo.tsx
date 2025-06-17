
import React from 'react';

const GKCrackersLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50" // Adjusted viewBox slightly if text width changes
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GK Crackers Logo"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="50%" // Use percentage for centering with text-anchor
        y="35"
        fontFamily="Poppins, sans-serif"
        fontSize="28" // Slightly reduced font size to ensure "GK Crackers" fits well
        fontWeight="bold"
        fill="url(#logoGradient)"
        className="font-headline"
        textAnchor="middle" // Center text horizontally
      >
        GK Crackers
        <animate 
          attributeName="font-size" 
          values="28;28.5;28" 
          dur="2.5s" 
          repeatCount="indefinite" 
        />
        <animate 
            attributeName="opacity"
            values="1;0.9;1"
            dur="2.5s"
            repeatCount="indefinite"
        />
      </text>
      {/* Adjusted path animations to be more spread and dynamic */}
      <path d="M20 42 Q 35 50, 50 42 T 80 42" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M20 42 Q 35 50, 50 42 T 80 42; M20 42 Q 35 34, 50 42 T 80 42; M20 42 Q 35 50, 50 42 T 80 42" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="stroke-dasharray" values="0 100;50 50;0 100" dur="1.8s" repeatCount="indefinite" />
      </path>
       <path d="M120 42 Q 135 34, 150 42 T 180 42" stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M120 42 Q 135 34, 150 42 T 180 42; M120 42 Q 135 50, 150 42 T 180 42; M120 42 Q 135 34, 150 42 T 180 42" dur="2.2s" repeatCount="indefinite"/>
         <animate attributeName="stroke-dasharray" values="100 0;50 50; 100 0" dur="2.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};

export default GKCrackersLogo;
