import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import walking1 from '../assets/goblin/walking/walking1.svg';
import walking2 from '../assets/goblin/walking/walking2.svg';
import walking3 from '../assets/goblin/walking/walking3.svg';
import walking4 from '../assets/goblin/walking/walking4.svg';
import attack1 from '../assets/goblin/attack/attack1.svg';
import death1 from '../assets/goblin/death/death1.svg';
import death2 from '../assets/goblin/death/death2.svg';
import death3 from '../assets/goblin/death/death3.svg';
import heartFull from '../assets/ui/heart/heart_full.svg';
import heartEmpty from '../assets/ui/heart/heart_empty.svg';
import type { GameObject } from '../types/GameObject';
import { getObjectHitbox, checkHitboxCollision } from '../utils/physics';
import { getCleanAddress } from '../utils/addressParser';

interface GoblinProps {
  id: string;
  address: string; // Grid address (e.g., "N1", "P2")
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gameObjects: GameObject[];
  openedDoors: Set<string>;
  characterX?: number;
  characterY?: number;
  characterWidth?: number;
  characterHeight?: number;
  scale?: number;
  showHitbox?: boolean;
  isDefeated?: boolean; // Parent tells goblin if it's defeated (for visual feedback)
  isPlayerDead?: boolean; // Parent tells goblin if player is dead (prevents attacks)
  hitCount?: number; // Current hit count (0-3)
  isInGracePeriod?: boolean; // Whether goblin is currently invulnerable
  onAttackHit?: () => void; // Called when goblin's attack hits the character
}

interface GoblinState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  onGround: boolean;
}

interface GoblinHandle {
  getPosition: () => { x: number; y: number; width: number; height: number };
  turnTowardPlayer: (playerX: number) => void;
}

const GOBLIN_WIDTH = 48;
const GOBLIN_HEIGHT = 48;
const WALK_SPEED = 0.48; // Base walking speed (pixels per frame)
const CHASE_SPEED = 2.16; // Speed when chasing character
const GRAVITY = 0.6;
const MAX_VELOCITY_Y = 8;
const ANIMATION_SPEED = 6; // Frames before switching animation frame
const ATTACK_ANIMATION_SPEED = 16; // Slower attack animation
const DEATH_ANIMATION_SPEED = 12; // Death animation speed
const WALK_FRAMES = [walking1, walking2, walking3, walking4];
const ATTACK_FRAMES = [walking1, attack1]; // Attack animation alternates between walking and attack frames
const DEATH_FRAMES = [death1, death2, death3]; // Death animation sequence

const GoblinComponent = forwardRef<GoblinHandle, GoblinProps>(function Goblin(
  {
    id,
    address,
    cellSize,
    gridWidth,
    gridHeight,
    gameObjects,
    openedDoors,
    characterX,
    characterY,
    characterWidth = 48,
    characterHeight = 48,
    scale = 1,
    showHitbox = false,
    isDefeated = false,
    isPlayerDead = false,
    hitCount = 0,
    isInGracePeriod = false,
    onAttackHit,
  },
  ref
) {
  const width = GOBLIN_WIDTH * scale;
  const height = GOBLIN_HEIGHT * scale;

  const gridPixelWidth = gridWidth * cellSize;
  const gridPixelHeight = gridHeight * cellSize;

  // Helper function to convert grid address to pixel coordinates
  const getPixelPositionFromAddress = (addr: string): { x: number; y: number } => {
    const row = addr.charCodeAt(0) - 65;
    const col = parseInt(addr.substring(1)) - 1;
    return {
      x: col * cellSize,
      y: row * cellSize,
    };
  };

  // Calculate initial spawn position with ground collision
  const calculateInitialSpawnPos = (): { x: number; y: number } => {
    const addressPos = getPixelPositionFromAddress(address);

    // Find the ground level at this X position
    let groundY = gridPixelHeight - height; // Default to bottom of grid

    for (const obj of gameObjects) {
      if (obj.isCollectible || obj.type === 'input') continue;
      if (obj.type === 'output' && openedDoors.has(obj.id)) continue;

      for (const addr of obj.address) {
        const cleanAddr = getCleanAddress(addr);
        const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

        // Check if goblin X position overlaps with object horizontally
        const isOverlappingX = addressPos.x < objHitbox.right && addressPos.x + width > objHitbox.x;

        // If object is at or below spawn address, goblin should land on top of it
        if (isOverlappingX && objHitbox.y >= addressPos.y) {
          // Track highest ground surface (lowest Y value that's still below spawn)
          if (objHitbox.y < groundY + height) {
            groundY = objHitbox.y - height;
          }
        }
      }
    }

    return {
      x: addressPos.x,
      y: Math.max(addressPos.y, groundY),
    };
  };

  const initialPos = calculateInitialSpawnPos();

  const [goblin, setGoblin] = useState<GoblinState>({
    x: initialPos.x,
    y: initialPos.y,
    velocityX: WALK_SPEED,
    velocityY: 0,
    width: width,
    height: height,
    onGround: true,
  });

  const [facingRight, setFacingRight] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const [graceFlicker, setGraceFlicker] = useState(true); // Flicker during grace period
  const [isAttacking, setIsAttacking] = useState(false); // Whether goblin is attacking
  const [isDeathAnimationComplete, setIsDeathAnimationComplete] = useState(false); // Track if death animation finished

  const characterXRef = useRef(characterX);
  const characterYRef = useRef(characterY);
  const isChasingRef = useRef(false);
  const frameCycleRef = useRef(0);
  const lastAttackTimeRef = useRef<number>(0); // Track last attack hit time for grace period
  const ATTACK_GRACE_PERIOD_MS = 1000; // 1 second between attacks on the same character

  // Expose position and turnTowardPlayer for parent punch detection
  useImperativeHandle(
    ref,
    () => ({
      getPosition: () => ({
        x: goblin.x,
        y: goblin.y,
        width: goblin.width,
        height: goblin.height,
      }),
      turnTowardPlayer: (playerX: number) => {
        // Determine direction: if player is to the right, face right; otherwise face left
        setGoblin((prevGoblin) => {
          const goblinCenterX = prevGoblin.x + prevGoblin.width / 2;
          const shouldFaceRight = playerX > goblinCenterX;
          setFacingRight(shouldFaceRight);
          // Update velocity to move in the direction the goblin is now facing
          return {
            ...prevGoblin,
            velocityX: shouldFaceRight ? 1 : -1,
          };
        });
        // Force chase mode so goblin actively walks toward player regardless of previous state
        isChasingRef.current = true;
      },
    }),
    [goblin]
  );

  // Sync character position refs
  useEffect(() => {
    characterXRef.current = characterX;
    characterYRef.current = characterY;
  }, [characterX, characterY]);

  // Reset chasing when player dies
  useEffect(() => {
    if (isPlayerDead) {
      isChasingRef.current = false; // Stop chasing when player is dead
      setIsAttacking(false); // Stop attacking when player is dead
    }
  }, [isPlayerDead]);

  // Update goblin size when scale changes
  useEffect(() => {
    const newWidth = GOBLIN_WIDTH * scale;
    const newHeight = GOBLIN_HEIGHT * scale;
    setGoblin((prevGoblin) => ({
      ...prevGoblin,
      width: newWidth,
      height: newHeight,
    }));
  }, [scale]);

  // Check attack collision and damage character
  useEffect(() => {
    if (!isAttacking || !characterX || characterY === undefined) return;
    if (isPlayerDead) return; // Don't attack if player is dead

    // Only deal damage during the actual attack frame (when attack1 is displayed)
    const isOnAttackFrame = frameIndex % ATTACK_FRAMES.length === 1;
    if (!isOnAttackFrame) return;

    const now = Date.now();
    
    // Check grace period - don't attack again if recently hit
    if (now - lastAttackTimeRef.current < ATTACK_GRACE_PERIOD_MS) return;

    // Calculate attack hitbox (0.1 width, 0.3 height, positioned at 75% when facing right, 25% when facing left)
    const attackWidth = goblin.width * 0.1;
    const attackHeight = goblin.height * 0.3;
    const attackY = goblin.y + goblin.height * 0.35;
    const attackX = goblin.x + (facingRight ? goblin.width * 0.75 : goblin.width * 0.25) - attackWidth / 2;

    // Character hitbox
    const charHitbox = {
      x: characterX,
      y: characterY,
      right: characterX + characterWidth,
      bottom: characterY + characterHeight,
    };

    // AABB collision check
    const attackHits =
      attackX < charHitbox.right &&
      attackX + attackWidth > charHitbox.x &&
      attackY < charHitbox.bottom &&
      attackY + attackHeight > charHitbox.y;

    if (attackHits && !isDefeated) {
      lastAttackTimeRef.current = now;
      onAttackHit?.();
    }
  }, [isAttacking, characterX, characterY, facingRight, goblin, characterWidth, characterHeight, onAttackHit, isDefeated, frameIndex, isPlayerDead]);

  // Grace period flicker animation
  useEffect(() => {
    if (!isInGracePeriod) {
      setGraceFlicker(true);
      return;
    }

    const timer = setInterval(() => {
      setGraceFlicker((prev) => !prev);
    }, 100); // Flicker every 100ms during grace period

    return () => clearInterval(timer);
  }, [isInGracePeriod]);

  // Ground collision check
  const checkIfOnGround = (char: GoblinState): boolean => {
    const charHitbox = {
      x: char.x,
      y: char.y,
      width: char.width,
      height: char.height,
      right: char.x + char.width,
      bottom: char.y + char.height,
    };

    const scaledTolerance = cellSize * 0.47;

    for (const obj of gameObjects) {
      if (obj.isCollectible || obj.type === 'input') continue;
      if (obj.type === 'output' && openedDoors.has(obj.id)) continue;

      for (const addr of obj.address) {
        const cleanAddr = getCleanAddress(addr);
        const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

        const isAbove = charHitbox.bottom <= objHitbox.y + scaledTolerance && charHitbox.bottom > objHitbox.y - (scaledTolerance * 0.67);
        const isOverlappingX = charHitbox.x < objHitbox.right && charHitbox.right > objHitbox.x;
        const isFalling = char.velocityY >= 0;

        if (isAbove && isOverlappingX && isFalling) {
          return true;
        }
      }
    }

    // Check bottom edge of grid
    if (char.y + char.height >= gridPixelHeight) {
      return true;
    }

    return false;
  };

  // Check collision with objects for horizontal movement
  const checkHorizontalCollision = (newX: number, char: GoblinState): boolean => {
    const testHitbox = {
      x: newX,
      y: char.y,
      width: char.width,
      height: char.height,
      right: newX + char.width,
      bottom: char.y + char.height,
    };

    for (const obj of gameObjects) {
      if (obj.isCollectible || obj.type === 'input') continue;
      if (obj.type === 'output' && openedDoors.has(obj.id)) continue;

      for (const addr of obj.address) {
        const cleanAddr = getCleanAddress(addr);
        const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

        if (checkHitboxCollision(testHitbox, objHitbox)) {
          return true;
        }
      }
    }

    return false;
  };

  // Physics loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGoblin((prevGoblin) => {
        let newGoblin = { ...prevGoblin };

        // Stop if defeated
        if (isDefeated) {
          newGoblin.velocityX = 0;
          newGoblin.velocityY = 0;
          return newGoblin;
        }

        // Apply gravity
        newGoblin.velocityY = Math.min(newGoblin.velocityY + GRAVITY, MAX_VELOCITY_Y);
        newGoblin.y += newGoblin.velocityY;

        // Clamp to grid bottom
        if (newGoblin.y + newGoblin.height > gridPixelHeight) {
          newGoblin.y = gridPixelHeight - newGoblin.height;
          newGoblin.velocityY = 0;
          newGoblin.onGround = true;
        } else {
          // Check ground collision with objects
          const onGround = checkIfOnGround(newGoblin);
          if (onGround && newGoblin.velocityY > 0) {
            // Snap to the surface the goblin is landing on
            let surfaceY = gridPixelHeight;
            for (const obj of gameObjects) {
              if (obj.isCollectible || obj.type === 'input') continue;
              if (obj.type === 'output' && openedDoors.has(obj.id)) continue;

              for (const addr of obj.address) {
                const cleanAddr = getCleanAddress(addr);
                const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

                const charHitbox = {
                  x: newGoblin.x,
                  y: newGoblin.y,
                  width: newGoblin.width,
                  height: newGoblin.height,
                  right: newGoblin.x + newGoblin.width,
                  bottom: newGoblin.y + newGoblin.height,
                };

                const isOverlappingX = charHitbox.x < objHitbox.right && charHitbox.right > objHitbox.x;
                
                // Track the closest surface the goblin is landing on
                if (isOverlappingX && objHitbox.y >= charHitbox.bottom - 5 && objHitbox.y < surfaceY) {
                  surfaceY = objHitbox.y;
                }
              }
            }

            if (surfaceY < gridPixelHeight) {
              newGoblin.y = surfaceY - newGoblin.height;
              newGoblin.velocityY = 0;
            }
          }
          newGoblin.onGround = onGround;
        }

        // Determine current walk speed based on character proximity
        let currentSpeed = WALK_SPEED * scale;
        const goblinCenterX = newGoblin.x + newGoblin.width / 2;
        const goblinFacingRight = newGoblin.velocityX > 0;
        let shouldAttack = false;
        
        if (!isPlayerDead && characterXRef.current !== undefined && characterYRef.current !== undefined) {
          const relativeX = characterXRef.current - goblinCenterX;
          const goblinHalfWidth = newGoblin.width / 2;
          
          // Calculate attack hitbox for collision check (positioned at 75% when facing right, 25% when facing left)
          const attackWidth = newGoblin.width * 0.1;
          const attackHeight = newGoblin.height * 0.3;
          const attackY = newGoblin.y + newGoblin.height * 0.35;
          const attackX = newGoblin.x + (goblinFacingRight ? newGoblin.width * 0.75 : newGoblin.width * 0.25) - attackWidth / 2;
          
          // Character hitbox
          const charHitbox = {
            x: characterXRef.current,
            y: characterYRef.current,
            right: characterXRef.current + characterWidth,
            bottom: characterYRef.current + characterHeight,
          };
          
          // Check if attack hitbox collides with character
          const attackHits =
            attackX < charHitbox.right &&
            attackX + attackWidth > charHitbox.x &&
            attackY < charHitbox.bottom &&
            attackY + attackHeight > charHitbox.y;
          
          // Only attack if collision detected
          if (attackHits) {
            shouldAttack = true;
          }
          
          // Start chasing only if character is past the midway point and in front
          if ((goblinFacingRight && relativeX > goblinHalfWidth) || (!goblinFacingRight && relativeX < -goblinHalfWidth)) {
            isChasingRef.current = true;
          }
          
          // Stop chasing if character gets behind or far away
          if ((goblinFacingRight && relativeX < 0) || (!goblinFacingRight && relativeX > 0)) {
            isChasingRef.current = false;
          }
        }
        
        // Update attack state
        setIsAttacking(shouldAttack);
        
        // Use chase speed if actively chasing (but not attacking, and player is alive)
        if (isChasingRef.current && !shouldAttack && !isPlayerDead) {
          currentSpeed = CHASE_SPEED * scale;
        }

        // Apply horizontal movement (but don't move if attacking)
        let newX = newGoblin.x;
        if (!shouldAttack) {
          newX = newGoblin.x + (currentSpeed * Math.sign(newGoblin.velocityX));
        }

        // Only turn around when hitting objects (not at grid edges)
        if (checkHorizontalCollision(newX, newGoblin)) {
          // Turn around at objects
          newGoblin.velocityX = -Math.sign(newGoblin.velocityX);
          setFacingRight(newGoblin.velocityX > 0);
          newX = newGoblin.x + (currentSpeed * Math.sign(newGoblin.velocityX));
        } else if (newX < 0 || newX + newGoblin.width > gridPixelWidth) {
          // Turn around at grid edges to prevent walking off-screen
          newGoblin.velocityX = -Math.sign(newGoblin.velocityX);
          setFacingRight(newGoblin.velocityX > 0);
          newX = newGoblin.x + (currentSpeed * Math.sign(newGoblin.velocityX));
        }

        // Update velocity to maintain direction
        newGoblin.velocityX = Math.sign(newGoblin.velocityX);

        newGoblin.x = Math.max(0, Math.min(newX, gridPixelWidth - newGoblin.width));
        newGoblin.y = Math.max(0, newGoblin.y);

        return newGoblin;
      });

      // Update animation frame
      let currentAnimSpeed = ANIMATION_SPEED;
      let maxFrames = WALK_FRAMES.length;

      if (isDefeated && !isDeathAnimationComplete) {
        // Play death animation
        currentAnimSpeed = DEATH_ANIMATION_SPEED;
        maxFrames = DEATH_FRAMES.length;
      } else if (isAttacking && !isDefeated) {
        currentAnimSpeed = ATTACK_ANIMATION_SPEED;
        maxFrames = ATTACK_FRAMES.length;
      }

      frameCycleRef.current++;
      if (frameCycleRef.current >= currentAnimSpeed) {
        frameCycleRef.current = 0;
        
        // Don't update frame if death animation is already complete - just freeze on final frame
        if (isDefeated && isDeathAnimationComplete) {
          return;
        }
        
        setFrameIndex((prev) => {
          const nextFrame = prev + 1;
          
          // Check if death animation reached final frame
          if (isDefeated && !isDeathAnimationComplete && nextFrame >= DEATH_FRAMES.length) {
            setIsDeathAnimationComplete(true);
            return DEATH_FRAMES.length - 1; // Freeze on final frame
          }
          
          return nextFrame % maxFrames;
        });
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gridPixelWidth, gridPixelHeight, cellSize, gridWidth, gridHeight, isDefeated, isAttacking, isDeathAnimationComplete, facingRight, isPlayerDead]);

  return (
    <>
      {/* Goblin image - show alive or dead animation */}
      <img
        src={
          isDefeated
            ? DEATH_FRAMES[Math.min(frameIndex, DEATH_FRAMES.length - 1)]
            : isAttacking
            ? ATTACK_FRAMES[frameIndex % ATTACK_FRAMES.length]
            : WALK_FRAMES[frameIndex]
        }
        alt={`goblin-${id}`}
        style={{
          position: 'absolute',
          width: `${isAttacking && !isDefeated && frameIndex % ATTACK_FRAMES.length === 1 ? goblin.width * 1.1 : goblin.width}px`,
          height: `${isAttacking && !isDefeated && frameIndex % ATTACK_FRAMES.length === 1 ? goblin.height * 1.3 : goblin.height}px`,
          imageRendering: 'pixelated',
          userSelect: 'none',
          pointerEvents: 'none',
          transformOrigin: 'center center',
          opacity: isInGracePeriod && !graceFlicker ? 0.3 : 1,
          transform: `translate(${goblin.x - (isAttacking && !isDefeated && frameIndex % ATTACK_FRAMES.length === 1 ? goblin.width * 0.05 : 0)}px, ${goblin.y - (isAttacking && !isDefeated && frameIndex % ATTACK_FRAMES.length === 1 ? goblin.height * 0.125 : 0)}px) ${facingRight ? 'scaleX(1)' : 'scaleX(-1)'}`,
          willChange: 'transform', // Hardware acceleration
          transition: 'opacity 0.06s',
        }}
      />
      {/* Hearts - only show if alive */}
      {!isDefeated && (
        <div
          style={{
            position: 'absolute',
            left: `${goblin.x + goblin.width / 2}px`,
            top: `${goblin.y - cellSize * 0.3}px`,
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: `${cellSize * 0.05}px`,
            userSelect: 'none',
            pointerEvents: 'none',
            opacity: isInGracePeriod && !graceFlicker ? 0.3 : 1,
            transition: 'opacity 0.06s',
          }}
        >
          {/* Render full hearts for remaining health */}
          {Array.from({ length: Math.max(0, 3 - hitCount) }).map((_, i) => (
            <img
              key={`full-${i}`}
              src={heartFull}
              alt="health"
              style={{
                width: `${Math.max(8, cellSize * 0.25)}px`,
                height: `${Math.max(8, cellSize * 0.25)}px`,
                imageRendering: 'pixelated',
              }}
            />
          ))}
          {/* Render empty hearts for damage taken */}
          {Array.from({ length: hitCount }).map((_, i) => (
            <img
              key={`empty-${i}`}
              src={heartEmpty}
              alt="damage"
              style={{
                width: `${Math.max(8, cellSize * 0.25)}px`,
                height: `${Math.max(8, cellSize * 0.25)}px`,
                imageRendering: 'pixelated',
              }}
            />
          ))}
        </div>
      )}
      {showHitbox && !isDefeated && (
        <div
          style={{
            position: 'absolute',
            left: `${goblin.x}px`,
            top: `${goblin.y}px`,
            width: `${goblin.width}px`,
            height: `${goblin.height}px`,
            border: '2px solid blue',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
          }}
        />
      )}
      {showHitbox && !isDefeated && isAttacking && (
        <div
          style={{
            position: 'absolute',
            left: `${goblin.x + (facingRight ? goblin.width * 0.75 : goblin.width * 0.25) - goblin.width * 0.1 / 2}px`,
            top: `${goblin.y + goblin.height * 0.35}px`,
            width: `${goblin.width * 0.1}px`,
            height: `${goblin.height * 0.3}px`,
            border: '2px solid red',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          }}
        />
      )}
    </>
  );
});

export default GoblinComponent;
