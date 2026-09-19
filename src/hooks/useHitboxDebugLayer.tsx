import type { GameObject } from '../types/GameObject';

/**
 * Hitbox Debug Layer Hook
 * Renders hitbox overlays for debugging collision detection
 */

export function useHitboxDebugLayer(
  gameObjects: GameObject[],
  cellSize: number,
  showHitbox: boolean,
) {
  if (!showHitbox || cellSize <= 0) {
    return null;
  }

  const HITBOX_BASE_SIZE = 32;

  return (
    <svg
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      {/* Object hitboxes */}
      {gameObjects.map((obj) =>
        obj.address.map((addr) => {
          const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
          const rowLetter = cleanAddr.charCodeAt(0);
          const gridY = (rowLetter - 65) * cellSize;
          const gridX = (parseInt(cleanAddr.substring(1)) - 1) * cellSize;

          // Scale hitbox to match current cellSize
          const scaleFactor = cellSize / HITBOX_BASE_SIZE;
          const scaledWidth = obj.hitbox.width * scaleFactor;
          const scaledHeight = obj.hitbox.height * scaleFactor;
          const scaledOffsetX = obj.hitbox.x * scaleFactor;
          const scaledOffsetY = obj.hitbox.y * scaleFactor;

          const hitboxX = gridX + scaledOffsetX;
          const hitboxY = gridY + scaledOffsetY;

          return (
            <rect
              key={`${obj.id}-${addr}`}
              x={hitboxX}
              y={hitboxY}
              width={scaledWidth}
              height={scaledHeight}
              fill="none"
              stroke={obj.isCollectible ? '#00FF00' : '#FF0000'}
              strokeWidth="2"
              opacity="0.7"
            />
          );
        })
      )}
    </svg>
  );
}
