import { useState, useEffect } from 'react';
import bar0 from '/ui/bar/bar0.svg';
import bar20 from '/ui/bar/bar20.svg';
import bar40 from '/ui/bar/bar40.svg';
import bar60 from '/ui/bar/bar60.svg';
import bar80 from '/ui/bar/bar80.svg';
import bar100 from '/ui/bar/bar100.svg';
import dungeon from '/backgrounds/dungeon.webp';

const bars = [bar0, bar20, bar40, bar60, bar80, bar100];
const BAR_DURATION = 300; // Duration per bar in ms

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

export default function LoadingScreen({ isLoading, onLoadingComplete }: LoadingScreenProps) {
  const [barIndex, setBarIndex] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  // Handle window resize for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setBarIndex((prev) => Math.min(prev + 1, bars.length - 1));
    }, BAR_DURATION);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Trigger completion callback when loading is done
  useEffect(() => {
    if (barIndex >= bars.length - 1) {
      onLoadingComplete?.();
    }
  }, [barIndex, onLoadingComplete]);

  if (!isLoading) return null;

  // Calculate responsive sizes based on viewport
  const isMobile = windowSize.width < 768;
  const barWidth = isMobile ? Math.min(200, windowSize.width * 0.7) : Math.min(320, windowSize.width * 0.5);
  const barHeight = barWidth * 0.25; // Maintain aspect ratio
  const fontSize = isMobile ? Math.max(16, windowSize.width * 0.05) : Math.max(20, windowSize.width * 0.04);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundImage: `url(${dungeon})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-8 drop-shadow-lg">
        <h1 
          className="text-white font-bold drop-shadow-md"
          style={{ fontSize: `${fontSize}px` }}
        >
          Loading
        </h1>
        <img
          src={bars[barIndex]}
          alt="loading"
          style={{
            width: `${barWidth}px`,
            height: `${barHeight}px`,
          }}
          className="drop-shadow-md"
        />
      </div>
    </div>
  );
}
