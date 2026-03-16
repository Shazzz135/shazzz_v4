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
 * Supports dynamic scaling (1x1, 2x2, etc.)
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

  // Calculate scaled dimensions
  const gridSize = object.gridSize || { width: 1, height: 1 };
  const scaledWidth = cellSize * gridSize.width;
  const scaledHeight = cellSize * gridSize.height;

  // Build transform string for flip and rotation
  let transformStr = '';
  if (hasFlip) {
    transformStr += 'scaleX(-1) ';
  }
  if (rotation > 0) {
    transformStr += `rotate(${rotation}deg) `;
  }
  transformStr = transformStr.trim() || 'none';

  // Only render if this is the base address (first cell of a multi-cell object)
  // Check if address is one of the expanded addresses but not the first one
  if (object.gridSize && object.gridSize.width > 1) {
    const baseAddr = object.address[0];
    if (address !== baseAddr) {
      return null; // Don't render duplicate for overflow cells
    }
  }

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
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
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
