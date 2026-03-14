/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions
 */
import type { GameObject } from '../types/GameObject';
import grassFull from '/world/blocks/grass_full.svg';
import dungeon from '../assets/backgrounds/dungeon.webp';

export interface LevelData {
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
  background?: string; // Background image (optional)
}

export const sandboxLevel: LevelData = {
  objects: [
    // Platform under character spawn
    {
      id: 'block-spawn-1',
      img: grassFull,
      hitbox: { x: 0, y: 0, width: 32, height: 32 },
      position: { x: 4 * 32, y: 9 * 32 }, // Grid D10
      address: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'N7'],
    },
  ],
  characterSpawn: 'B8',
  background: dungeon,
};
