/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS, ANIMATED_OBJECTS } from '../objects/definitions';
import dungeon from '../assets/backgrounds/dungeon.webp';

export interface LevelData {
  id: string; // Unique level identifier
  name: string; // Display name
  background: string; // Background image path
  objects: GameObject[];
  characterSpawn: string; // Grid address (e.g., "D8")
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

export const dungeonLevel: LevelData = {
  id: 'dungeon',
  name: 'Dungeon',
  background: dungeon,
  objects: [
    createObject(
      BLOCK_OBJECTS.stoneFull,
      { x: 0, y: 15 * 32 },
      ['P2', 'P3', 'P4', 'P5F', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13F', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20F', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'P28', 'P29', 'K4', 'K5', 'K6', 'K7F', 'K8F', 'K9', 'K22', 'K23', 'K24', 'K25F', 'K26', 'K27', 'M15', 'M16']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['P1F', 'P30', 'K3F', 'K10', 'K21F', 'K28', 'M14F', 'M17']
    ),
    {
      ...ANIMATED_OBJECTS.portal,
      position: { x: 8 * 32, y: 2 * 32 }, // I3
      address: ['I3x2'],
      action: { type: 'navigate', path: '/' },
    } as GameObject,
    {
      ...ANIMATED_OBJECTS.portalBlue,
      position: { x: 8 * 32, y: 26 * 32 }, // I27
      address: ['I27x2'],
      destinationAddress: 'I3',
    } as GameObject,
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
