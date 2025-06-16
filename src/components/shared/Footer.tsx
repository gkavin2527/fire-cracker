import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-muted py-8 text-muted-foreground mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} CrackleMart. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Enjoy responsibly. Follow all safety guidelines.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
