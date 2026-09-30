import React, { useState } from 'react';
import { Waves } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomOnHover?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  zoomOnHover = false,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A192F] via-[#0F2942] to-[#0D9488] text-white/90 ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 400 300" fill="none">
            <circle cx="320" cy="70" r="45" fill="#F9F6F0" fillOpacity="0.3" />
            <path
              d="M0 220 Q 100 190 200 220 T 400 210 L 400 300 L 0 300 Z"
              fill="#0284C7"
              fillOpacity="0.4"
            />
            <path
              d="M0 250 Q 120 230 240 250 T 400 245 L 400 300 L 0 300 Z"
              fill="#F9F6F0"
              fillOpacity="0.2"
            />
          </svg>
        </div>
        <Waves className="mb-2 h-8 w-8 text-[#5EEAD4]" />
        <span className="px-4 text-center font-display text-sm tracking-wide text-[#F9F6F0]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className} ${
        zoomOnHover ? 'transition-transform duration-700 ease-out group-hover:scale-105' : ''
      }`}
    />
  );
};
