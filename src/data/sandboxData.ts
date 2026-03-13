/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions
 */
import type { GameObject } from '../types/GameObject';
import grassFull from '/world/blocks/grass_full.svg';

export interface LevelData {
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
}

export const sandboxLevel: LevelData = {
  objects: [
    // Platform under character spawn
    {
      id: 'block-spawn-1',
      img: grassFull,
      hitbox: { x: 0, y: 0, width: 32, height: 32 },
      position: { x: 4 * 32, y: 9 * 32 }, // Grid D10
      address: ['D8'],
    },
  ],
  characterSpawn: 'B8', // Spawn at grid position E8
};
