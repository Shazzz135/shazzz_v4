import { useRef, useState, useEffect } from 'react';
import arrowOff from '../assets/ui/buttons/arrow_off.svg';
import arrowOn from '../assets/ui/buttons/arrow_on.svg';
import circleOff from '../assets/ui/buttons/circle_off.svg';
import circleOn from '../assets/ui/buttons/circle_on.svg';

/**
 * Mobile Controls UI
 * Provides touch-friendly arrow buttons for character movement and actions
 * - Left/Right arrows (bottom left)
 * - Prone/Jump/Punch arrows (bottom right)
 */

export default function MobileControls() {
  const leftPressedRef = useRef(false);
  const rightPressedRef = useRef(false);
  const pronePressedRef = useRef(false);
  const jumpPressedRef = useRef(false);
  const punchPressedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Button state tracking for visual feedback
  const [activeButtons, setActiveButtons] = useState({
    left: false,
    right: false,
    prone: false,
    jump: false,
    punch: false,
  });

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia('(hover: none)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dispatchKeyEvent = (key: string, type: 'keydown' | 'keyup') => {
    const event = new KeyboardEvent(type, {
      key,
      code: key.toUpperCase(),
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const handleLeftDown = () => {
    if (!leftPressedRef.current) {
      leftPressedRef.current = true;
      setActiveButtons((prev) => ({ ...prev, left: true }));
      dispatchKeyEvent('a', 'keydown');
    }
  };

  const handleLeftUp = () => {
    if (leftPressedRef.current) {
      leftPressedRef.current = false;
      setActiveButtons((prev) => ({ ...prev, left: false }));
      dispatchKeyEvent('a', 'keyup');
    }
  };

  const handleRightDown = () => {
    if (!rightPressedRef.current) {
      rightPressedRef.current = true;
      setActiveButtons((prev) => ({ ...prev, right: true }));
      dispatchKeyEvent('d', 'keydown');
    }
  };

  const handleRightUp = () => {
    if (rightPressedRef.current) {
      rightPressedRef.current = false;
      setActiveButtons((prev) => ({ ...prev, right: false }));
      dispatchKeyEvent('d', 'keyup');
    }
  };

  const handleJumpDown = () => {
    if (!jumpPressedRef.current) {
      jumpPressedRef.current = true;
      setActiveButtons((prev) => ({ ...prev, jump: true }));
      dispatchKeyEvent('w', 'keydown');
    }
  };

  const handleJumpUp = () => {
    if (jumpPressedRef.current) {
      jumpPressedRef.current = false;
      setActiveButtons((prev) => ({ ...prev, jump: false }));
      dispatchKeyEvent('w', 'keyup');
    }
  };

  const handlePunchDown = () => {
    if (!punchPressedRef.current) {
      punchPressedRef.current = true;
      setActiveButtons((prev) => ({ ...prev, punch: true }));
      dispatchKeyEvent(' ', 'keydown');
    }
  };

  const handlePunchUp = () => {
    if (punchPressedRef.current) {
      punchPressedRef.current = false;
      setActiveButtons((prev) => ({ ...prev, punch: false }));
      dispatchKeyEvent(' ', 'keyup');
    }
  };

  const handleProneDown = () => {
    if (!pronePressedRef.current) {
      pronePressedRef.current = true;
      setActiveButtons((prev) => ({ ...prev, prone: true }));
      dispatchKeyEvent('s', 'keydown');
    }
  };

  const handleProneUp = () => {
    if (pronePressedRef.current) {
      pronePressedRef.current = false;
      setActiveButtons((prev) => ({ ...prev, prone: false }));
      dispatchKeyEvent('s', 'keyup');
    }
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Left Controls (Movement) */}
      <div className="fixed bottom-4 left-12 z-20 flex gap-3 select-none pointer-events-auto">
        {/* Left Arrow Button */}
        <button
          onMouseDown={handleLeftDown}
          onMouseUp={handleLeftUp}
          onMouseLeave={handleLeftUp}
          onTouchStart={(e) => {
            e.preventDefault();
            handleLeftDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleLeftUp();
          }}
          className="bg-transparent border-none p-0 outline-none cursor-pointer touch-none transition-transform w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-[0.35]"
          style={{
            transform: activeButtons.left ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <img
            src={activeButtons.left ? arrowOn : arrowOff}
            alt="left"
            className="w-full h-full pointer-events-none"
            style={{ transform: 'rotate(180deg)' }}
          />
        </button>

        {/* Right Arrow Button */}
        <button
          onMouseDown={handleRightDown}
          onMouseUp={handleRightUp}
          onMouseLeave={handleRightUp}
          onTouchStart={(e) => {
            e.preventDefault();
            handleRightDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleRightUp();
          }}
          className="bg-transparent border-none p-0 outline-none cursor-pointer touch-none transition-transform w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-[0.35]"
          style={{
            transform: activeButtons.right ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <img
            src={activeButtons.right ? arrowOn : arrowOff}
            alt="right"
            className="w-full h-full pointer-events-none"
          />
        </button>
      </div>

      {/* Right Controls (Actions) - Backwards L shape */}
      <div className="fixed bottom-4 right-12 z-20 flex flex-col select-none pointer-events-auto">
        {/* Jump Arrow Button - Top Right */}
        <button
          onMouseDown={handleJumpDown}
          onMouseUp={handleJumpUp}
          onMouseLeave={handleJumpUp}
          onTouchStart={(e) => {
            e.preventDefault();
            handleJumpDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleJumpUp();
          }}
          className="bg-transparent border-none p-0 outline-none cursor-pointer touch-none transition-transform w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-[0.35] self-end mb-3"
          style={{
            transform: activeButtons.jump ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <img
            src={activeButtons.jump ? arrowOn : arrowOff}
            alt="jump"
            className="w-full h-full pointer-events-none"
            style={{ transform: 'rotate(-90deg)' }}
          />
        </button>

        {/* Prone & Punch Row - Bottom */}
        <div className="flex gap-3">
          {/* Punch Circle Button - Bottom Left */}
          <button
            onMouseDown={handlePunchDown}
            onMouseUp={handlePunchUp}
            onMouseLeave={handlePunchUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handlePunchDown();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handlePunchUp();
            }}
            className="bg-transparent border-none p-0 outline-none cursor-pointer touch-none transition-transform w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-[0.35]"
            style={{
              transform: activeButtons.punch ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <img
              src={activeButtons.punch ? circleOn : circleOff}
              alt="punch"
              className="w-full h-full pointer-events-none"
            />
          </button>

          {/* Prone Arrow Button - Bottom Right */}
          <button
            onMouseDown={handleProneDown}
            onMouseUp={handleProneUp}
            onMouseLeave={handleProneUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handleProneDown();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleProneUp();
            }}
            className="bg-transparent border-none p-0 outline-none cursor-pointer touch-none transition-transform w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-[0.35]"
            style={{
              transform: activeButtons.prone ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <img
              src={activeButtons.prone ? arrowOn : arrowOff}
              alt="prone"
              className="w-full h-full pointer-events-none"
              style={{ transform: 'rotate(90deg)' }}
            />
          </button>
        </div>
      </div>
    </>
  );
}
