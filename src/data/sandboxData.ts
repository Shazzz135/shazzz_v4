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
      ['K5', 'K6', 'K7', 'K8', 'N1', 'N2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'P28', 'P29', 'P30', 'N20', 'N21', 'N22', 'N23', 'N24', 'N25', 'N26', 'N27', 'N28', 'N29', 'N30', 'L25', 'L26', 'L27', 'L28', 'L29', 'L30']
    )
  ],
  characterSpawn: 'N8',
  background: dungeon,
  npcs: [
    {
      id: 'goblin-1',
      type: 'goblin',
      address: 'L1',
    },
  ],
};
