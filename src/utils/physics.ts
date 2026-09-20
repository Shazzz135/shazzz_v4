import type { GameObject } from '../types/GameObject';
import type { CharacterHitbox } from '../constants/hitboxes';
import { getCleanAddress } from './addressParser';

/**
 * Physics engine for character movement, gravity, and collision detection
 */

export interface CharacterState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  isJumping: boolean;
  isFalling: boolean;
  onGround: boolean;
}

const GRAVITY = 0.6;
const JUMP_POWER = 12;
const MOVE_SPEED = 4;
const MAX_VELOCITY_Y = 8;

export const getCharacterHitbox = (
  char: CharacterState,
  hitboxConfig?: CharacterHitbox
) => {
  if (!hitboxConfig) {
    return {
      x: char.x,
      y: char.y,
      width: char.width,
      height: char.height,
      right: char.x + char.width,
      bottom: char.y + char.height,
    };
  }

  return {
    x: char.x + hitboxConfig.offsetX,
    y: char.y + hitboxConfig.offsetY,
    width: hitboxConfig.width,
    height: hitboxConfig.height,
    right:
      char.x +
      hitboxConfig.offsetX +
      hitboxConfig.width,
    bottom:
      char.y +
      hitboxConfig.offsetY +
      hitboxConfig.height,
  };
};

export const getObjectHitbox = (
  cellSize: number,
  address: string,
  gameObjectHitbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
) => {
  const rowLetter = address.charCodeAt(0);
  const colNum = parseInt(address.substring(1), 10);

  const gridX = (colNum - 1) * cellSize;
  const gridY = (rowLetter - 65) * cellSize;

  if (gameObjectHitbox) {
    const HITBOX_BASE_SIZE = 32;
    const scaleFactor = cellSize / HITBOX_BASE_SIZE;

    const scaledWidth =
      gameObjectHitbox.width * scaleFactor;

    const scaledHeight =
      gameObjectHitbox.height * scaleFactor;

    const scaledOffsetX =
      gameObjectHitbox.x * scaleFactor;

    const scaledOffsetY =
      gameObjectHitbox.y * scaleFactor;

    const hitboxX =
      gridX + scaledOffsetX;

    const hitboxY =
      gridY + scaledOffsetY;

    return {
      x: hitboxX,
      y: hitboxY,
      width: scaledWidth,
      height: scaledHeight,
      right: hitboxX + scaledWidth,
      bottom: hitboxY + scaledHeight,
    };
  }

  return {
    x: gridX,
    y: gridY,
    width: cellSize,
    height: cellSize,
    right: gridX + cellSize,
    bottom: gridY + cellSize,
  };
};

export const checkHitboxCollision = (
  box1: ReturnType<typeof getCharacterHitbox>,
  box2: ReturnType<typeof getObjectHitbox>
) => {
  return (
    box1.x < box2.right &&
    box1.right > box2.x &&
    box1.y < box2.bottom &&
    box1.bottom > box2.y
  );
};

export const checkIfOnGround = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  hitboxConfig?: CharacterHitbox,
  openedDoors: Set<string> = new Set()
): boolean => {
  const charHitbox = getCharacterHitbox(
    character,
    hitboxConfig
  );

  const gridHeight = 16 * cellSize;

  if (
    character.y + character.height >= gridHeight
  ) {
    return true;
  }

  const scaledTolerance = cellSize * 0.47;

  for (const obj of gameObjects) {
    if (
      obj.id === 'spikes' ||
      obj.isCollectible ||
      obj.type === 'input' ||
      obj.type === 'text'
    ) {
      continue;
    }

    if (
      obj.type === 'output' &&
      openedDoors.has(obj.id)
    ) {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr = getCleanAddress(addr);

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      const isAbove =
        charHitbox.bottom <=
          objHitbox.y + scaledTolerance &&
        charHitbox.bottom >
          objHitbox.y -
            scaledTolerance * 0.67;

      const isOverlappingX =
        charHitbox.x < objHitbox.right &&
        charHitbox.right > objHitbox.x;

      const isFalling =
        character.velocityY >= 0;

      if (
        isAbove &&
        isOverlappingX &&
        isFalling
      ) {
        return true;
      }
    }
  }

  return false;
};

export const snapCharacterToSurface = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  gridHeight: number,
  hitboxConfig?: CharacterHitbox,
  openedDoors: Set<string> = new Set()
): CharacterState => {
  const newChar = { ...character };

  const charHitbox = getCharacterHitbox(
    newChar,
    hitboxConfig
  );

  const gridPixelHeight =
    gridHeight * cellSize;

  if (
    newChar.y + newChar.height >=
    gridPixelHeight
  ) {
    newChar.y =
      gridPixelHeight - newChar.height;

    return newChar;
  }

  const scaledTolerance = cellSize * 0.47;

  let highestSurfaceY = gridPixelHeight;
  let shouldSnap = false;

  for (const obj of gameObjects) {
    if (
      obj.id === 'spikes' ||
      obj.isCollectible ||
      obj.type === 'input' ||
      obj.type === 'text'
    ) {
      continue;
    }

    if (
      obj.type === 'output' &&
      openedDoors.has(obj.id)
    ) {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr =
        getCleanAddress(addr);

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      const isOverlappingX =
        charHitbox.x < objHitbox.right &&
        charHitbox.right > objHitbox.x;

      const isCloseToObject =
        charHitbox.bottom >=
          objHitbox.y - scaledTolerance &&
        charHitbox.bottom <=
          objHitbox.y +
            (hitboxConfig?.height || 44) +
            scaledTolerance;

      const isFalling =
        character.velocityY >= 0;

      if (
        isOverlappingX &&
        isCloseToObject &&
        isFalling
      ) {
        shouldSnap = true;

        if (
          objHitbox.y < highestSurfaceY
        ) {
          highestSurfaceY = objHitbox.y;
        }
      }
    }
  }

  if (
    shouldSnap &&
    highestSurfaceY < gridPixelHeight
  ) {
    if (hitboxConfig) {
      newChar.y =
        highestSurfaceY -
        hitboxConfig.offsetY -
        hitboxConfig.height;
    } else {
      newChar.y =
        highestSurfaceY - newChar.height;
    }
  }

  return newChar;
};

export const checkSideCollision = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  hitboxConfig?: CharacterHitbox,
  openedDoors: Set<string> = new Set()
): boolean => {
  const testChar = { ...character };

  testChar.x += character.velocityX;

  const testHitbox = getCharacterHitbox(
    testChar,
    hitboxConfig
  );

  for (const obj of gameObjects) {
    if (
      obj.id === 'spikes' ||
      obj.isCollectible ||
      obj.type === 'input' ||
      obj.type === 'text'
    ) {
      continue;
    }

    if (
      obj.type === 'output' &&
      openedDoors.has(obj.id)
    ) {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr =
        getCleanAddress(addr);

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      if (
        checkHitboxCollision(
          testHitbox,
          objHitbox
        )
      ) {
        return true;
      }
    }
  }

  return false;
};

export const checkHeadCollision = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  hitboxConfig?: CharacterHitbox,
  openedDoors: Set<string> = new Set()
): boolean => {
  const charHitbox = getCharacterHitbox(
    character,
    hitboxConfig
  );

  const headCollisionTolerance =
    cellSize * 0.16;

  for (const obj of gameObjects) {
    if (
      obj.id === 'spikes' ||
      obj.isCollectible ||
      obj.type === 'input' ||
      obj.type === 'text'
    ) {
      continue;
    }

    if (
      obj.type === 'output' &&
      openedDoors.has(obj.id)
    ) {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr =
        getCleanAddress(addr);

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      const isOverlappingX =
        charHitbox.x < objHitbox.right &&
        charHitbox.right > objHitbox.x;

      const headTouchesObject =
        charHitbox.y < objHitbox.bottom &&
        charHitbox.y +
          headCollisionTolerance >
          objHitbox.y;

      const isMovingUp =
        character.velocityY < 0;

      if (
        isOverlappingX &&
        headTouchesObject &&
        isMovingUp
      ) {
        return true;
      }
    }
  }

  return false;
};

export const canStandUp = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  standingConfig: CharacterHitbox
): boolean => {
  const testChar = { ...character };

  const testHitbox = getCharacterHitbox(
    testChar,
    standingConfig
  );

  const headTop = testHitbox.y;
  const checkZoneTop =
    headTop - cellSize;

  const clearanceAmount =
    cellSize * 0.5;

  const checkZoneBottom =
    headTop + clearanceAmount;

  for (const obj of gameObjects) {
    if (obj.id === 'spikes') {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr =
        getCleanAddress(addr);

      const rowLetter =
        cleanAddr.charCodeAt(0);

      if (rowLetter >= 80) {
        continue;
      }

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      const objectIsAboveHead =
        objHitbox.y < checkZoneBottom &&
        objHitbox.bottom > checkZoneTop;

      const xOverlap =
        testHitbox.x < objHitbox.right &&
        testHitbox.right > objHitbox.x;

      if (
        objectIsAboveHead &&
        xOverlap
      ) {
        return false;
      }
    }
  }

  return true;
};

export const applyPhysics = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  gridWidth: number,
  gridHeight: number,
  hitboxConfig?: CharacterHitbox,
  scale: number = 1,
  openedDoors: Set<string> = new Set()
): CharacterState => {
  let newChar = { ...character };

  const scaledGravity =
    GRAVITY * scale;

  const scaledMaxVelocity =
    MAX_VELOCITY_Y * scale;

  if (!newChar.onGround) {
    newChar.velocityY += scaledGravity;

    if (
      newChar.velocityY >
      scaledMaxVelocity
    ) {
      newChar.velocityY =
        scaledMaxVelocity;
    }
  } else {
    newChar.velocityY = 0;
  }

  newChar.y += newChar.velocityY;

  if (
    checkHeadCollision(
      newChar,
      gameObjects,
      cellSize,
      hitboxConfig,
      openedDoors
    )
  ) {
    newChar.velocityY = 0;
    newChar.isJumping = false;
    newChar.y = character.y;
  }

  let sidewaysCollision = false;

  if (newChar.velocityX < 0) {
    if (
      checkSideCollision(
        newChar,
        gameObjects,
        cellSize,
        hitboxConfig,
        openedDoors
      )
    ) {
      sidewaysCollision = true;
    }
  } else if (newChar.velocityX > 0) {
    if (
      checkSideCollision(
        newChar,
        gameObjects,
        cellSize,
        hitboxConfig,
        openedDoors
      )
    ) {
      sidewaysCollision = true;
    }
  }

  if (!sidewaysCollision) {
    newChar.x += newChar.velocityX;
  } else {
    newChar.velocityX = 0;
  }

  const charHitbox = getCharacterHitbox(
    newChar,
    hitboxConfig
  );

  for (const obj of gameObjects) {
    if (
      obj.id === 'spikes' ||
      obj.isCollectible ||
      obj.type === 'input' ||
      obj.type === 'text'
    ) {
      continue;
    }

    if (
      obj.type === 'output' &&
      openedDoors.has(obj.id)
    ) {
      continue;
    }

    for (const addr of obj.address) {
      const cleanAddr =
        getCleanAddress(addr);

      const objHitbox = getObjectHitbox(
        cellSize,
        cleanAddr,
        obj.hitbox
      );

      if (
        checkHitboxCollision(
          charHitbox,
          objHitbox
        )
      ) {
        const overlapLeft =
          charHitbox.right -
          objHitbox.x;

        const overlapRight =
          objHitbox.right -
          charHitbox.x;

        const overlapTop =
          charHitbox.bottom -
          objHitbox.y;

        const overlapBottom =
          objHitbox.bottom -
          charHitbox.y;

        const minHorizontalOverlap =
          Math.min(
            overlapLeft,
            overlapRight
          );

        const minVerticalOverlap =
          Math.min(
            overlapTop,
            overlapBottom
          );

        if (
          minHorizontalOverlap <
          minVerticalOverlap
        ) {
          if (
            overlapLeft <
            overlapRight
          ) {
            const offsetX =
              hitboxConfig?.offsetX || 0;

            const width =
              hitboxConfig?.width ||
              newChar.width;

            newChar.x =
              objHitbox.x -
              offsetX -
              width;
          } else {
            const offsetX =
              hitboxConfig?.offsetX || 0;

            newChar.x =
              objHitbox.right -
              offsetX;
          }
        }
      }
    }
  }

  newChar.onGround =
    checkIfOnGround(
      newChar,
      gameObjects,
      cellSize,
      hitboxConfig,
      openedDoors
    );

  if (newChar.onGround) {
    newChar =
      snapCharacterToSurface(
        newChar,
        gameObjects,
        cellSize,
        gridHeight,
        hitboxConfig,
        openedDoors
      );
  }

  const gridPixelWidth =
    gridWidth * cellSize;

  const gridPixelHeight =
    gridHeight * cellSize;

  newChar.x = Math.max(
    0,
    Math.min(
      newChar.x,
      gridPixelWidth - newChar.width
    )
  );

  newChar.y = Math.max(
    0,
    Math.min(
      newChar.y,
      gridPixelHeight - newChar.height
    )
  );

  return newChar;
};

export const jump = (
  character: CharacterState,
  scale: number = 1
): CharacterState => {
  if (
    character.onGround &&
    !character.isJumping
  ) {
    return {
      ...character,
      velocityY: -JUMP_POWER * scale,
      isJumping: true,
      onGround: false,
    };
  }

  return character;
};

export const moveLeft = (
  character: CharacterState,
  scale: number = 1
): CharacterState => {
  return {
    ...character,
    velocityX: -MOVE_SPEED * scale,
  };
};

export const moveRight = (
  character: CharacterState,
  scale: number = 1
): CharacterState => {
  return {
    ...character,
    velocityX: MOVE_SPEED * scale,
  };
};

export const stopMoving = (
  character: CharacterState
): CharacterState => {
  return {
    ...character,
    velocityX: 0,
  };
};