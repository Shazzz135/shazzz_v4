/**
 * Game Object Definitions
 * Centralized definitions for all game objects organized by type
 * 
 * Object Types:
 * - block: Static objects with no animation or interaction
 * - animated: Objects with animation frames
 * - input: Input objects like buttons that trigger outputs
 * - output: Output objects like trapdoors that respond to inputs
 */

import type { GameObject } from '../types/GameObject';

// ========== BLOCK OBJECTS (Static, no animation) ==========
import grassFull from '/world/blocks/grass_full.svg';
import grassHalf from '/world/blocks/grass_half.svg';
import stoneFull from '/world/blocks/stone_full.svg';
import stoneHalf from '/world/blocks/stone_half.svg';

export const BLOCK_OBJECTS = {
  grassFull: {
    id: 'grass-full',
    type: 'block' as const,
    img: grassFull,
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
  grassHalf: {
    id: 'grass-half',
    type: 'block' as const,
    img: grassHalf,
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
  stoneFull: {
    id: 'stone-full',
    type: 'block' as const,
    img: stoneFull,
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
  stoneHalf: {
    id: 'stone-half',
    type: 'block' as const,
    img: stoneHalf,
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
} as const;

// ========== ANIMATED OBJECTS ==========
import coin1 from '../assets/objects/coin/coin1.svg';
import coin2 from '../assets/objects/coin/coin2.svg';
import crystal1 from '../assets/platforms/crystal/crystal1.svg';
import crystal2 from '../assets/platforms/crystal/crystal2.svg';
import crystal3 from '../assets/platforms/crystal/crystal3.svg';
import crystal4 from '../assets/platforms/crystal/crystal4.svg';

export const ANIMATED_OBJECTS = {
  coin: {
    id: 'coin',
    type: 'animated' as const,
    animation: {
      frames: [coin1, coin2] as const,
      speed: 25,
    },
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
    isCollectible: true,
  },
  crystal: {
    id: 'crystal',
    type: 'animated' as const,
    animation: {
      frames: [crystal1, crystal2, crystal3, crystal4] as const,
      speed: 20,
    },
    hitbox: { x: 0, y: 0, width: 32, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
} as const;

// ========== INPUT OBJECTS (Buttons/Switches) ==========
import blueSwitch1 from '../assets/objects/switches/blue1.svg';
import blueSwitch2 from '../assets/objects/switches/blue2.svg';
import blueSwitch3 from '../assets/objects/switches/blue3.svg';
import blueSwitch4 from '../assets/objects/switches/blue4.svg';
import greenSwitch1 from '../assets/objects/switches/green1.svg';
import greenSwitch2 from '../assets/objects/switches/green2.svg';
import greenSwitch3 from '../assets/objects/switches/green3.svg';
import greenSwitch4 from '../assets/objects/switches/green4.svg';
import redSwitch1 from '../assets/objects/switches/red1.svg';
import redSwitch2 from '../assets/objects/switches/red2.svg';
import redSwitch3 from '../assets/objects/switches/red3.svg';
import redSwitch4 from '../assets/objects/switches/red4.svg';

export const INPUT_OBJECTS = {
  blueButton: {
    id: 'blue-button',
    type: 'input' as const,
    animation: {
      frames: [blueSwitch1, blueSwitch2, blueSwitch3, blueSwitch4] as const,
      speed: 18,
    },
    hitbox: { x: 8, y: 26, width: 16, height: 6 },
    position: { x: 0, y: 0 },
    address: [],
    linkedObjectId: 'blue-trapdoor',
  },
  greenButton: {
    id: 'green-button',
    type: 'input' as const,
    animation: {
      frames: [greenSwitch1, greenSwitch2, greenSwitch3, greenSwitch4] as const,
      speed: 18,
    },
    hitbox: { x: 8, y: 26, width: 16, height: 6 },
    position: { x: 0, y: 0 },
    address: [],
    linkedObjectId: 'green-trapdoor',
  },
  redButton: {
    id: 'red-button',
    type: 'input' as const,
    animation: {
      frames: [redSwitch1, redSwitch2, redSwitch3, redSwitch4] as const,
      speed: 18,
    },
    hitbox: { x: 8, y: 26, width: 16, height: 6 },
    position: { x: 0, y: 0 },
    address: [],
    linkedObjectId: 'red-trapdoor',
  },
} as const;

// ========== OUTPUT OBJECTS (Trapdoors) ==========
import blueTrap1 from '../assets/objects/trapdoors/blue1.svg';
import blueTrap2 from '../assets/objects/trapdoors/blue2.svg';
import blueTrap3 from '../assets/objects/trapdoors/blue3.svg';
import blueTrap4 from '../assets/objects/trapdoors/blue4.svg';
import greenTrap1 from '../assets/objects/trapdoors/green1.svg';
import greenTrap2 from '../assets/objects/trapdoors/green2.svg';
import greenTrap3 from '../assets/objects/trapdoors/green3.svg';
import greenTrap4 from '../assets/objects/trapdoors/green4.svg';
import redTrap1 from '../assets/objects/trapdoors/red1.svg';
import redTrap2 from '../assets/objects/trapdoors/red2.svg';
import redTrap3 from '../assets/objects/trapdoors/red3.svg';
import redTrap4 from '../assets/objects/trapdoors/red4.svg';

export const OUTPUT_OBJECTS = {
  blueTrapdoor: {
    id: 'blue-trapdoor',
    type: 'output' as const,
    animation: {
      frames: [blueTrap1, blueTrap2, blueTrap3, blueTrap4] as const,
      speed: 18,
    },
    hitbox: { x: 0, y: 0, width: 16, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
  greenTrapdoor: {
    id: 'green-trapdoor',
    type: 'output' as const,
    animation: {
      frames: [greenTrap1, greenTrap2, greenTrap3, greenTrap4] as const,
      speed: 18,
    },
    hitbox: { x: 0, y: 0, width: 16, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
  redTrapdoor: {
    id: 'red-trapdoor',
    type: 'output' as const,
    animation: {
      frames: [redTrap1, redTrap2, redTrap3, redTrap4] as const,
      speed: 18,
    },
    hitbox: { x: 0, y: 0, width: 16, height: 32 },
    position: { x: 0, y: 0 },
    address: [],
  },
} as const;

/**
 * Helper function to create a GameObject instance
 * Takes a template object and adds position/address information
 */
export const createGameObject = (
  template: GameObject,
  position: { x: number; y: number },
  address: string[]
): GameObject => {
  return {
    ...template,
    position,
    address,
  };
};

// Export all object templates for easy access
export const ALL_GAME_OBJECTS = {
  ...BLOCK_OBJECTS,
  ...ANIMATED_OBJECTS,
  ...INPUT_OBJECTS,
  ...OUTPUT_OBJECTS,
} as const;
