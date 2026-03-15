import { useEffect, useState } from 'react';
import rotateSvg from '../assets/ui/rotate/rotate.svg';

export default function RotateDeviceScreen() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const checkOrientation = () => {
      // Portrait: height > width
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();

    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  // Toggle between two frames every 0.6 seconds
  useEffect(() => {
    const frameInterval = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 600);

    return () => clearInterval(frameInterval);
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <p className="mb-8 text-2xl sm:text-3xl font-bold text-gray-800">
        Rotate Device
      </p>
      <img
        src={rotateSvg}
        alt="Rotate Device"
        className="w-32 h-32 sm:w-40 sm:h-40"
        style={{
          transform: frame === 0 ? 'rotate(0deg)' : 'rotate(90deg)',
        }}
      />
    </div>
  );
}
