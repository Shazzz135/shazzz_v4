/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions
 */
import type { GameObject } from '../types/GameObject';
import stoneFull from '/world/blocks/stone_full.svg';
import stoneHalf from '/world/blocks/stone_half.svg';
import dungeon from '../assets/backgrounds/dungeon.webp';

export interface LevelData {
  id: string; // Unique level identifier
  name: string; // Display name
  background: string; // Background image path
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
}

export const dungeonLevel: LevelData = {
  id: 'dungeon',
  name: 'Dungeon',
  background: dungeon,
  objects: [
    {
      id: 'stone-full',
      img: stoneFull,
      hitbox: { x: 0, y: 0, width: 32, height: 32 },
      position: { x: 0, y: 15 * 32 },
      address: ['P2', 'P3', 'P4', 'P5R', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13R', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20R', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'P28', 'P29', 'K4', 'K5', 'K6', 'K7R', 'K8R', 'K9', 'K22', 'K23', 'K24', 'K25R', 'K26', 'K27', 'M15', 'M16'],
    },
    {
      id: 'stone-half',
      img: stoneHalf,
      hitbox: { x: 0, y: 0, width: 32, height: 32 },
      position: { x: 0, y: 15 * 32 },
      address: ['P1R', 'P30', 'K3R', 'K10', 'K21R', 'K28', 'M14R', 'M17'],
    },
  ],
  characterSpawn: 'N14',
};

// Alias for backward compatibility
export const sandboxLevel: LevelData = dungeonLevel;

// Available levels for selection
export const AVAILABLE_LEVELS = [
  dungeonLevel,
];

// Get level by ID
export const getLevelById = (levelId: string): LevelData | undefined => {
  return AVAILABLE_LEVELS.find(level => level.id === levelId);
};
