import type { GameObject } from '../types/GameObject';
import type { CharacterHitbox } from '../constants/hitboxes';

/**
 * Physics engine for character movement, gravity, and collision detection
 */

// ========== TYPES ==========
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

// ========== CONSTANTS ==========
const GRAVITY = 0.6;
const JUMP_POWER = 12;
const MOVE_SPEED = 4; // Constant horizontal velocity
const MAX_VELOCITY_Y = 8;

// ========== HITBOX CALCULATIONS ==========
export const getCharacterHitbox = (char: CharacterState, hitboxConfig?: CharacterHitbox) => {
  if (!hitboxConfig) {
    // Fallback to full character bounds if no config
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
    right: char.x + hitboxConfig.offsetX + hitboxConfig.width,
    bottom: char.y + hitboxConfig.offsetY + hitboxConfig.height,
  };
};

export const getObjectHitbox = (cellSize: number, address: string, gameObjectHitbox?: { x: number; y: number; width: number; height: number }) => {
  const rowLetter = address.charCodeAt(0);
  const colNum = parseInt(address.substring(1));
  const gridX = (colNum - 1) * cellSize;
  const gridY = (rowLetter - 65) * cellSize;

  // Use the actual object hitbox if provided, otherwise default to full cell
  if (gameObjectHitbox) {
    // Scale hitbox dimensions to match current cellSize
    // Hitboxes are defined at base 32px, so scale by cellSize/32
    const HITBOX_BASE_SIZE = 32; // Base size hitboxes are defined at
    const scaleFactor = cellSize / HITBOX_BASE_SIZE;
    
    const scaledWidth = gameObjectHitbox.width * scaleFactor;
    const scaledHeight = gameObjectHitbox.height * scaleFactor;
    const scaledOffsetX = gameObjectHitbox.x * scaleFactor;
    const scaledOffsetY = gameObjectHitbox.y * scaleFactor;
    
    const hitboxX = gridX + scaledOffsetX;
    const hitboxY = gridY + scaledOffsetY;
    
    return {
      x: hitboxX,
      y: hitboxY,
      width: scaledWidth,
      height: scaledHeight,
      right: hitboxX + scaledWidth,
      bottom: hitboxY + scaledHeight,
    };
  }

  // Fallback to full cell size if no hitbox provided
  return {
    x: gridX,
    y: gridY,
    width: cellSize,
    height: cellSize,
    right: gridX + cellSize,
    bottom: gridY + cellSize,
  };
};

// ========== COLLISION DETECTION ==========
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
  hitboxConfig?: CharacterHitbox
): boolean => {
  const charHitbox = getCharacterHitbox(character, hitboxConfig);
  
  // Check if character is at bottom of grid
  const gridHeight = 16 * cellSize;
  if (character.y + character.height >= gridHeight) {
    return true;
  }

  // Scale tolerances based on cellSize to work at any screen resolution
  const scaledTolerance = cellSize * 0.47; // ~15px at base 32px cellSize

  // Check collision with all game objects
  for (const obj of gameObjects) {
    // Skip collectible objects (no collision)
    if (obj.isCollectible) continue;
    
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

      // Check if character is standing on object (forgiving threshold for hitbox transitions)
      // Scaled to work at any screen resolution
      const isAbove = charHitbox.bottom <= objHitbox.y + scaledTolerance && charHitbox.bottom > objHitbox.y - (scaledTolerance * 0.67);
      const isOverlappingX = charHitbox.x < objHitbox.right && charHitbox.right > objHitbox.x;
      const isFalling = character.velocityY >= 0;

      if (isAbove && isOverlappingX && isFalling) {
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
  hitboxConfig?: CharacterHitbox
): CharacterState => {
  const newChar = { ...character };
  const charHitbox = getCharacterHitbox(newChar, hitboxConfig);
  const gridPixelHeight = gridHeight * cellSize;

  // Check if at bottom of grid
  if (newChar.y + newChar.height >= gridPixelHeight) {
    newChar.y = gridPixelHeight - newChar.height;
    return newChar;
  }

  // Scale tolerances based on cellSize - 15px at base 32px cellSize
  const scaledTolerance = cellSize * 0.47;

  // Find the highest object surface the character should be standing on
  let highestSurfaceY = gridPixelHeight;
  let shouldSnap = false;

  for (const obj of gameObjects) {
    // Skip collectible objects (no collision)
    if (obj.isCollectible) continue;
    
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

      // Check if character is over this object (with more lenient X overlap)
      const isOverlappingX = charHitbox.x < objHitbox.right && charHitbox.right > objHitbox.x;
      // Check if character is close to object surface (with tolerance for hitbox height changes)
      // Scaled to work at any screen resolution
      const isCloseToObject = charHitbox.bottom >= objHitbox.y - scaledTolerance && charHitbox.bottom <= objHitbox.y + (hitboxConfig?.height || 44) + scaledTolerance;
      const isFalling = character.velocityY >= 0;

      if (isOverlappingX && isCloseToObject && isFalling) {
        shouldSnap = true;
        // Character should be standing on this object
        if (objHitbox.y < highestSurfaceY) {
          highestSurfaceY = objHitbox.y;
        }
      }
    }
  }

  // Snap character precisely to the highest surface if landing
  if (shouldSnap && highestSurfaceY < gridPixelHeight) {
    // Snap based on hitbox bottom, not character height
    // hitbox.bottom = char.y + hitboxConfig.offsetY + hitboxConfig.height
    // We want: hitbox.bottom = highestSurfaceY
    // So: char.y = highestSurfaceY - hitboxConfig.offsetY - hitboxConfig.height
    if (hitboxConfig) {
      newChar.y = highestSurfaceY - hitboxConfig.offsetY - hitboxConfig.height;
    } else {
      newChar.y = highestSurfaceY - newChar.height;
    }
  }

  return newChar;
};

export const checkSideCollision = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  hitboxConfig?: CharacterHitbox
): boolean => {
  const testChar = { ...character };
  
  // Test the character's position after moving using actual velocity
  // Penetration resolution will handle any minor clipping that occurs
  testChar.x += character.velocityX;

  const testHitbox = getCharacterHitbox(testChar, hitboxConfig);

  // Check collision with all game objects
  for (const obj of gameObjects) {
    // Skip collectible objects (no collision)
    if (obj.isCollectible) continue;
    
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

      // Check if character body overlaps with object
      if (checkHitboxCollision(testHitbox, objHitbox)) {
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
  hitboxConfig?: CharacterHitbox
): boolean => {
  const charHitbox = getCharacterHitbox(character, hitboxConfig);
  
  // Scale tolerance for head collision - ensures smooth jumping at any resolution
  const headCollisionTolerance = cellSize * 0.16; // ~5px at base 32px cellSize

  for (const obj of gameObjects) {
    // Skip collectible objects (no collision)
    if (obj.isCollectible) continue;
    
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

      // Check if character's top (head) overlaps with object bottom
      const isOverlappingX = charHitbox.x < objHitbox.right && charHitbox.right > objHitbox.x;
      const headTouchesObject = charHitbox.y < objHitbox.bottom && charHitbox.y + headCollisionTolerance > objHitbox.y;
      const isMovingUp = character.velocityY < 0;

      if (isOverlappingX && headTouchesObject && isMovingUp) {
        return true;
      }
    }
  }

  return false;
};

// Check if character can stand up without collision at current position
export const canStandUp = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  standingConfig: CharacterHitbox,
  scale: number = 1
): boolean => {
  // Test what the standing hitbox would be at current character position
  const testChar = { ...character };
  const testHitbox = getCharacterHitbox(testChar, standingConfig);
  
  // Only check for collisions in a zone one grid row ABOVE the character's head
  const headTop = testHitbox.y;
  const checkZoneTop = headTop - cellSize; // One row above
  // Scale the clearance to match screen size - 50% of cell height
  const clearanceAmount = cellSize * 0.50;
  const checkZoneBottom = headTop + clearanceAmount;
  
  // Check for collisions with game objects
  for (const obj of gameObjects) {
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const rowLetter = cleanAddr.charCodeAt(0); // A=65, P=80, O=79, N=78, etc.
      
      // Skip the P layer (ground) and below - only check above
      if (rowLetter >= 80) {
        continue;
      }
      
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);
      
      // Only block standing if object is in the zone above the character's head
      const objectIsAboveHead = objHitbox.y < checkZoneBottom && objHitbox.bottom > checkZoneTop;
      
      // Check X overlap with standing hitbox
      const xOverlap = testHitbox.x < objHitbox.right && testHitbox.right > objHitbox.x;
      
      if (objectIsAboveHead && xOverlap) {
        console.log('canStandUp: Blocked by object above head');
        return false; // Object above head blocks standing
      }
    }
  }
  
  return true; // Safe to stand up
};

export const applyPhysics = (
  character: CharacterState,
  gameObjects: GameObject[],
  cellSize: number,
  gridWidth: number,
  gridHeight: number,
  hitboxConfig?: CharacterHitbox,
  scale: number = 1
): CharacterState => {
  let newChar = { ...character };

  // Apply gravity (scaled)
  const scaledGravity = GRAVITY * scale;
  const scaledMaxVelocity = MAX_VELOCITY_Y * scale;
  
  if (!newChar.onGround) {
    newChar.velocityY += scaledGravity;
    if (newChar.velocityY > scaledMaxVelocity) {
      newChar.velocityY = scaledMaxVelocity;
    }
  } else {
    newChar.velocityY = 0;
  }

  // ===== VERTICAL MOVEMENT =====
  // Apply vertical velocity
  newChar.y += newChar.velocityY;

  // Check for head collision (hitting object while moving up)
  // Only kill Y velocity, preserve X momentum
  if (checkHeadCollision(newChar, gameObjects, cellSize, hitboxConfig)) {
    newChar.velocityY = 0; // Stop upward movement ONLY
    newChar.isJumping = false;
    // Revert Y position to stop at the collision surface
    newChar.y = character.y;
  }

  // ===== HORIZONTAL MOVEMENT =====
  // Check for side collision BEFORE applying horizontal velocity
  let sidewaysCollision = false;
  if (newChar.velocityX < 0) {
    // Moving left
    if (checkSideCollision(newChar, gameObjects, cellSize, hitboxConfig)) {
      sidewaysCollision = true;
    }
  } else if (newChar.velocityX > 0) {
    // Moving right
    if (checkSideCollision(newChar, gameObjects, cellSize, hitboxConfig)) {
      sidewaysCollision = true;
    }
  }

  // Apply horizontal velocity only if no collision
  if (!sidewaysCollision) {
    newChar.x += newChar.velocityX;
  } else {
    // Kill X velocity ONLY, preserve any Y momentum
    newChar.velocityX = 0;
  }

  // Push character out of any objects they may have already penetrated
  const charHitbox = getCharacterHitbox(newChar, hitboxConfig);
  for (const obj of gameObjects) {
    if (obj.isCollectible) continue;
    
    for (const addr of obj.address) {
      const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
      const objHitbox = getObjectHitbox(cellSize, cleanAddr, obj.hitbox);

      if (checkHitboxCollision(charHitbox, objHitbox)) {
        // Character is overlapping - push out in the direction of least penetration
        const overlapLeft = charHitbox.right - objHitbox.x; // How far into object from left
        const overlapRight = objHitbox.right - charHitbox.x; // How far into object from right
        const overlapTop = charHitbox.bottom - objHitbox.y; // How far down into object from top
        const overlapBottom = objHitbox.bottom - charHitbox.y; // How far up into object from bottom

        // Find smallest overlap to push out in that direction (side collisions only for now)
        const minHorizontalOverlap = Math.min(overlapLeft, overlapRight);
        const minVerticalOverlap = Math.min(overlapTop, overlapBottom);

        // Prioritize horizontal collision (prevent walking through)
        if (minHorizontalOverlap < minVerticalOverlap) {
          if (overlapLeft < overlapRight) {
            // Push character LEFT out of object
            // charHitbox.right should equal objHitbox.x
            // charHitbox.right = newChar.x + offset.x + width
            // So: newChar.x = objHitbox.x - offset.x - width
            const offsetX = hitboxConfig?.offsetX || 0;
            const width = hitboxConfig?.width || newChar.width;
            newChar.x = objHitbox.x - offsetX - width;
          } else {
            // Push character RIGHT out of object
            // charHitbox.x should equal objHitbox.right
            // charHitbox.x = newChar.x + offset.x
            // So: newChar.x = objHitbox.right - offset.x
            const offsetX = hitboxConfig?.offsetX || 0;
            newChar.x = objHitbox.right - offsetX;
          }
        }
      }
    }
  }

  // Check ground
  newChar.onGround = checkIfOnGround(newChar, gameObjects, cellSize, hitboxConfig);

  // Snap character to surface if on ground
  if (newChar.onGround) {
    newChar = snapCharacterToSurface(newChar, gameObjects, cellSize, gridHeight, hitboxConfig);
  }

  // Clamp to grid boundaries
  const gridPixelWidth = gridWidth * cellSize;
  const gridPixelHeight = gridHeight * cellSize;

  newChar.x = Math.max(0, Math.min(newChar.x, gridPixelWidth - newChar.width));
  newChar.y = Math.max(0, Math.min(newChar.y, gridPixelHeight - newChar.height));

  return newChar;
};

// ========== MOVEMENT CONTROLS ==========
export const jump = (character: CharacterState, scale: number = 1): CharacterState => {
  if (character.onGround && !character.isJumping) {
    return {
      ...character,
      velocityY: -JUMP_POWER * scale,
      isJumping: true,
      onGround: false,
    };
  }
  return character;
};

export const moveLeft = (character: CharacterState, scale: number = 1): CharacterState => {
  return {
    ...character,
    velocityX: -MOVE_SPEED * scale,
  };
};

export const moveRight = (character: CharacterState, scale: number = 1): CharacterState => {
  return {
    ...character,
    velocityX: MOVE_SPEED * scale,
  };
};

export const stopMoving = (character: CharacterState): CharacterState => {
  return {
    ...character,
    velocityX: 0,
  };
};
