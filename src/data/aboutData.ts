/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS, ANIMATED_OBJECTS, TRAP_OBJECTS } from '../objects/definitions';
import { expandAddressRange } from '../utils/addressRangeExpander';
import cave from '../assets/backgrounds/cave.webp';

export interface LevelData {
  id: string; // Unique level identifier
  name: string; // Display name
  background: string; // Background image path
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
  npcs?: NPC[]; // Non-player characters (optional)
}

// Helper function to create a game object instance with position and address
// Automatically expands address ranges (e.g., 'A-D11' or 'A1-5')
const createObject = (template: Omit<GameObject, 'position' | 'address'>, position: { x: number; y: number }, address: string[]): GameObject => {
  return {
    ...template,
    position,
    address: expandAddressRange(address),
  };
};

export const aboutLevel: LevelData = {
  id: 'about',
  name: 'About',
  background: cave,
  objects: [
    createObject(
      BLOCK_OBJECTS.stoneFull,
      { x: 0, y: 15 * 32 },
      ['P2-29', 'M1-2', 'G10-21', 'A-E15', 'A-D14', 'A-E16', 'A-D17', 'O22-25', 'E26-30', 'F-G26', 'D1-4', 'A3']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['P1F','P30', 'N1','M3', 'G9F', 'G22','E25F','D5', 'H26F', 'B3', 'E14F', 'E17']
    ),
    createObject(
      ANIMATED_OBJECTS.crystal,
      { x: 0, y: 15 * 32 },
      ['J5-6', 'M14', 'L27','I30']
    ),
    createObject(
      TRAP_OBJECTS.spikes,
      { x: 0, y: 15 * 32 },
      ['O26-30']
    ),
    createObject(
      ANIMATED_OBJECTS.coin,
      { x: 0, y: 15 * 32 },
      ['K1', 'N9', 'J14', 'N17', 'L23', 'G30', 'B1', 'E11', 'E20', 'C27']
    ),
  ],
  characterSpawn: 'N3',
   npcs: [
    {
      id: 'goblin-1',
      type: 'goblin',
      address: 'N19',
    },
  ],
};

// Alias for backward compatibility
export const sandboxLevel: LevelData = aboutLevel;

// Available levels for selection
export const AVAILABLE_LEVELS = [
  aboutLevel,
];

// Get level by ID
export const getLevelById = (levelId: string): LevelData | undefined => {
  return AVAILABLE_LEVELS.find(level => level.id === levelId);
};
