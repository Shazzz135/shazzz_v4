import TextRenderer from 'react-pixel-text-renderer';
import type { GameObject } from '../types/GameObject';
import { getCleanAddress } from '../utils/addressParser';

interface TextObjectProps {
  object: GameObject;
  address: string;
  cellSize: number;
  playerX: number;
  playerY: number;
  showHitbox?: boolean;
}

/**
 * TextObject Component
 * Renders text objects with optional visibility conditions
 * Uses react-pixel-text-renderer for pixel-perfect text rendering
 * Supports both distance-based and position-based visibility
 */
export default function TextObject({
  object,
  address,
  cellSize,
  playerX,
  playerY,
  showHitbox = false,
}: TextObjectProps) {
  if (!object.textConfig) {
    return null;
  }

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

  const pos = getPixelPosition(address);

  // Check visibility conditions
  if (object.textConfig.visibilityAddress) {
    // If visibilityAddress is set, only show when player is at that address
    const playerCol = Math.floor(playerX / cellSize);
    const playerRow = Math.floor(playerY / cellSize);
    const playerAddress = String.fromCharCode(65 + playerRow) + (playerCol + 1);
    
    if (!object.textConfig.visibilityAddress.startsWith(playerAddress)) {
      return null;
    }
  } else if (object.textConfig.visibilityRange) {
    // Otherwise check distance-based visibility
    const dx = pos.x - playerX;
    const dy = pos.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > object.textConfig.visibilityRange) {
      return null;
    }
  }

  const { text, bgColor, color, scale, charSpaces, animate } = object.textConfig;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <TextRenderer
        bgColor={bgColor}
        color={color}
        text={text}
        scale={scale}
        charSpaces={charSpaces}
        animate={animate || false}
      />
      
      {showHitbox && object.hitbox && (
        <div
          style={{
            position: 'absolute',
            left: `${object.hitbox.x}px`,
            top: `${object.hitbox.y}px`,
            width: `${object.hitbox.width}px`,
            height: `${object.hitbox.height}px`,
            border: '2px solid yellow',
            boxSizing: 'border-box',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}
