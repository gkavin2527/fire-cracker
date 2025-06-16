import React from 'react';

const CrackleMartLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CrackleMart Logo"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="10"
        y="35"
        fontFamily="Poppins, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="url(#logoGradient)"
        className="font-headline"
      >
        CrackleMart
      </text>
      <path d="M10 40 Q 25 48, 40 40 T 70 40" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M10 40 Q 25 48, 40 40 T 70 40; M10 40 Q 25 32, 40 40 T 70 40; M10 40 Q 25 48, 40 40 T 70 40" dur="1.5s" repeatCount="indefinite"/>
      </path>
       <path d="M130 40 Q 145 48, 160 40 T 190 40" stroke="hsl(var(--accent))" strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="d" values="M130 40 Q 145 32, 160 40 T 190 40; M130 40 Q 145 48, 160 40 T 190 40; M130 40 Q 145 32, 160 40 T 190 40" dur="1.5s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
};

export default CrackleMartLogo;
