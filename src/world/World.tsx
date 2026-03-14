import { useState, useEffect, useRef } from 'react';
import { dungeonLevel } from '../data/levelSelectData';
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

// Converts grid address (e.g., "A1", "P16") to pixel coordinates
const getPixelPositionFromAddress = (address: string, cellSize: number): { x: number; y: number } => {
  const row = address.charCodeAt(0) - 65;
  const col = parseInt(address.substring(1)) - 1;
  return {
    x: col * cellSize,
    y: row * cellSize,
  };
};

export default function World() {
  // ========== GRID CONFIGURATION ==========
  const gridCols = 30;
  const gridRows = 16;
  const BASE_CELL_SIZE = 32; // Base cell size for scale calculation
  
  // ========== STATE ==========
  const [cellSize, setCellSize] = useState(0);
  const [activeDataset, setActiveDataset] = useState<'levelSelect' | 'sandbox'>('levelSelect');
  const currentLevel = activeDataset === 'levelSelect' ? dungeonLevel : sandboxLevel;
  const gameObjects = currentLevel.objects;
  const [objectFrames, setObjectFrames] = useState<Record<string, number>>({}); // Track frame indices for animations
  const [health, setHealth] = useState(1); // 1=full, 0.5=half, 0=empty
  const [recentlyHitSpikes, setRecentlyHitSpikes] = useState<Set<string>>(new Set()); // Track flickering spikes
  const [flickerState, setFlickerState] = useState(true); // Toggle for flicker animation
  const [showHitbox] = useState(false); // Debug: show hitboxes
  const [showGrid, setShowGrid] = useState(true); // Toggle grid visibility
  const animationTickRef = useRef(0);

  // Reset state when active dataset changes
  useEffect(() => {
    setObjectFrames({}); // Reset animation frames
    setHealth(1); // Reset health
  }, [activeDataset]);

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

  // Get grid positions for heart display
  const B2Position = getPixelPositionFromAddress('B2', cellSize);
  const B3Position = getPixelPositionFromAddress('B3', cellSize);
  const B4Position = getPixelPositionFromAddress('B4', cellSize);

  return (
    <div 
      className="w-screen h-screen overflow-hidden flex items-center justify-center relative"
      style={{
        backgroundImage: currentLevel.background ? `url(${currentLevel.background})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#000000',
      }}
    >
      {/* Dataset Toggle Button */}
      <button
        onClick={() => setActiveDataset(activeDataset === 'levelSelect' ? 'sandbox' : 'levelSelect')}
        className="absolute top-4 left-4 z-10 px-3 py-2 rounded font-bold text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors"
      >
        {activeDataset === 'levelSelect' ? 'Level Select' : 'Sandbox'}
      </button>

      {/* Grid Toggle Button */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        className="absolute top-4 right-4 z-10 px-3 py-2 rounded font-bold text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        {showGrid ? 'Hide Grid' : 'Show Grid'}
      </button>

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

        {/* Grid Layer */}
        {cellSize > 0 && showGrid && (
          <svg
            className="absolute inset-0"
            width={gridCols * cellSize}
            height={gridRows * cellSize}
            style={{ pointerEvents: 'none' }}
          >
            {/* Vertical grid lines */}
            {Array.from({ length: gridCols + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={gridRows * cellSize}
                stroke="#666666"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            {/* Horizontal grid lines */}
            {Array.from({ length: gridRows + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * cellSize}
                x2={gridCols * cellSize}
                y2={i * cellSize}
                stroke="#666666"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            {/* Grid labels */}
            {Array.from({ length: gridRows }).map((_, row) =>
              Array.from({ length: gridCols }).map((_, col) => {
                const letter = String.fromCharCode(65 + row); // A-P
                const number = col + 1; // 1-30
                const address = `${letter}${number}`;
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                return (
                  <text
                    key={`label-${address}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#999999"
                    fontSize={(cellSize * 0.4).toString()}
                    opacity="0.6"
                    pointerEvents="none"
                  >
                    {address}
                  </text>
                );
              })
            )}
          </svg>
        )}

        {/* UI Layer - Health Hearts */}
        {cellSize > 0 && (
          <div className="absolute inset-0">
            {/* First heart at B2 - shows current health */}
            <img
              src={getHeartImage()}
              alt="health-1"
              className="absolute"
              style={{
                left: `${B2Position.x}px`,
                top: `${B2Position.y}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                objectFit: 'contain',
              }}
            />
            {/* Second heart at B3 - full heart */}
            <img
              src={heartFull}
              alt="health-2"
              className="absolute"
              style={{
                left: `${B3Position.x}px`,
                top: `${B3Position.y}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                objectFit: 'contain',
              }}
            />
            {/* Third heart at B4 - full heart */}
            <img
              src={heartFull}
              alt="health-3"
              className="absolute"
              style={{
                left: `${B4Position.x}px`,
                top: `${B4Position.y}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Debug Layer - Hitboxes */}
        {cellSize > 0 && showHitbox && (
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

                const hitboxX = gridX + obj.hitbox.x;
                const hitboxY = gridY + obj.hitbox.y;

                return (
                  <rect
                    key={`${obj.id}-${addr}`}
                    x={hitboxX}
                    y={hitboxY}
                    width={obj.hitbox.width}
                    height={obj.hitbox.height}
                    fill="none"
                    stroke={obj.isCollectible ? '#00FF00' : '#FF0000'}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                );
              })
            )}
          </svg>
        )}

        {/* Character Layer */}
        {cellSize > 0 && (
          <Character
            gameObjects={gameObjects}
            cellSize={cellSize}
            gridWidth={gridCols}
            gridHeight={gridRows}
            scale={scale}
            spawnAddress={currentLevel.characterSpawn}
            onHealthChange={handleHealthChange}
            onSpikeHit={handleSpikeHit}
            showHitbox={showHitbox}
          />
        )}
      </div>
    </div>
  );
}
