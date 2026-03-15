import type { GameObject } from '../types/GameObject';
import { getCleanAddress, getRotationAngle, isFlipped } from '../utils/addressParser';

interface BlockObjectProps {
  object: GameObject;
  address: string;
  cellSize: number;
  showHitbox?: boolean;
}

/**
 * BlockObject Component
 * Renders static block objects with no animation
 * Examples: grass_full, stone_half, etc.
 */
export default function BlockObject({
  object,
  address,
  cellSize,
  showHitbox = false,
}: BlockObjectProps) {
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

  return (
    <>
      {/* Main image */}
      <img
        src={object.img}
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
            border: '2px solid lime',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
