/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS, ANIMATED_OBJECTS, TRAP_OBJECTS } from '../objects/definitions';
import { expandAddressRange } from '../utils/addressRangeExpander';
import Tree from '../assets/backgrounds/tree.webp';

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

export const projectLevel: LevelData = {
  id: 'project',
  name: 'Project',
  background: Tree,
  objects: [
    createObject(
      BLOCK_OBJECTS.stoneFull,
      { x: 0, y: 15 * 32 },
      ['P1-30', 'A-E10L', 'A-E21R', 'A15-17D', 'B15-17D', 'C15-17D', 'J29-30']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['J28F', 'E30F']
    ),
    createObject(
      BLOCK_OBJECTS.grassFull,
      { x: 0, y: 15 * 32 },
      ['O1-5', 'D4', 'L17-19', 'E11-20', 'I28-30', 'D29-30']
    ),
    createObject(
      BLOCK_OBJECTS.grassHalf,
      { x: 0, y: 15 * 32 },
      ['D3F','D5', 'L16F', 'L20', 'I27F', 'D28F']
    ),
    createObject(
      ANIMATED_OBJECTS.crystal,
      { x: 0, y: 15 * 32 },
      ['L7', 'I4', 'G1', 'K12', 'L25', 'F24']
    ),
    createObject(
      TRAP_OBJECTS.spikes,
      { x: 0, y: 15 * 32 },
      ['O6-30']
    ),
    createObject(
      ANIMATED_OBJECTS.coin,
      { x: 0, y: 15 * 32 },
      ['J7', 'G4', 'B4', 'I12', 'J18', 'J25', 'G30', 'D24', 'B29', 'D16']
    ),
    {
      ...ANIMATED_OBJECTS.portalBlue,
      position: { x: 8 * 32, y: 26 * 32 }, // M27
      address: ['G28x2'],
      destinationAddress: 'D12x2'
    } as GameObject,
    {
      ...ANIMATED_OBJECTS.portalBlue,
      position: { x: 8 * 32, y: 26 * 32 }, // M27
      address: ['C12x2'],
      destinationAddress: 'H28x2'
    } as GameObject,
  ],
  characterSpawn: 'N3',
};

// Alias for backward compatibility
export const sandboxLevel: LevelData = projectLevel;

// Available levels for selection
export const AVAILABLE_LEVELS = [
  projectLevel,
];

// Get level by ID
export const getLevelById = (levelId: string): LevelData | undefined => {
  return AVAILABLE_LEVELS.find(level => level.id === levelId);
};
