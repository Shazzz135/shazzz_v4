import type { GameObject } from '../types/GameObject';
import { getCleanAddress, getRotationAngle, isFlipped } from '../utils/addressParser';

interface OutputObjectProps {
  object: GameObject;
  address: string;
  cellSize: number;
  isActivated?: boolean; // Whether trapdoor is currently open/active
  frameIndex?: number; // Current frame index for trapdoor animation
  showHitbox?: boolean;
}

/**
 * OutputObject Component
 * Renders output objects (trapdoors) that are triggered by input objects
 * Examples: blue, green, red trapdoors
 * 
 * Trapdoor states:
 * - Closed: frame 0
 * - Opening: frame 1-2
 * - Open: frame 3
 */
export default function OutputObject({
  object,
  address,
  cellSize,
  frameIndex = 0,
  showHitbox = false,
  isCompleted = false,
}: OutputObjectProps & { isCompleted?: boolean }) {
  // Convert grid address to pixel coordinates
  const getPixelPosition = (addr: string): { x: number; y: number } => {
    const cleanAddr = getCleanAddress(addr);
    const row = cleanAddr.charCodeAt(0) - 65;
    const col = parseInt(cleanAddr.substring(1)) - 1;
    return {
      x: col * cellSize,
      y: row * cellSize,
    };
  };

  const hasFlip = isFlipped(address);
  const rotation = getRotationAngle(address);
  const pos = getPixelPosition(address);

  // Build transform string for flip and rotation
  let transformStr = '';
  if (hasFlip) {
    transformStr += 'scaleX(-1) ';
  }
  if (rotation > 0) {
    transformStr += `rotate(${rotation}deg) `;
  }
  transformStr = transformStr.trim() || 'none';

  // Hide door completely after it finishes animating
  if (isCompleted) {
    return null;
  }

  // Determine which frame to display
  // When not activated: frame 0
  // When activated: use frameIndex to animate through frames 0->1->2->3
  const displayFrame = object.animation
    ? object.animation.frames[frameIndex] || object.animation.frames[0]
    : object.img;

  return (
    <>
      {/* Trapdoor image */}
      <img
        src={displayFrame}
        alt={object.id}
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          imageRendering: 'pixelated',
          userSelect: 'none',
          pointerEvents: 'none',
          transform: transformStr,
          transformOrigin: 'center center',
        }}
      />

      {/* Debug hitbox visualization */}
      {showHitbox && (
        <div
          style={{
            position: 'absolute',
            left: `${pos.x + (object.hitbox.x * cellSize / 32)}px`,
            top: `${pos.y + (object.hitbox.y * cellSize / 32)}px`,
            width: `${object.hitbox.width * cellSize / 32}px`,
            height: `${object.hitbox.height * cellSize / 32}px`,
            border: '2px solid magenta',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
