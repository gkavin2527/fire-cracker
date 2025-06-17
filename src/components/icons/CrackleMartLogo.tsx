
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
          <stop offset="100%" style={{ stopColor: 'hsl(30, 100%, 58%)', stopOpacity: 1 }} />
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

      {/* Spark Burst Group - Centered for spark animations */}
      <g transform="translate(100 25)">
        {/* Central Flash */}
        <circle fill="hsl(var(--accent))" cx="0" cy="0">
          <animate attributeName="r" values="0; 8; 0" dur="0.5s" begin="0s; 2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0; 0.8; 0" dur="0.5s" begin="0s; 2s" repeatCount="indefinite" />
        </circle>

        {/* Spark Particles (8 sparks) */}
        {[
          { cx: 40, cy: 0, begin: "0s" }, { cx: 28, cy: 28, begin: "0.2s" },
          { cx: 0, cy: 35, begin: "0.4s" }, { cx: -28, cy: 28, begin: "0.6s" },
          { cx: -40, cy: 0, begin: "0.8s" }, { cx: -28, cy: -28, begin: "1.0s" },
          { cx: 0, cy: -35, begin: "1.2s" }, { cx: 28, cy: -28, begin: "1.4s" }
        ].map((spark, i) => (
          <circle key={i} fill="hsl(var(--accent))" cx="0" cy="0" r="0">
            <animate attributeName="cx" values={`0; ${spark.cx}`} dur="1.2s" begin={spark.begin} repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.42 0 0.58 1"/>
            <animate attributeName="cy" values={`0; ${spark.cy}`} dur="1.2s" begin={spark.begin} repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.42 0 0.58 1"/>
            <animate attributeName="r" values="0; 3.5; 1.5; 0" dur="1.2s" begin={spark.begin} repeatCount="indefinite" keyTimes="0; 0.4; 0.8; 1" />
            <animate attributeName="opacity" values="0; 1; 1; 0" dur="1.2s" begin={spark.begin} repeatCount="indefinite" keyTimes="0; 0.2; 0.8; 1"/>
          </circle>
        ))}
      </g>
    </svg>
  );
};

export default GKCrackersLogo;
