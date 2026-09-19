/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS } from '../objects/definitions';
import dungeon from '../assets/backgrounds/dungeon.webp';

export interface LevelData {
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
  background?: string; // Background image (optional)
  npcs?: NPC[]; // Non-player characters (optional)
}

// Helper function to create a game object instance with position and address
const createObject = (template: Omit<GameObject, 'position' | 'address'>, position: { x: number; y: number }, address: string[]): GameObject => {
  return {
    ...template,
    position,
    address,
  };
};

export const sandboxLevel: LevelData = {
  objects: [
    // Platform under character spawn
    createObject(
      BLOCK_OBJECTS.grassFull,
      { x: 4 * 32, y: 9 * 32 },
      ['J5', 'J6', 'J7', 'J8', 'M1', 'M2', 'O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8', 'O9', 'O10', 'O11', 'O12', 'O13', 'O14', 'O15', 'O16', 'O17', 'O18', 'O19', 'O20', 'O21', 'O22', 'O23', 'O24', 'O25', 'O26', 'O27', 'O28', 'O29', 'O30', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27', 'M28', 'M29', 'M30', 'K25', 'K26', 'K27', 'K28', 'K29', 'K30']
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
  ],
};
