import { useState, useEffect, useRef } from 'react';
import { dungeonLevel } from '../data/levelSelectData';
import { sandboxLevel } from '../data/sandboxData';
import Character from '../components/Character';
import MobileControls from '../components/MobileControls';
import RotateDeviceScreen from '../components/RotateDeviceScreen';
import BlockObject from '../objects/BlockObject';
import AnimatedObject from '../objects/AnimatedObject';
import InputObject from '../objects/InputObject';
import OutputObject from '../objects/OutputObject';
import heartFull from '../assets/ui/heart/heart_full.svg';
import heartHalf from '../assets/ui/heart/heart_half.svg';
import heartEmpty from '../assets/ui/heart/heart_empty.svg';

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
  const [activeDataset, setActiveDataset] = useState<'levelSelect' | 'sandbox'>('sandbox');
  const currentLevel = activeDataset === 'levelSelect' ? dungeonLevel : sandboxLevel;
  const gameObjects = currentLevel.objects;
  const [objectFrames, setObjectFrames] = useState<Record<string, number>>({}); // Track frame indices for animations
  const [activatedSwitches, setActivatedSwitches] = useState<Set<string>>(new Set()); // Track which switches are activated
  const [openedDoors, setOpenedDoors] = useState<Set<string>>(new Set()); // Track which doors are open
  const [buttonAnimationFrames, setButtonAnimationFrames] = useState<Record<string, number>>({}); // Track button animation frames during activation
  const [doorAnimationFrames, setDoorAnimationFrames] = useState<Record<string, number>>({}); // Track door animation frames during activation
  const [completedDoors, setCompletedDoors] = useState<Set<string>>(new Set()); // Track doors that finished animating and should disappear
  const [doorAnimationDirection, setDoorAnimationDirection] = useState<Record<string, 'forward' | 'backward'>>({}); // Track animation direction for doors
  const [buttonAnimationDirection, setButtonAnimationDirection] = useState<Record<string, 'forward' | 'backward'>>({}); // Track animation direction for buttons
  const [health, setHealth] = useState(1); // 1=full, 0.5=half, 0=empty
  const [showHitbox, setShowHitbox] = useState(false); // Debug: show hitboxes
  const [showGrid, setShowGrid] = useState(false); // Toggle grid visibility
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
      
      // Update frame indices for animated objects only (not input/output)
      const newFrames: Record<string, number> = {};
      const newButtonFrames: Record<string, number> = {};
      const newDoorFrames: Record<string, number> = {};
      const newCompletedDoors = new Set(completedDoors);
      const newButtonDirection: Record<string, 'forward' | 'backward'> = { ...buttonAnimationDirection };
      const newDoorDir: Record<string, 'forward' | 'backward' | null> = { ...doorAnimationDirection };
      
      
      gameObjects.forEach((obj) => {
        if (obj.animation) {
          obj.address.forEach((addr) => {
            const key = `${obj.id}-${addr}`;
            
            if (obj.type === 'input') {
              // Handle button animation
              if (activatedSwitches.has(obj.id)) {
                const currentFrame = buttonAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                const frameCount = obj.animation!.frames.length;
                const maxFrame = frameCount - 1; // Frame 3 for 4-frame buttons (indices 0-3)
                
                // Animate forward through frames: 0->1->2->3, then stop at 3
                if (animationTickRef.current % animSpeed === 0 && currentFrame < maxFrame) {
                  newButtonFrames[key] = currentFrame + 1;
                } else {
                  newButtonFrames[key] = currentFrame;
                }
              } else if (buttonAnimationDirection[obj.id] === 'backward') {
                // Button deactivated - animate backward through frames: 3->2->1->0
                const currentFrame = buttonAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                
                if (animationTickRef.current % animSpeed === 0 && currentFrame > 0) {
                  newButtonFrames[key] = currentFrame - 1;
                } else if (currentFrame === 0) {
                  // Animation complete, clear the direction
                  delete newButtonDirection[obj.id];
                  newButtonFrames[key] = 0;
                } else {
                  newButtonFrames[key] = currentFrame;
                }
              } else {
                // Not animated, stay at frame 0
                newButtonFrames[key] = 0;
              }
            } else if (obj.type === 'output') {
              // Handle door animation
              if (openedDoors.has(obj.id) && !completedDoors.has(obj.id)) {
                // Door is opening
                const currentFrame = doorAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                const frameCount = obj.animation!.frames.length;
                
                // Animate forward through frames: 0->1->2->3
                if (animationTickRef.current % animSpeed === 0 && currentFrame < frameCount - 1) {
                  newDoorFrames[key] = currentFrame + 1;
                } else if (currentFrame === frameCount - 1) {
                  // Animation complete - mark door as completed
                  newCompletedDoors.add(obj.id);
                  newDoorFrames[key] = currentFrame;
                } else {
                  newDoorFrames[key] = currentFrame;
                }
              } else if (doorAnimationDirection[obj.id] === 'backward') {
                // Door is closing - animate backward through frames: 3->2->1->0
                const currentFrame = doorAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                
                if (animationTickRef.current % animSpeed === 0 && currentFrame > 0) {
                  newDoorFrames[key] = currentFrame - 1;
                } else if (currentFrame === 0) {
                  // Animation complete, clear the direction
                  delete newDoorDir[obj.id];
                  newDoorFrames[key] = 0;
                } else {
                  newDoorFrames[key] = currentFrame;
                }
              }
            } else {
              // Regular animated objects
              const currentFrame = objectFrames[key] ?? 0;
              const animSpeed = obj.animation!.speed;
              const frameCount = obj.animation!.frames.length;
              
              // Update frame every animSpeed ticks
              if (animationTickRef.current % animSpeed === 0) {
                newFrames[key] = (currentFrame + 1) % frameCount;
              } else {
                newFrames[key] = currentFrame;
              }
            }
          });
        }
      });
      
      if (Object.keys(newFrames).length > 0) {
        setObjectFrames((prev) => ({ ...prev, ...newFrames }));
      }
      if (Object.keys(newButtonFrames).length > 0) {
        setButtonAnimationFrames((prev) => ({ ...prev, ...newButtonFrames }));
      }
      if (Object.keys(newDoorFrames).length > 0) {
        setDoorAnimationFrames((prev) => ({ ...prev, ...newDoorFrames }));
      }
      if (newCompletedDoors.size > completedDoors.size) {
        setCompletedDoors(newCompletedDoors);
      }
      if (Object.keys(newButtonDirection).length > 0) {
        setButtonAnimationDirection(newButtonDirection);
      }
      // Clean up newDoorDir by removing null/undefined values
      const cleanedDoorDir = Object.fromEntries(
        Object.entries(newDoorDir).filter(([, v]) => v !== null && v !== undefined)
      ) as Record<string, 'forward' | 'backward'>;
      if (Object.keys(cleanedDoorDir).length > 0) {
        setDoorAnimationDirection(cleanedDoorDir);
      }
    }, 16); // ~60 FPS
    
    return () => clearInterval(animationLoop);
  }, [gameObjects, objectFrames, buttonAnimationFrames, doorAnimationFrames, activatedSwitches, openedDoors, completedDoors]);

  const scale = cellSize > 0 ? cellSize / BASE_CELL_SIZE : 1;

  const handleHealthChange = (newHealth: number) => {
    setHealth(newHealth);
  };

  // Handle switch activation/deactivation
  const handleSwitchActivation = (switchObjectId: string) => {
    const switchObj = gameObjects.find((obj) => obj.id === switchObjectId);
    if (!switchObj) return;

    const switchKey = switchObjectId;
    
    if (activatedSwitches.has(switchKey)) {
      // Button is already activated - deactivate it
      setActivatedSwitches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(switchKey);
        return newSet;
      });

      // Initialize button frames to maxFrame and set direction to backward
      // This ensures the button animates backward from fully pressed (frame 3) to unpressed (frame 0)
      if (switchObj.animation) {
        const frameCount = switchObj.animation.frames.length;
        const maxFrame = frameCount - 1; // Frame 3 for 4-frame buttons

        switchObj.address.forEach((addr) => {
          const key = `${switchObj.id}-${addr}`;
          setButtonAnimationFrames((prev) => ({
            ...prev,
            [key]: maxFrame, // Start from frame 3 (fully pressed)
          }));
        });
      }

      // Set animation direction to backward
      setButtonAnimationDirection((prev) => ({
        ...prev,
        [switchObjectId]: 'backward',
      }));

      // Close the linked door
      if (switchObj.linkedObjectId) {
        setOpenedDoors((prev) => {
          const newSet = new Set(prev);
          newSet.delete(switchObj.linkedObjectId!);
          return newSet;
        });
        // Start door closing animation (play in reverse: 3->2->1->0)
        const doorObj = gameObjects.find((obj) => obj.id === switchObj.linkedObjectId);
        if (doorObj && doorObj.animation) {
          const frameCount = doorObj.animation.frames.length;
          const maxFrame = frameCount - 1; // Frame 3 for 4-frame doors
          
          // Initialize all door instances to max frame and set direction to backward
          doorObj.address.forEach((addr) => {
            const key = `${doorObj.id}-${addr}`;
            setDoorAnimationFrames((prev) => ({
              ...prev,
              [key]: maxFrame, // Start from frame 3 (fully opened)
            }));
          });
          
          // Set animation direction to backward
          setDoorAnimationDirection((prev) => ({
            ...prev,
            [switchObj.linkedObjectId as string]: 'backward',
          }));
          
          // Remove from completed doors so it renders during animation
          setCompletedDoors((prev) => {
            const newSet = new Set(prev);
            newSet.delete(doorObj.id);
            return newSet;
          });
        }
      }
    } else {
      // Button is not activated - activate it
      setActivatedSwitches((prev) => {
        const newSet = new Set(prev);
        newSet.add(switchKey);
        return newSet;
      });

      // Initialize button frames to 0 (unpressed state) and set direction to forward
      // This ensures the button animates forward from unpressed (frame 0) to fully pressed (frame 3)
      switchObj.address.forEach((addr) => {
        const key = `${switchObj.id}-${addr}`;
        setButtonAnimationFrames((prev) => ({
          ...prev,
          [key]: 0, // Start at frame 0 (unpressed)
        }));
      });

      // Set animation direction to forward and start animating immediately
      setButtonAnimationDirection((prev) => ({
        ...prev,
        [switchObjectId]: 'forward',
      }));

      // Find the linked door and activate it
      if (switchObj.linkedObjectId) {
        setOpenedDoors((prev) => {
          const newSet = new Set(prev);
          newSet.add(switchObj.linkedObjectId!);
          return newSet;
        });
      }
    }
  };

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
    <>
      <RotateDeviceScreen />
      <div 
        className="w-screen h-screen overflow-hidden flex items-start justify-center relative"
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

      {/* Hitbox Toggle Button */}
      <button
        onClick={() => setShowHitbox(!showHitbox)}
        className="absolute top-4 right-40 z-10 px-3 py-2 rounded font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        {showHitbox ? 'Hide Hitbox' : 'Show Hitbox'}
      </button>

      <div className="relative" style={{ width: gridCols * cellSize, height: gridRows * cellSize }}>
        {/* Game Objects Layer */}
        {cellSize > 0 && (
          <div className="absolute inset-0">
            {gameObjects.map((obj) => {
              return obj.address.map((addr) => {
                const key = `${obj.id}-${addr}`;
                const frameIndex = objectFrames[key] ?? 0;

                // Render appropriate component based on object type
                switch (obj.type) {
                  case 'block':
                    return (
                      <BlockObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'animated':
                    return (
                      <AnimatedObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        frameIndex={frameIndex}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'input':
                    return (
                      <InputObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        isActivated={activatedSwitches.has(obj.id)}
                        frameIndex={buttonAnimationFrames[key] ?? 0}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'output':
                    return (
                      <OutputObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        isActivated={openedDoors.has(obj.id)}
                        frameIndex={doorAnimationFrames[key] ?? 0}
                        isCompleted={completedDoors.has(obj.id)}
                        showHitbox={showHitbox}
                      />
                    );
                  default:
                    console.warn(`Unknown object type: ${obj.type}`);
                    return null;
                }
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

                // Scale hitbox to match current cellSize (hitboxes defined at 32px base)
                const HITBOX_BASE_SIZE = 32;
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
            onButtonPress={handleSwitchActivation}
            openedDoors={openedDoors}
            showHitbox={showHitbox}
          />
        )}
      </div>

      {/* Mobile Controls */}
      <MobileControls />
    </div>
    </>
  );
}
