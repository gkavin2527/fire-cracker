
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
        <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1.03; 1"
            begin="0s"
            dur="1.5s"
            repeatCount="indefinite"
            additive="sum"
            transform-origin="center"
        />
      </text>

      {/* Spark 1 */}
      <g>
        <path stroke="hsl(var(--accent))" strokeWidth="1.5" fill="hsl(var(--accent))" strokeLinecap="round">
            <animate
                attributeName="d"
                values="M100 25 L100 25; M90 15 L110 35; M100 25 L100 25"
                dur="1.2s"
                begin="0s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -15 -10; -20 -15"
                dur="1.2s"
                begin="0s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="scale"
                values="0; 1; 0.5; 0"
                dur="1.2s"
                begin="0s"
                repeatCount="indefinite"
                additive="sum" 
                transform-origin="center"/>
            <animate
                attributeName="opacity"
                values="0; 1; 0.5; 0"
                dur="1.2s"
                begin="0s"
                repeatCount="indefinite" />
        </path>
      </g>
      
      {/* Spark 2 */}
      <g>
        <path stroke="hsl(var(--accent))" strokeWidth="1.5" fill="hsl(var(--accent))" strokeLinecap="round">
            <animate
                attributeName="d"
                values="M100 25 L100 25; M105 10 L95 40; M100 25 L100 25"
                dur="1.2s"
                begin="0.3s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 10 -12; 18 -18"
                dur="1.2s"
                begin="0.3s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="scale"
                values="0; 1; 0.5; 0"
                dur="1.2s"
                begin="0.3s"
                repeatCount="indefinite"
                additive="sum"
                transform-origin="center" />
            <animate
                attributeName="opacity"
                values="0; 1; 0.5; 0"
                dur="1.2s"
                begin="0.3s"
                repeatCount="indefinite" />
        </path>
      </g>

       {/* Spark 3 - more horizontal */}
      <g>
        <path stroke="hsl(var(--accent))" strokeWidth="1.5" fill="hsl(var(--accent))" strokeLinecap="round">
            <animate
                attributeName="d"
                values="M100 25 L100 25; M80 25 L120 25; M100 25 L100 25" 
                dur="1.2s"
                begin="0.6s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 5; 0 8" 
                dur="1.2s"
                begin="0.6s"
                repeatCount="indefinite" />
            <animateTransform
                attributeName="transform"
                type="scale"
                values="0; 1; 0.3; 0"
                dur="1.2s"
                begin="0.6s"
                repeatCount="indefinite"
                additive="sum"
                transform-origin="center" />
            <animate
                attributeName="opacity"
                values="0; 1; 0.6; 0"
                dur="1.2s"
                begin="0.6s"
                repeatCount="indefinite" />
        </path>
      </g>
        {/* Spark 4 - small, quick pop */}
      <g>
        <circle r="1" fill="hsl(var(--accent))">
            <animate
                attributeName="cx"
                values="100; 95; 100"
                dur="0.8s"
                begin="0.1s"
                repeatCount="indefinite" />
            <animate
                attributeName="cy"
                values="25; 20; 25"
                dur="0.8s"
                begin="0.1s"
                repeatCount="indefinite" />
            <animate
                attributeName="r"
                values="0; 2.5; 0"
                dur="0.8s"
                begin="0.1s"
                repeatCount="indefinite" />
            <animate
                attributeName="opacity"
                values="0; 1; 0"
                dur="0.8s"
                begin="0.1s"
                repeatCount="indefinite" />
        </circle>
      </g>
       <g>
        <circle r="1" fill="hsl(var(--accent))">
            <animate
                attributeName="cx"
                values="100; 108; 100"
                dur="0.8s"
                begin="0.5s"
                repeatCount="indefinite" />
            <animate
                attributeName="cy"
                values="25; 30; 25"
                dur="0.8s"
                begin="0.5s"
                repeatCount="indefinite" />
            <animate
                attributeName="r"
                values="0; 2; 0"
                dur="0.8s"
                begin="0.5s"
                repeatCount="indefinite" />
            <animate
                attributeName="opacity"
                values="0; 1; 0"
                dur="0.8s"
                begin="0.5s"
                repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

export default GKCrackersLogo;

