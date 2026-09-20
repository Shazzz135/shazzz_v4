/**
 * Level data definitions
 * Contains all game objects (platforms, obstacles, etc.) for levels
 * Build levels by creating LevelData definitions using object definitions
 */
import type { GameObject } from '../types/GameObject';
import type { NPC } from '../types/NPC';
import { BLOCK_OBJECTS, ANIMATED_OBJECTS, TRAP_OBJECTS, INPUT_OBJECTS, OUTPUT_OBJECTS } from '../objects/definitions';
import { expandAddressRange } from '../utils/addressRangeExpander';
import goblins from '../assets/backgrounds/goblins.webp';

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

export const experienceLevel: LevelData = {
  id: 'experience',
  name: 'Experience',
  background: goblins,
  objects: [
    createObject(
      BLOCK_OBJECTS.grassFull,
      { x: 0, y: 15 * 32 },
      ['P2-29', 'I1-5', 'I27-30', 'I12-15']
    ),
    createObject(
      BLOCK_OBJECTS.grassHalf,
      { x: 0, y: 15 * 32 },
      ['P1F', 'P30', 'I6', 'I26F', 'I11F', 'I16']
    ),
    createObject(
      BLOCK_OBJECTS.stoneFull,
      { x: 0, y: 15 * 32 },
      ['J-O1', 'J-O30', 'F1', 'A-F14', 'J-O14', 'A-E26', 'F17-18']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['J2', 'J29F', 'F2', 'J13F', 'J15', 'F19', 'E25F']
    ),
    createObject(
      ANIMATED_OBJECTS.crystal,
      { x: 0, y: 15 * 32 },
      ['E6', 'K18', 'M21', 'M7', 'K9', 'K24', 'F22']
    ),
    createObject(
      TRAP_OBJECTS.spikes,
      { x: 0, y: 15 * 32 },
      ['K-O2R', 'K-O29L', 'K-O13L', 'K-O15R']
    ),
    createObject(
      ANIMATED_OBJECTS.coin,
      { x: 0, y: 15 * 32 },
      ['E22', 'D1', 'C6', 'G13', 'D18', 'G27', 'G16', 'C25', 'N4', 'N18']
    ),
    createObject(
      INPUT_OBJECTS.blueButton,
      { x: 0, y: 15 * 32 },
      ['H1']
    ),
    createObject(
      OUTPUT_OBJECTS.blueTrapdoor,
      { x: 0, y: 15 * 32 },
      ['G-H14']
    ),
    createObject(
      INPUT_OBJECTS.redButton,
      { x: 0, y: 15 * 32 },
      ['O11']
    ),
    createObject(
      OUTPUT_OBJECTS.redTrapdoor,
      { x: 0, y: 15 * 32 },
      ['F-H26', 'F15-16L']
    ),
    createObject(
      INPUT_OBJECTS.greenButton,
      { x: 0, y: 15 * 32 },
      ['O27']
    ),
    createObject(
      OUTPUT_OBJECTS.greenTrapdoor,
      { x: 0, y: 15 * 32 },
      ['I7-10R']
    ),
  ],
  characterSpawn: 'G4',
   npcs: [
    {
      id: 'goblin-1',
      type: 'goblin',
      address: 'N3F',
    },
    {
      id: 'goblin-2',
      type: 'goblin',
      address: 'N28',
    },
    {
      id: 'goblin-3',
      type: 'goblin',
      address: 'N15F',
    },
    {
      id: 'goblin-4',
      type: 'goblin',
      address: 'N20',
    },
    {
      id: 'goblin-5',
      type: 'goblin',
      address: 'N25F',
    }, 
    {
      id: 'goblin-6',
      type: 'goblin',
      address: 'N5F',
    },
    {
      id: 'goblin-7',
      type: 'goblin',
      address: 'N10F',
    }, 
    {
      id: 'goblin-8',
      type: 'goblin',
      address: 'N12',
    }, 
    {
      id: 'goblin-9',
      type: 'goblin',
      address: 'N18',
    },
    {
      id: 'goblin-10',
      type: 'goblin',
      address: 'N22F',
    },
  ],

};

// Alias for backward compatibility
export const sandboxLevel: LevelData = experienceLevel;

// Available levels for selection
export const AVAILABLE_LEVELS = [
  experienceLevel,
];

// Get level by ID
export const getLevelById = (levelId: string): LevelData | undefined => {
  return AVAILABLE_LEVELS.find(level => level.id === levelId);
};
