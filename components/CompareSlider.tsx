import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface CompareSliderProps {
  original: string;
  modified: string;
  className?: string;
}

const CompareSlider: React.FC<CompareSliderProps> = ({ original, modified, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
      setSliderPosition(percent);
    }
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false);
    const onTouchEnd = () => setIsDragging(false);
    
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden select-none cursor-ew-resize group ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Background Image (Modified/New) */}
      <img 
        src={modified} 
        alt="Modified Design" 
        className="absolute top-0 left-0 w-full h-full object-contain"
      />

      {/* Foreground Image (Original/Old) - Clipped */}
      <div 
        className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={original} 
          alt="Original Room" 
          className="absolute top-0 left-0 w-full h-full object-contain" 
        />
        
        {/* Label for Original */}
        <div className="absolute top-4 left-4 bg-background/60 backdrop-blur-md text-foreground px-2 py-1 text-xs font-semibold rounded pointer-events-none shadow-sm border border-white/10">
          Original
        </div>
      </div>

       {/* Label for Modified */}
       <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-md text-primary-foreground px-2 py-1 text-xs font-semibold rounded pointer-events-none shadow-sm">
          Reimagined
        </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full shadow-lg flex items-center justify-center text-foreground ring-2 ring-primary hover:scale-110 transition-transform">
           <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
};

export default CompareSlider;