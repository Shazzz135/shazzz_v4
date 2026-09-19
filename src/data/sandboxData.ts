/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS } from '../objects/definitions';
import { expandAddressRange } from '../utils/addressRangeExpander';
import dungeon from '../assets/backgrounds/dungeon.webp';

export interface LevelData {
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
  background?: string; // Background image (optional)
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

export const sandboxLevel: LevelData = {
  objects: [
    // Platform under character spawn
    createObject(
      BLOCK_OBJECTS.grassFull,
      { x: 4 * 32, y: 9 * 32 },
      ['J5-8', 'M1-2', 'O1-30', 'M20-30', 'K25-30']
    )
  ],
  characterSpawn: 'M8',
  background: dungeon,
  npcs: [
    {
      id: 'goblin-1',
      type: 'goblin',
      address: 'K1',
    },
    {
      id: 'goblin-2',
      type: 'goblin',
      address: 'O19',
    },
  ],
};
