import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
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
import { getCleanAddress } from '../utils/addressParser';
import death1 from '../assets/character/death/death1.svg';
import death2 from '../assets/character/death/death2.svg';
import death3 from '../assets/character/death/death3.svg';
import death4 from '../assets/character/death/death4.svg';

interface CharacterProps {
  gameObjects: GameObject[];
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  scale: number;
  spawnAddress?: string;
  showHitbox?: boolean;
  onHealthChange?: (health: number) => void;
  onDeath?: () => void;
  onSpikeHit?: (spikeAddress: string) => void;
  onButtonPress?: (buttonObjectId: string) => void;
  onCollectItem?: (itemAddress: string) => void;
  openedDoors?: Set<string>;
  onPositionChange?: (x: number, y: number) => void;
  onPunch?: (x: number, y: number, width: number, height: number) => void;
  onPortalEnter?: (x: number, y: number) => void;
}

const getPixelPositionFromAddress = (
  address: string,
  cellSize: number
): { x: number; y: number } => {
  const cleanAddr = address.replace(/[FLDR]$/, '');
  const row = cleanAddr.charCodeAt(0) - 65;
  const col = parseInt(cleanAddr.substring(1), 10) - 1;

  return {
    x: col * cellSize,
    y: row * cellSize,
  };
};

const DEATH_FRAMES = [death1, death2, death3, death4];
const DEATH_ANIMATION_SPEED = 12;

const Character = forwardRef<
  {
    takeDamage: (amount: number, source: string) => void;
    teleportTo: (x: number, y: number) => void;
  },
  CharacterProps
>(
  (
    {
      gameObjects,
      cellSize,
      gridWidth,
      gridHeight,
      scale,
      spawnAddress = 'C5',
      showHitbox = false,
      onHealthChange,
      onDeath,
      onSpikeHit,
      onButtonPress,
      onCollectItem,
      openedDoors = new Set(),
      onPositionChange,
      onPunch,
      onPortalEnter,
    },
    ref
  ) => {
    const initialSpawnPos = getPixelPositionFromAddress(
      spawnAddress,
      cellSize
    );

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

    const [animationState, setAnimationState] =
      useState<AnimationState>('idle');
    const [frameIndex, setFrameIndex] = useState(0);
    const [facingRight, setFacingRight] = useState(true);
    const [isPunching, setIsPunching] = useState(false);
    const [isProne, setIsProne] = useState(false);
    const [isProneLockedByObstacle, setIsProneLockedByObstacle] =
      useState(false);
    const [health, setHealth] = useState(3);
    const [isInvulnerable, setIsInvulnerable] = useState(false);
    const [flickerState, setFlickerState] = useState(true);
    const [isDead, setIsDead] = useState(false);
    const [isDeathAnimationComplete, setIsDeathAnimationComplete] =
      useState(false);

    const keysPressed = useRef<Record<string, boolean>>({});
    const gameLoopRef = useRef<number | null>(null);
    const animationTickRef = useRef(0);
    const deathAnimationTickRef = useRef(0);
    const lastGridPositionRef = useRef<Array<{ x: number; y: number }>>([]);
    const isProneLockedRef = useRef(false);
    const invulnerabilityEndRef = useRef<number | null>(null);
    const recentlyHitSpikesRef = useRef<Set<string>>(new Set());
    const lastSpikeHitTimeRef = useRef<Record<string, number>>({});
    const currentlyOverlappingButtonsRef = useRef<Set<string>>(new Set());
    const punchCalledRef = useRef(false);

    const characterRef = useRef(character);
    const facingRightRef = useRef(facingRight);
    const isPunchingRef = useRef(isPunching);
    const isProneRef = useRef(isProne);
    const isDeadRef = useRef(isDead);
    const isInvulnerableRef = useRef(isInvulnerable);

    characterRef.current = character;
    facingRightRef.current = facingRight;
    isPunchingRef.current = isPunching;
    isProneRef.current = isProne;
    isDeadRef.current = isDead;
    isInvulnerableRef.current = isInvulnerable;

    useImperativeHandle(
      ref,
      () => ({
        takeDamage: (amount: number) => {
          if (isDeadRef.current || isInvulnerableRef.current) return;

          setHealth((prev) => Math.max(prev - amount, 0));
          setIsInvulnerable(true);
          invulnerabilityEndRef.current = Date.now() + 3000;
          setFlickerState(true);
        },

        teleportTo: (x: number, y: number) => {
          setCharacter((prev) => ({
            ...prev,
            x,
            y,
            velocityX: 0,
            velocityY: 0,
          }));
        },
      }),
      []
    );

    const getOccupiedGridCells = useCallback(
      (
        char: CharacterState,
        currentAnimState: AnimationState
      ): Array<{ x: number; y: number }> => {
        const config =
          HITBOX_CONFIG[currentAnimState as keyof typeof HITBOX_CONFIG];

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
            if (
              x >= 0 &&
              x < gridWidth &&
              y >= 0 &&
              y < gridHeight
            ) {
              cells.push({ x, y });
            }
          }
        }

        return cells;
      },
      [cellSize, gridWidth, gridHeight]
    );

    const checkForOverheadObstacle = useCallback(
      (
        char: CharacterState,
        currentAnimState: AnimationState
      ): boolean => {
        const config =
          HITBOX_CONFIG[currentAnimState as keyof typeof HITBOX_CONFIG];

        const scaledWidth = config.width * scale * 0.95;
        const scaledHeight = config.height * scale * 0.95;
        const scaledOffsetX = config.offsetX * scale * 0.95;
        const scaledOffsetY = config.offsetY * scale * 0.95;

        const testHitbox = {
          x: char.x + scaledOffsetX,
          y: char.y + scaledOffsetY,
          width: scaledWidth,
          height: scaledHeight,
          right: char.x + scaledOffsetX + scaledWidth,
          bottom: char.y + scaledOffsetY + scaledHeight,
        };

        const checkZoneTop = testHitbox.y - cellSize;
        const checkZoneBottom = testHitbox.y + cellSize * 0.5;

        for (const obj of gameObjects) {
          if (obj.isCollectible) continue;

          for (const addr of obj.address) {
            const cleanAddr = getCleanAddress(addr);
            const rowLetter = cleanAddr.charCodeAt(0);

            if (rowLetter >= 80) continue;

            const gridY = (rowLetter - 65) * cellSize;
            const gridX =
              (parseInt(cleanAddr.substring(1), 10) - 1) * cellSize;

            const scaleFactor = cellSize / 32;

            const objHitbox = {
              x: gridX + obj.hitbox.x * scaleFactor,
              y: gridY + obj.hitbox.y * scaleFactor,
              right:
                gridX +
                obj.hitbox.x * scaleFactor +
                obj.hitbox.width * scaleFactor,
              bottom:
                gridY +
                obj.hitbox.y * scaleFactor +
                obj.hitbox.height * scaleFactor,
            };

            const objectIsAboveHead =
              objHitbox.y < checkZoneBottom &&
              objHitbox.bottom > checkZoneTop;

            const xOverlap =
              testHitbox.x < objHitbox.right &&
              testHitbox.right > objHitbox.x;

            if (objectIsAboveHead && xOverlap) return true;
          }
        }

        return false;
      },
      [gameObjects, cellSize, scale]
    );

    const checkSpikeDamage = useCallback(
      (char: CharacterState) => {
        if (isInvulnerableRef.current || isDeadRef.current) return;

        for (const obj of gameObjects) {
          if (obj.id !== 'spikes') continue;

          for (const addr of obj.address) {
            const cleanAddr = getCleanAddress(addr);
            const rowLetter = cleanAddr.charCodeAt(0);
            const gridY = (rowLetter - 65) * cellSize;
            const gridX =
              (parseInt(cleanAddr.substring(1), 10) - 1) * cellSize;

            const centerX = char.x + char.width / 2;
            const centerY = char.y + char.height / 2;

            const colliding =
              centerX >= gridX &&
              centerX <= gridX + cellSize &&
              centerY >= gridY &&
              centerY <= gridY + cellSize;

            if (!colliding) continue;

            const now = Date.now();
            const lastHit =
              lastSpikeHitTimeRef.current[addr] ?? 0;

            if (now - lastHit >= 3000) {
              const damageAmount = obj.damageAmount ?? 1;

              setHealth((prev) =>
                Math.max(prev - damageAmount, 0)
              );

              lastSpikeHitTimeRef.current[addr] = now;
              onSpikeHit?.(addr);

              setIsInvulnerable(true);
              invulnerabilityEndRef.current = now + 3000;
              setFlickerState(true);
            }

            recentlyHitSpikesRef.current.add(addr);

            window.setTimeout(() => {
              recentlyHitSpikesRef.current.delete(addr);
            }, 300);
          }
        }
      },
      [gameObjects, cellSize, onSpikeHit]
    );

    const checkButtonPress = useCallback(
      (char: CharacterState) => {
        const charHitbox = {
          x: char.x,
          y: char.y,
          right: char.x + char.width,
          bottom: char.y + char.height,
        };

        const overlapping = new Set<string>();

        for (const obj of gameObjects) {
          if (obj.type !== 'input') continue;

          let collidingButton = false;

          for (const addr of obj.address) {
            const cleanAddr = getCleanAddress(addr);
            const rowLetter = cleanAddr.charCodeAt(0);
            const gridY = (rowLetter - 65) * cellSize;
            const gridX =
              (parseInt(cleanAddr.substring(1), 10) - 1) *
              cellSize;

            const factor = cellSize / 32;

            const buttonHitbox = {
              x: gridX + obj.hitbox.x * factor,
              y: gridY + obj.hitbox.y * factor,
              right:
                gridX +
                obj.hitbox.x * factor +
                obj.hitbox.width * factor,
              bottom:
                gridY +
                obj.hitbox.y * factor +
                obj.hitbox.height * factor,
            };

            if (
              charHitbox.x < buttonHitbox.right &&
              charHitbox.right > buttonHitbox.x &&
              charHitbox.y < buttonHitbox.bottom &&
              charHitbox.bottom > buttonHitbox.y
            ) {
              collidingButton = true;
            }
          }

          if (collidingButton) {
            overlapping.add(obj.id);

            if (!currentlyOverlappingButtonsRef.current.has(obj.id)) {
              onButtonPress?.(obj.id);
            }
          }
        }

        currentlyOverlappingButtonsRef.current = overlapping;
      },
      [gameObjects, cellSize, onButtonPress]
    );

    const checkCollectibleItems = useCallback(
      (char: CharacterState) => {
        let state: AnimationState = 'idle';

        if (isPunchingRef.current) state = 'punching';
        else if (isProneRef.current) state = 'prone';
        else if (char.isJumping || (!char.onGround && char.velocityY !== 0))
          state = 'jumping';
        else if (char.velocityX !== 0) state = 'running';

        const base = HITBOX_CONFIG[state];
        const factor = scale * 0.95;

        const hitbox = {
          x: char.x + base.offsetX * factor,
          y: char.y + base.offsetY * factor,
          right: char.x + base.offsetX * factor + base.width * factor,
          bottom:
            char.y + base.offsetY * factor + base.height * factor,
        };

        for (const obj of gameObjects) {
          if (!obj.isCollectible) continue;

          for (const addr of obj.address) {
            const cleanAddr = getCleanAddress(addr);
            const rowLetter = cleanAddr.charCodeAt(0);
            const gridY = (rowLetter - 65) * cellSize;
            const gridX =
              (parseInt(cleanAddr.substring(1), 10) - 1) *
              cellSize;

            const objectFactor = cellSize / 32;

            const itemHitbox = {
              x: gridX + obj.hitbox.x * objectFactor,
              y: gridY + obj.hitbox.y * objectFactor,
              right:
                gridX +
                obj.hitbox.x * objectFactor +
                obj.hitbox.width * objectFactor,
              bottom:
                gridY +
                obj.hitbox.y * objectFactor +
                obj.hitbox.height * objectFactor,
            };

            if (
              hitbox.x < itemHitbox.right &&
              hitbox.right > itemHitbox.x &&
              hitbox.y < itemHitbox.bottom &&
              hitbox.bottom > itemHitbox.y
            ) {
              onCollectItem?.(addr);
            }
          }
        }
      },
      [gameObjects, cellSize, onCollectItem, scale]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (isDeadRef.current) return;

        const key = e.key.toLowerCase();
        keysPressed.current[key] = true;

        const current = characterRef.current;

        if (key === 'w' && !isProneRef.current) {
          setCharacter((prev) => jump(prev, scale));
        }

        if (
          key === ' ' &&
          current.onGround &&
          current.velocityX === 0 &&
          !keysPressed.current.a &&
          !keysPressed.current.d &&
          !isProneRef.current
        ) {
          setIsPunching(true);
          e.preventDefault();
        }

        if (key === 's') {
          setIsProne(true);
        }

        if (key === 'e') {
          onPortalEnter?.(current.x, current.y);
          e.preventDefault();
        }
      },
      [scale, onPortalEnter]
    );

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;

      if (key === 's' && !isProneLockedRef.current) {
        setIsProne(false);
      }
    }, []);

    useEffect(() => {
      isProneLockedRef.current = isProneLockedByObstacle;
    }, [isProneLockedByObstacle]);

    useEffect(() => {
      if (!isInvulnerable || isDead) return;

      const flickerInterval = window.setInterval(() => {
        setFlickerState((prev) => !prev);
      }, 200);

      const immunityInterval = window.setInterval(() => {
        if (
          invulnerabilityEndRef.current &&
          Date.now() >= invulnerabilityEndRef.current
        ) {
          setIsInvulnerable(false);
          setFlickerState(true);
          invulnerabilityEndRef.current = null;
        }
      }, 50);

      return () => {
        clearInterval(flickerInterval);
        clearInterval(immunityInterval);
      };
    }, [isInvulnerable, isDead]);

    useEffect(() => {
      onHealthChange?.(health);

      if (health <= 0 && !isDeadRef.current) {
        setIsDead(true);
        setFrameIndex(0);
        onDeath?.();
      }
    }, [health, onHealthChange, onDeath]);

    useEffect(() => {
      if (!isProne) {
        lastGridPositionRef.current = getOccupiedGridCells(
          character,
          'idle'
        );
        return;
      }

      const cells = getOccupiedGridCells(character, 'idle');

      const changed =
        cells.length !== lastGridPositionRef.current.length ||
        cells.some(
          (cell, index) =>
            cell.x !== lastGridPositionRef.current[index]?.x ||
            cell.y !== lastGridPositionRef.current[index]?.y
        );

      if (!changed) return;

      lastGridPositionRef.current = cells;

      const obstacle = checkForOverheadObstacle(character, 'idle');
      const holdingProne = keysPressed.current.s;

      if (isProneLockedByObstacle && !obstacle) {
        setIsProneLockedByObstacle(false);

        if (!holdingProne) {
          setIsProne(false);
        }
      } else if (!isProneLockedByObstacle && obstacle) {
        setIsProneLockedByObstacle(true);
      }
    }, [
      character,
      isProne,
      isProneLockedByObstacle,
      checkForOverheadObstacle,
      getOccupiedGridCells,
    ]);

    useEffect(() => {
      setCharacter((prev) => ({
        ...prev,
        width: CHARACTER_WIDTH * scale * 0.95,
        height: CHARACTER_HEIGHT * scale * 0.95,
      }));
    }, [scale]);

    useEffect(() => {
      const position = getPixelPositionFromAddress(
        spawnAddress,
        cellSize
      );

      setCharacter((prev) => ({
        ...prev,
        x: position.x,
        y: position.y,
      }));
    }, [cellSize, spawnAddress]);

    useEffect(() => {
      const gameLoop = () => {
        const current = characterRef.current;

        if (!isDeadRef.current) {
          let next = { ...current };

          const left = keysPressed.current.a;
          const right = keysPressed.current.d;

          if (left && right) {
            next = stopMoving(next);
          } else if (left) {
            next = isProneRef.current
              ? moveLeft(next, scale * 0.5)
              : moveLeft(next, scale);

            if (facingRightRef.current) {
              setFacingRight(false);
            }
          } else if (right) {
            next = isProneRef.current
              ? moveRight(next, scale * 0.5)
              : moveRight(next, scale);

            if (!facingRightRef.current) {
              setFacingRight(true);
            }
          } else {
            next = stopMoving(next);
          }

          let physicsState: AnimationState = 'idle';

          if (isPunchingRef.current) physicsState = 'punching';
          else if (isProneRef.current) physicsState = 'prone';
          else if (
            current.isJumping ||
            (current.velocityY !== 0 && !current.onGround)
          ) {
            physicsState = 'jumping';
          } else if (current.velocityX !== 0) {
            physicsState = 'running';
          }

          const base = HITBOX_CONFIG[physicsState];
          const factor = scale * 0.95;

          next = applyPhysics(
            next,
            gameObjects,
            cellSize,
            gridWidth,
            gridHeight,
            {
              width: base.width * factor,
              height: base.height * factor,
              offsetX: base.offsetX * factor,
              offsetY: base.offsetY * factor,
            },
            scale,
            openedDoors
          );

          if (next.onGround && current.isJumping) {
            next.isJumping = false;
          }

          characterRef.current = next;
          setCharacter(next);
          checkSpikeDamage(next);
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };

      gameLoopRef.current = requestAnimationFrame(gameLoop);

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        if (gameLoopRef.current !== null) {
          cancelAnimationFrame(gameLoopRef.current);
        }

        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [
      gameObjects,
      cellSize,
      gridWidth,
      gridHeight,
      scale,
      openedDoors,
      checkSpikeDamage,
      handleKeyDown,
      handleKeyUp,
    ]);

    useEffect(() => {
      checkButtonPress(character);
      checkCollectibleItems(character);
    }, [character, checkButtonPress, checkCollectibleItems]);

    useEffect(() => {
      onPositionChange?.(character.x, character.y);
    }, [character.x, character.y, onPositionChange]);

    useEffect(() => {
      if (!isPunching) {
        punchCalledRef.current = false;
        return;
      }

      if (!onPunch || punchCalledRef.current) return;

      const punchRange = character.width * 0.45;
      const punchHeight = character.height * 0.7;
      const punchY = character.y + character.height * 0.15;

      const punchX = facingRight
        ? character.x + character.width * 0.8
        : character.x - punchRange + character.width * 0.2;

      onPunch(
        punchX,
        punchY,
        punchRange,
        punchHeight
      );

      punchCalledRef.current = true;
    }, [isPunching, character, facingRight, onPunch]);

    useEffect(() => {
      if (isDead) {
        if (isDeathAnimationComplete) return;

        deathAnimationTickRef.current++;

        if (deathAnimationTickRef.current >= DEATH_ANIMATION_SPEED) {
          deathAnimationTickRef.current = 0;

          setFrameIndex((prev) => {
            const next = prev + 1;

            if (next >= DEATH_FRAMES.length) {
              setIsDeathAnimationComplete(true);
              return DEATH_FRAMES.length - 1;
            }

            return next;
          });
        }

        return;
      }

      let newAnimation: AnimationState = 'idle';

      if (isPunching) newAnimation = 'punching';
      else if (isProne) newAnimation = 'prone';
      else if (
        character.isJumping ||
        (character.velocityY !== 0 && !character.onGround)
      ) {
        newAnimation = 'jumping';
      } else if (character.velocityX !== 0) {
        newAnimation = 'running';
      }

      if (newAnimation !== animationState) {
        setAnimationState(newAnimation);
        setFrameIndex(newAnimation === 'jumping' ? 1 : 0);
        animationTickRef.current = 0;
      }

      const interval = window.setInterval(() => {
        if (
          newAnimation === 'prone' &&
          character.velocityX === 0
        ) {
          setFrameIndex(0);
          animationTickRef.current = 0;
          return;
        }

        animationTickRef.current++;

        const speed = ANIMATION_SPEED[newAnimation] || 10;

        if (animationTickRef.current < speed) return;

        animationTickRef.current = 0;

        setFrameIndex((prev) => {
          const framesForAnimation =
            ANIMATION_FRAMES[newAnimation] || [];

          const maxFrames = framesForAnimation.length || 1;

          if (newAnimation === 'jumping') {
            if (character.onGround) return 0;
            return 1;
          }

          const next = (prev + 1) % maxFrames;

          if (newAnimation === 'punching' && next === 0) {
            setIsPunching(false);
          }

          return next;
        });
      }, 16);

      return () => clearInterval(interval);
    }, [
      character,
      animationState,
      isPunching,
      isProne,
      isDead,
      isDeathAnimationComplete,
    ]);

    const frames = isDead
      ? DEATH_FRAMES
      : ANIMATION_FRAMES[animationState];

    const currentFrame =
      frames[Math.min(frameIndex, frames.length - 1)] || frames[0];

    const isProneState = animationState === 'prone';
    const proneScale = isProneState ? 1.25 : 1;

    return (
      <>
        <img
          src={currentFrame}
          alt="character"
          className="absolute"
          style={{
            width: `${character.width * proneScale}px`,
            height: `${character.height * proneScale}px`,
            objectFit: 'contain',
            transform: `translate(${
              character.x -
              (character.width * (proneScale - 1)) / 2
            }px, ${
              character.y -
              (character.height * (proneScale - 1)) / 2
            }px) ${facingRight ? 'scaleX(1)' : 'scaleX(-1)'}`,
            pointerEvents: 'none',
            opacity:
              isInvulnerable && !flickerState ? 0 : 1,
            transition: 'opacity 0.05s',
            willChange: 'transform',
          }}
        />

        {showHitbox && (
          <svg
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <rect
              x={
                character.x +
                HITBOX_CONFIG[animationState].offsetX *
                  scale *
                  0.95
              }
              y={
                character.y +
                HITBOX_CONFIG[animationState].offsetY *
                  scale *
                  0.95
              }
              width={
                HITBOX_CONFIG[animationState].width *
                scale *
                0.95
              }
              height={
                HITBOX_CONFIG[animationState].height *
                scale *
                0.95
              }
              fill="none"
              stroke="#0000FF"
              strokeWidth="2"
              opacity="0.7"
            />
          </svg>
        )}

        {showHitbox && isPunching && (
          <svg
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <rect
              x={
                facingRight
                  ? character.x + character.width * 0.8
                  : character.x -
                    character.width * 0.45 +
                    character.width * 0.2
              }
              y={character.y + character.height * 0.15}
              width={character.width * 0.45}
              height={character.height * 0.7}
              fill="rgba(255, 0, 0, 0.3)"
              stroke="#FF0000"
              strokeWidth="2"
            />
          </svg>
        )}
      </>
    );
  }
);

Character.displayName = 'Character';

export default Character;