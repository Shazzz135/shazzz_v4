import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameObject } from '../types/GameObject';
import {
  ANIMATION_FRAMES,
  ANIMATION_SPEED,
  type AnimationState,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
} from '../constants/animations';
import { HITBOX_CONFIG } from '../constants/hitboxes';
import type { CharacterState } from '../utils/physics';
import {
  applyPhysics,
  jump,
  moveLeft,
  moveRight,
  stopMoving,
} from '../utils/physics';

/**
 * Character component - Manages player character rendering, animation, input handling, and physics
 * Controls: A/D (move), W (jump), Space (punch), S (prone - toggle)
 */

interface CharacterProps {
  gameObjects: GameObject[];
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  scale: number;
  spawnAddress?: string; // Character spawn position as grid address (e.g., "E8")
  showHitbox?: boolean; // Debug: show character hitbox
  onHealthChange?: (health: number) => void;
  onSpikeHit?: (spikeAddress: string) => void;
}

// Helper function to convert grid address to pixel coordinates
const getPixelPositionFromAddress = (address: string, cellSize: number): { x: number; y: number } => {
  const row = address.charCodeAt(0) - 65;
  const col = parseInt(address.substring(1)) - 1;
  return {
    x: col * cellSize,
    y: row * cellSize,
  };
};

export default function Character({
  gameObjects,
  cellSize,
  gridWidth,
  gridHeight,
  scale,
  spawnAddress = 'C5',
  showHitbox = false,
  onHealthChange,
  onSpikeHit,
}: CharacterProps) {
  // ========== STATE ==========
  const initialSpawnPos = getPixelPositionFromAddress(spawnAddress, cellSize);
  const [character, setCharacter] = useState<CharacterState>({
    x: initialSpawnPos.x,
    y: initialSpawnPos.y,
    velocityX: 0,
    velocityY: 0,
    width: CHARACTER_WIDTH * scale * 0.95,
    height: CHARACTER_HEIGHT * scale * 0.95,
    isJumping: false,
    isFalling: false,
    onGround: true,
  });

  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const [facingRight, setFacingRight] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [isProne, setIsProne] = useState(false);
  const [isProneLockedByObstacle, setIsProneLockedByObstacle] = useState(false);
  const [health, setHealth] = useState(1); // 1=full, 0.5=half, 0=empty
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [flickerState, setFlickerState] = useState(true); // Controls flicker visibility during immunity

  // ========== REFS ==========
  const keysPressed = useRef<Record<string, boolean>>({});
  const gameLoopRef = useRef<number | null>(null);
  const animationTickRef = useRef(0);
  const lastGridPositionRef = useRef<Array<{ x: number; y: number }>>([]);
  const isProneLockedRef = useRef(false); // Sync lock state for keyboard events
  const invulnerabilityEndRef = useRef<number | null>(null); // Timestamp when invulnerability ends
  const recentlyHitSpikesRef = useRef<Set<string>>(new Set()); // Track recently hit spike addresses
  const lastSpikeHitTimeRef = useRef<Record<string, number>>({}); // Track last hit time for each spike (3 second cooldown)

  // Helper function to get all grid cells occupied by character's hitbox
  const getOccupiedGridCells = useCallback((char: CharacterState, currentAnimState: AnimationState): Array<{ x: number; y: number }> => {
    const config = HITBOX_CONFIG[currentAnimState as keyof typeof HITBOX_CONFIG];
    const hitboxLeft = char.x + config.offsetX;
    const hitboxRight = hitboxLeft + config.width;
    const hitboxTop = char.y + config.offsetY;
    const hitboxBottom = hitboxTop + config.height;

    const cells: Array<{ x: number; y: number }> = [];
    const minGridX = Math.floor(hitboxLeft / cellSize);
    const maxGridX = Math.floor((hitboxRight - 1) / cellSize);
    const minGridY = Math.floor(hitboxTop / cellSize);
    const maxGridY = Math.floor((hitboxBottom - 1) / cellSize);

    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }, [cellSize, gridWidth, gridHeight]);

  // Helper function to check for overhead obstacles
  const checkForOverheadObstacle = useCallback((char: CharacterState, currentAnimState: AnimationState): boolean => {
    const standingConfig = HITBOX_CONFIG[currentAnimState as keyof typeof HITBOX_CONFIG];
    const testHitbox = {
      x: char.x + standingConfig.offsetX,
      y: char.y + standingConfig.offsetY,
      width: standingConfig.width,
      height: standingConfig.height,
      right: char.x + standingConfig.offsetX + standingConfig.width,
      bottom: char.y + standingConfig.offsetY + standingConfig.height,
    };
    
    const headTop = testHitbox.y;
    const checkZoneTop = headTop - cellSize;
    const checkZoneBottom = headTop + 5;
    
    for (const obj of gameObjects) {
      for (const addr of obj.address) {
        const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
        const rowLetter = cleanAddr.charCodeAt(0);
        
        if (rowLetter >= 80) continue; // Skip P layer and below
        
        const gridY = (rowLetter - 65) * cellSize;
        const gridX = (parseInt(cleanAddr.substring(1)) - 1) * cellSize;
        
        // Use the actual object hitbox
        const objHitbox = {
          x: gridX + obj.hitbox.x,
          y: gridY + obj.hitbox.y,
          right: gridX + obj.hitbox.x + obj.hitbox.width,
          bottom: gridY + obj.hitbox.y + obj.hitbox.height,
        };
        
        const objectIsAboveHead = objHitbox.y < checkZoneBottom && objHitbox.bottom > checkZoneTop;
        const xOverlap = testHitbox.x < objHitbox.right && testHitbox.right > objHitbox.x;
        
        if (objectIsAboveHead && xOverlap) {
          return true; // Found obstacle
        }
      }
    }
    return false; // No obstacle
  }, [gameObjects, cellSize]);

  // Helper function to check for spike collision and deal damage
  const checkSpikeDamage = useCallback((char: CharacterState, currentAnimState: AnimationState) => {
    if (isInvulnerable) return; // Skip if already invulnerable

    const config = HITBOX_CONFIG[currentAnimState as keyof typeof HITBOX_CONFIG];
    const charHitbox = {
      x: char.x + config.offsetX * scale * 0.95,
      y: char.y + config.offsetY * scale * 0.95,
      width: config.width * scale * 0.95,
      height: config.height * scale * 0.95,
      right: char.x + config.offsetX * scale * 0.95 + config.width * scale * 0.95,
      bottom: char.y + config.offsetY * scale * 0.95 + config.height * scale * 0.95,
    };

    // Find spike objects and check for collision
    for (const obj of gameObjects) {
      if (obj.id !== 'spikes') continue;

      for (const addr of obj.address) {
        const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
        const rowLetter = cleanAddr.charCodeAt(0);
        const gridY = (rowLetter - 65) * cellSize;
        const gridX = (parseInt(cleanAddr.substring(1)) - 1) * cellSize;

        // Get spike hitbox (bottom 30% for damage)
        const spikeHitbox = {
          x: gridX + obj.hitbox.x,
          y: gridY + obj.hitbox.y,
          right: gridX + obj.hitbox.x + obj.hitbox.width,
          bottom: gridY + obj.hitbox.y + obj.hitbox.height,
        };

        // Check overlap
        if (
          charHitbox.x < spikeHitbox.right &&
          charHitbox.right > spikeHitbox.x &&
          charHitbox.y < spikeHitbox.bottom &&
          charHitbox.bottom > spikeHitbox.y
        ) {
          // Check if spike was hit in the last 3 seconds
          const now = Date.now();
          const lastHitTime = lastSpikeHitTimeRef.current[addr] ?? 0;
          const timeSinceLastHit = now - lastHitTime;
          const CAN_HIT_AGAIN = timeSinceLastHit >= 3000; // 3 second cooldown

          if (CAN_HIT_AGAIN) {
            // Deal damage (0.5 = half a heart)
            setHealth((prev) => {
              const newHealth = Math.max(prev - 0.5, 0);
              console.log(`DAMAGE: Health ${prev.toFixed(1)} → ${newHealth.toFixed(1)}`);
              return newHealth;
            });

            // Record hit time for this spike
            lastSpikeHitTimeRef.current[addr] = now;
            onSpikeHit?.(addr); // Notify parent of spike hit
          }

          // Mark spike as recently hit for flicker effect (visual feedback)
          recentlyHitSpikesRef.current.add(addr);
          setTimeout(() => {
            recentlyHitSpikesRef.current.delete(addr);
          }, 300); // Flicker for 300ms

          // Start invulnerability
          setIsInvulnerable(true);
          invulnerabilityEndRef.current = Date.now() + 3000; // 3 second immunity
          setFlickerState(true);
        }
      }
    }
  }, [isInvulnerable, gameObjects, cellSize, scale, onSpikeHit]);

  // ========== INPUT HANDLING ==========
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current[key] = true;

    if (key === 'w' && !isProne) {
      setCharacter((prev) => jump(prev, scale));
    }
    if (key === ' ' && character.onGround && character.velocityX === 0 && !keysPressed.current['a'] && !keysPressed.current['d'] && !isProne) {
      setIsPunching(true);
      e.preventDefault();
    }
    if (key === 's') {
      console.log('CHARACTER: Entering prone');
      setIsProne(true);
    }
  }, [isProne, scale, character.onGround, character.velocityX]);

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    keysPressed.current[key] = false;

    if (key === 's') {
      // Use ref for current lock state (avoids stale closure issue)
      if (!isProneLockedRef.current) {
        console.log('CHARACTER: Prone unlocked - standing up');
        setIsProne(false);
      } else {
        console.log('CHARACTER: Prone locked - cannot stand up');
      }
    }
  };

  // ========== EFFECTS ==========
  // Sync locked state to ref for keyboard event handlers
  useEffect(() => {
    isProneLockedRef.current = isProneLockedByObstacle;
  }, [isProneLockedByObstacle]);

  // Manage invulnerability timer and flicker effect
  useEffect(() => {
    if (!isInvulnerable) return;

    const flickerInterval = setInterval(() => {
      setFlickerState((prev) => !prev);
    }, 200); // Toggle flicker every 200ms

    const invulnerabilityInterval = setInterval(() => {
      if (invulnerabilityEndRef.current && Date.now() >= invulnerabilityEndRef.current) {
        setIsInvulnerable(false);
        setFlickerState(true);
        invulnerabilityEndRef.current = null;
        console.log('IMMUNITY: Invulnerability ended');
      }
    }, 50); // Check every 50ms

    return () => {
      clearInterval(flickerInterval);
      clearInterval(invulnerabilityInterval);
    };
  }, [isInvulnerable]);

  // Update parent when health changes
  useEffect(() => {
    onHealthChange?.(health);
  }, [health, onHealthChange]);

  // Check overhead obstacles when character moves to a new grid cell (only when prone)
  useEffect(() => {
    if (isProne) {
      // Get all grid cells currently occupied by character
      const currentOccupiedCells = getOccupiedGridCells(character, 'idle');
      
      // Check if the set of occupied cells has changed
      const cellsChanged = lastGridPositionRef.current.length !== currentOccupiedCells.length ||
        lastGridPositionRef.current.some((prevCell, idx) => 
          !currentOccupiedCells[idx] || 
          prevCell.x !== currentOccupiedCells[idx].x || 
          prevCell.y !== currentOccupiedCells[idx].y
        );
      
      if (cellsChanged) {
        lastGridPositionRef.current = currentOccupiedCells;
        
        // Check for overhead obstacle using standing hitbox (idle)
        const hasObstacle = checkForOverheadObstacle(character, 'idle');
        const isHoldingProneKey = keysPressed.current['s'];
        
        // Update lock state based on current state and what we found
        if (isProneLockedByObstacle && !hasObstacle) {
          // Was locked, but now clear - unlock
          console.log('CHARACTER: Prone clearance - no overhead obstacles');
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsProneLockedByObstacle(false);
          // Auto-stand only if NOT holding 's'
          if (!isHoldingProneKey) {
            console.log('CHARACTER: Standing up (not holding prone key)');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsProne(false);
          } else {
            console.log('CHARACTER: Staying prone (holding prone key)');
          }
        } else if (!isProneLockedByObstacle && hasObstacle) {
          // Was unlocked, but now blocked - lock
          console.log('CHARACTER: Overhead obstacle - prone is now locked');
          setIsProneLockedByObstacle(true);
        }
      }
    } else {
      // Update grid position ref even when not prone for next time
      lastGridPositionRef.current = getOccupiedGridCells(character, 'idle');
    }
  }, [character, isProne, isProneLockedByObstacle, checkForOverheadObstacle, getOccupiedGridCells]);

  // Update character size when scale changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharacter((prev) => ({
      ...prev,
      width: CHARACTER_WIDTH * scale * 0.95,
      height: CHARACTER_HEIGHT * scale * 0.95,
    }));
  }, [scale]);

  // Recalculate character position when cellSize changes to maintain relative grid position
  useEffect(() => {
    const newSpawnPos = getPixelPositionFromAddress(spawnAddress, cellSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharacter((prev) => ({
      ...prev,
      x: newSpawnPos.x,
      y: newSpawnPos.y,
    }));
  }, [cellSize, spawnAddress]);

  // Game loop with physics and movement
  useEffect(() => {
    const gameLoop = () => {
      setCharacter((prev) => {
        let newChar = { ...prev };

        // Handle movement input (allowed in prone now)
        const movingLeft = keysPressed.current['a'];
        const movingRight = keysPressed.current['d'];

        // If both A and D are pressed, stop movement
        if (movingLeft && movingRight) {
          newChar = stopMoving(newChar);
        } else if (movingLeft) {
          // Half movement speed while prone
          if (isProne) {
            newChar = moveLeft(newChar, scale * 0.5);
          } else {
            newChar = moveLeft(newChar, scale);
          }
          if (facingRight) setFacingRight(false);
        } else if (movingRight) {
          // Half movement speed while prone
          if (isProne) {
            newChar = moveRight(newChar, scale * 0.5);
          } else {
            newChar = moveRight(newChar, scale);
          }
          if (!facingRight) setFacingRight(true);
        } else {
          newChar = stopMoving(newChar);
        }

        // Debug velocity changes
        if (Math.abs(newChar.velocityX - prev.velocityX) > 0.01) {
          console.log(`Velocity: ${prev.velocityX.toFixed(2)} → ${newChar.velocityX.toFixed(2)}`);
        }

        // Determine animation state for physics
        let physicsAnimState: AnimationState = 'idle';
        if (isPunching) {
          physicsAnimState = 'punching';
        } else if (isProne) {
          physicsAnimState = 'prone';
        } else if (prev.isJumping || (prev.velocityY !== 0 && !prev.onGround)) {
          physicsAnimState = 'jumping';
        } else if (prev.velocityX !== 0) {
          physicsAnimState = 'running';
        }
        
        // Scale hitbox config for current animation state
        const baseHitboxConfig = HITBOX_CONFIG[physicsAnimState];
        const scaledHitboxConfig = {
          width: baseHitboxConfig.width * scale * 0.95,
          height: baseHitboxConfig.height * scale * 0.95,
          offsetX: baseHitboxConfig.offsetX * scale * 0.95,
          offsetY: baseHitboxConfig.offsetY * scale * 0.95,
        };
        
        newChar = applyPhysics(
          newChar,
          gameObjects,
          cellSize,
          gridWidth,
          gridHeight,
          scaledHitboxConfig,
          scale
        );

        // Check if landed
        if (newChar.onGround && prev.isJumping) {
          newChar.isJumping = false;
        }

        // Check for spike damage
        checkSpikeDamage(newChar, physicsAnimState);

        return newChar;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameObjects, cellSize, gridWidth, gridHeight, facingRight, isProne, scale, isPunching, checkSpikeDamage, handleKeyDown]);

  // Animation state machine and frame updates
  useEffect(() => {
    // Determine animation state based on character action
    let newAnimState: AnimationState = 'idle';

    if (isPunching) {
      newAnimState = 'punching';
    } else if (isProne) {
      newAnimState = 'prone';
    } else if (character.isJumping || (character.velocityY !== 0 && !character.onGround)) {
      newAnimState = 'jumping';
    } else if (character.velocityX !== 0) {
      newAnimState = 'running';
    } else {
      newAnimState = 'idle';
      if (animationState !== 'idle') {
        console.log('CHARACTER: Standing idle');
      }
    }

    // Reset frame when animation state changes
    if (newAnimState !== animationState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimationState(newAnimState);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrameIndex(0);
      animationTickRef.current = 0;
    }

    // Update animation frames at specified speed
    const animationInterval = setInterval(() => {
      animationTickRef.current++;
      
      // For prone: freeze animation when stationary, speed 10 when moving
      let speed: number;
      if (newAnimState === 'prone') {
        speed = character.velocityX !== 0 ? 10 : Infinity; // Infinity means never update frame
      } else {
        speed = ANIMATION_SPEED[newAnimState] || 10;
      }

      if (animationTickRef.current >= speed) {
        animationTickRef.current = 0;
        setFrameIndex((prev) => {
          const frameList = ANIMATION_FRAMES[newAnimState as AnimationState];
          const maxFrames = frameList?.length || 1;

          // Special handling for jumping animation
          if (newAnimState === 'jumping' && prev === 0) {
            return 1;
          } else if (newAnimState === 'jumping' && prev === 1 && !character.onGround) {
            return 1;
          } else if (newAnimState === 'jumping' && character.onGround) {
            return 0;
          }

          const nextFrame = (prev + 1) % maxFrames;

          // Auto-exit punch animation after completion
          if (newAnimState === 'punching' && nextFrame === 0) {
            setIsPunching(false);
          }

          return nextFrame;
        });
      }
    }, 16);

    return () => clearInterval(animationInterval);
  }, [character, animationState, isPunching, isProne]);

  // ========== RENDERING ==========
  const frames = ANIMATION_FRAMES[animationState as AnimationState];
  const currentFrame = frames[frameIndex] || frames[0];

  return (
    <>
      <img
        src={currentFrame}
        alt="character"
        className="absolute"
        style={{
          left: `${character.x}px`,
          top: `${character.y}px`,
          width: `${character.width}px`,
          height: `${character.height}px`,
          objectFit: 'contain',
          transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)',
          pointerEvents: 'none',
          opacity: isInvulnerable && !flickerState ? 0 : 1, // Flicker during immunity
          transition: 'opacity 0.05s', // Smooth opacity changes
        }}
      />
      {showHitbox && (
        <svg
          className="absolute"
          style={{
            left: '0px',
            top: '0px',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <rect
            x={character.x + HITBOX_CONFIG[animationState as keyof typeof HITBOX_CONFIG].offsetX * scale * 0.95}
            y={character.y + HITBOX_CONFIG[animationState as keyof typeof HITBOX_CONFIG].offsetY * scale * 0.95}
            width={HITBOX_CONFIG[animationState as keyof typeof HITBOX_CONFIG].width * scale * 0.95}
            height={HITBOX_CONFIG[animationState as keyof typeof HITBOX_CONFIG].height * scale * 0.95}
            fill="none"
            stroke="#0000FF"
            strokeWidth="2"
            opacity="0.7"
          />
        </svg>
      )}
    </>
  );
}
