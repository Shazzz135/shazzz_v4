import { useState, useEffect, useRef } from 'react';
import type { LevelData } from '../data/sandboxData';
import { sandboxLevel } from '../data/sandboxData';
import Character from '../components/Character';
import heartFull from '../assets/ui/heart/heart_full.svg';
import heartHalf from '../assets/ui/heart/heart_half.svg';
import heartEmpty from '../assets/ui/heart/heart_empty.svg';
import type { GameObject } from '../types/GameObject';

/**
 * Universal Level/Game Scene Component
 * Renders a complete game level with grid, game objects, and character
 * Can be reused for multiple levels by passing different levelData
 * Dynamically scales to fit screen while maintaining 30×16 grid layout
 */

interface SandboxProps {
  levelData?: LevelData;
}

// Converts grid address (e.g., "A1", "P16") to pixel coordinates
const getPixelPositionFromAddress = (address: string, cellSize: number): { x: number; y: number } => {
  const row = address.charCodeAt(0) - 65;
  const col = parseInt(address.substring(1)) - 1;
  return {
    x: col * cellSize,
    y: row * cellSize,
  };
};

export default function Sandbox({ levelData = sandboxLevel }: SandboxProps) {
  // ========== GRID CONFIGURATION ==========
  const gridCols = 30;
  const gridRows = 16;
  const BASE_CELL_SIZE = 32; // Base cell size for scale calculation
  
  // ========== STATE ==========
  const [cellSize, setCellSize] = useState(0);
  const [gameObjects] = useState<GameObject[]>(levelData.objects);
  const [objectFrames, setObjectFrames] = useState<Record<string, number>>({}); // Track frame indices for animations
  const [health, setHealth] = useState(1); // 1=full, 0.5=half, 0=empty
  const [recentlyHitSpikes, setRecentlyHitSpikes] = useState<Set<string>>(new Set()); // Track flickering spikes
  const [flickerState, setFlickerState] = useState(true); // Toggle for flicker animation
  const animationTickRef = useRef(0);

  useEffect(() => {
    const calculateCellSize = () => {
      const cellWidth = window.innerWidth / gridCols;
      const cellHeight = window.innerHeight / gridRows;
      const newCellSize = Math.min(cellWidth, cellHeight);
      setCellSize(newCellSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    return () => window.removeEventListener('resize', calculateCellSize);
  }, []);

  // Animation loop for objects
  useEffect(() => {
    const animationLoop = setInterval(() => {
      animationTickRef.current += 1;
      
      // Update frame indices for animated objects
      const newFrames: Record<string, number> = {};
      gameObjects.forEach((obj) => {
        if (obj.animation) {
          obj.address.forEach((addr) => {
            const key = `${obj.id}-${addr}`;
            const currentFrame = objectFrames[key] ?? 0;
            const animSpeed = obj.animation!.speed;
            const frameCount = obj.animation!.frames.length;
            
            // Update frame every animSpeed ticks
            if (animationTickRef.current % animSpeed === 0) {
              newFrames[key] = (currentFrame + 1) % frameCount;
            } else {
              newFrames[key] = currentFrame;
            }
          });
        }
      });
      
      if (Object.keys(newFrames).length > 0) {
        setObjectFrames((prev) => ({ ...prev, ...newFrames }));
      }
    }, 16); // ~60 FPS
    
    return () => clearInterval(animationLoop);
  }, [gameObjects, objectFrames]);

  const scale = cellSize > 0 ? cellSize / BASE_CELL_SIZE : 1;

  const handleHealthChange = (newHealth: number) => {
    setHealth(newHealth);
  };

  const handleSpikeHit = (spikeAddress: string) => {
    setRecentlyHitSpikes((prev) => {
      const newSet = new Set(prev);
      newSet.add(spikeAddress);
      return newSet;
    });

    // Remove spike from flicker set after 300ms
    setTimeout(() => {
      setRecentlyHitSpikes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(spikeAddress);
        return newSet;
      });
    }, 300);
  };

  // Flicker effect for hit spikes
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setFlickerState((prev) => !prev);
    }, 100); // Toggle every 100ms for visible flicker

    return () => clearInterval(flickerInterval);
  }, []);

  // Determine which heart image to display based on health
  const getHeartImage = (): string => {
    if (health >= 1) return heartFull;
    if (health >= 0.5) return heartHalf;
    return heartEmpty;
  };

  // Get A1 pixel position for heart display
  const A1Position = getPixelPositionFromAddress('A1', cellSize);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
      <div className="relative" style={{ width: gridCols * cellSize, height: gridRows * cellSize }}>
        {/* Game Objects Layer */}
        {cellSize > 0 && (
          <div className="absolute inset-0">
            {gameObjects.map((obj) => {
              return obj.address.map((addr) => {
                const isFlipped = addr.endsWith('R');
                const cleanAddr = isFlipped ? addr.slice(0, -1) : addr;
                const pixelPos = getPixelPositionFromAddress(cleanAddr, cellSize);
                const scaledSize = cellSize;
                const key = `${obj.id}-${addr}`;

                // Get current frame if animated, otherwise use static image
                let imageSrc = obj.img || '';
                if (obj.animation) {
                  const frameIndex = objectFrames[key] ?? 0;
                  imageSrc = obj.animation.frames[frameIndex];
                }

                return (
                  <img
                    key={key}
                    src={imageSrc}
                    alt={obj.id}
                    className="absolute"
                    style={{
                      left: `${pixelPos.x}px`,
                      top: `${pixelPos.y}px`,
                      width: `${scaledSize}px`,
                      height: `${scaledSize}px`,
                      objectFit: 'contain',
                      transform: isFlipped ? 'scaleX(-1)' : 'none',
                      opacity: obj.id === 'spikes' && recentlyHitSpikes.has(addr) && !flickerState ? 0.3 : 1,
                      transition: 'opacity 0.05s',
                    }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${imageSrc}`, e);
                    }}
                  />
                );
              });
            })}
          </div>
        )}
        {/* UI Layer - Health Hearts */}
        {cellSize > 0 && (
          <div className="absolute inset-0">
            <img
              src={getHeartImage()}
              alt="health"
              className="absolute"
              style={{
                left: `${A1Position.x}px`,
                top: `${A1Position.y}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Character Layer */}
        {cellSize > 0 && (
          <Character
            gameObjects={gameObjects}
            cellSize={cellSize}
            gridWidth={gridCols}
            gridHeight={gridRows}
            scale={scale}
            spawnPosition={getPixelPositionFromAddress(levelData.characterSpawn, cellSize)}
            onHealthChange={handleHealthChange}
            onSpikeHit={handleSpikeHit}
          />
        )}
      </div>
    </div>
  );
}
