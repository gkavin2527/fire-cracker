
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
        transform-origin="center" 
      >
        GK Crackers
        <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1.05; 1" 
            begin="0s"
            dur="2s"
            repeatCount="indefinite"
        />
      </text>

      {/* Spark Group - Centralized for easier translation control if needed */}
      <g transform="translate(100 25)"> {/* Centered around origin for spark calculations */}
        {/* Spark 1 */}
        <circle fill="hsl(var(--accent))">
          <animate attributeName="cx" values="0; -20; -30" dur="1.2s" begin="0s" repeatCount="indefinite" />
          <animate attributeName="cy" values="0; -15; -20" dur="1.2s" begin="0s" repeatCount="indefinite" />
          <animate attributeName="r" values="0; 3; 0" dur="1.2s" begin="0s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="1.2s" begin="0s" repeatCount="indefinite" />
        </circle>

        {/* Spark 2 */}
        <circle fill="hsl(var(--accent))">
          <animate attributeName="cx" values="0; 25; 35" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="0; 0; 5" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          <animate attributeName="r" values="0; 3.5; 0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        </circle>

        {/* Spark 3 */}
        <circle fill="hsl(var(--accent))">
          <animate attributeName="cx" values="0; 5; 10" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="0; 20; 28" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="r" values="0; 2.5; 0" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        
        {/* Spark 4 - A smaller, quicker one */}
        <circle fill="hsl(var(--accent))">
          <animate attributeName="cx" values="0; -10; -15" dur="0.9s" begin="0.2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="0; 10; 18" dur="0.9s" begin="0.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="0; 2; 0" dur="0.9s" begin="0.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 1; 0" dur="0.9s" begin="0.2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

export default GKCrackersLogo;
