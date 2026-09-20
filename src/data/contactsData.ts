/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { ANIMATED_OBJECTS, BLOCK_OBJECTS } from '../objects/definitions';
import { expandAddressRange } from '../utils/addressRangeExpander';
import sewers from '../assets/backgrounds/sewers.webp';

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

export const contactsLevel: LevelData = {
  id: 'contacts',
  name: 'Contacts',
  background: sewers,
  objects: [
    createObject(
      BLOCK_OBJECTS.stoneFull,
      { x: 0, y: 15 * 32 },
      ['P2-29']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['P1F', 'P30']
    ),
     createObject(
          ANIMATED_OBJECTS.coin,
          { x: 0, y: 15 * 32 },
          ['N2', 'N5', 'N8', 'N11', 'N14', 'N17', 'N20', 'N23', 'N26', 'N29']
      ),
    
  ],
  characterSpawn: 'N15',
};

// Alias for backward compatibility
export const sandboxLevel: LevelData = contactsLevel;

// Available levels for selection
export const AVAILABLE_LEVELS = [
  contactsLevel,
];

// Get level by ID
export const getLevelById = (levelId: string): LevelData | undefined => {
  return AVAILABLE_LEVELS.find(level => level.id === levelId);
};
