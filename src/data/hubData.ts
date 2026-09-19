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
      ['O2', 'O3', 'O4', 'O5F', 'O6', 'O7', 'O8', 'O9', 'O10', 'O11', 'O12', 'O13F', 'O14', 'O15', 'O16', 'O17', 'O18', 'O19', 'O20F', 'O21', 'O22', 'O23', 'O24', 'O25', 'O26', 'O27', 'O28', 'O29', 'J4', 'J5', 'J6', 'J7F', 'J8F', 'J9', 'J22', 'J23', 'J24', 'J25F', 'J26', 'J27', 'L15', 'L16']
    ),
    createObject(
      BLOCK_OBJECTS.stoneHalf,
      { x: 0, y: 15 * 32 },
      ['O1F', 'O30', 'J3F', 'J10', 'J21F', 'J28', 'L14F', 'L17']
    ),
    {
      ...ANIMATED_OBJECTS.portalRed,
      position: { x: 8 * 32, y: 2 * 32 }, // H3
      address: ['H4x2'],
      action: {type: 'navigate', path: '/about'}
    } as GameObject,
    {
      ...ANIMATED_OBJECTS.portalRed,
      position: { x: 8 * 32, y: 26 * 32 }, // H27
      address: ['H26x2'],
      action: {type: 'navigate', path: '/projects'}
    } as GameObject,
    {
      ...ANIMATED_OBJECTS.portalRed,
      position: { x: 8 * 32, y: 26 * 32 }, // M27
      address: ['M8x2'],
      action: {type: 'navigate', path: '/experience'}
    } as GameObject,
    {
      ...ANIMATED_OBJECTS.portalRed,
      position: { x: 8 * 32, y: 26 * 32 }, // M27
      address: ['M22x2'],
      action: {type: 'navigate', path: '/contacts'}
    } as GameObject,
    {
      id: 'help',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['G5'],
      isCollectible: true,
      textConfig: {
        text: "Press 'E' to Enter",
        bgColor: 'rgba(0,0,0,0)',
        color: [255, 255, 255],
        scale: 2,
        charSpaces: 10,
        animate: false,
        visibilityAddress: 'H4', // Only show when player is at portal H3
      },
    } as GameObject,
    {
      id: 'help',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['G25'],
      isCollectible: true,
      textConfig: {
        text: "Press 'E' to Enter",
        bgColor: 'rgba(0,0,0,0)',
        color: [255, 255, 255],
        scale: 2,
        charSpaces: 10,
        animate: false,
        visibilityAddress: 'H26', // Only show when player is at portal H27
      },
    } as GameObject,
     {
      id: 'help',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['L9'],
      isCollectible: true,
      textConfig: {
        text: "Press 'E' to Enter",
        bgColor: 'rgba(0,0,0,0)',
        color: [255, 255, 255],
        scale: 2,
        charSpaces: 10,
        animate: false,
        visibilityAddress: 'M8', // Only show when player is at portal M27
      },
    } as GameObject,
     {
      id: 'help',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['L21'],
      isCollectible: true,
      textConfig: {
        text: "Press 'E' to Enter",
        bgColor: 'rgba(0,0,0,0)',
        color: [255, 255, 255],
        scale: 2,
        charSpaces: 10,
        animate: false,
        visibilityAddress: 'M22', // Only show when player is at portal M27
      },
    } as GameObject,
    {
      id: 'title',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['D10'],
      isCollectible: true,
      textConfig: {
        text: 'Dungeon Hub',
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 7.7,
        charSpaces: 22,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
    {
      id: 'pointer',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['F13'],
      textConfig: {
        text: "Select a Level",
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 3,
        charSpaces: 20,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
    {
      id: 'section',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['I7'],
      textConfig: {
        text: "About Me",
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 3,
        charSpaces: 20,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
    {
      id: 'section',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['I22'],
      textConfig: {
        text: "Projects",
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 3,
        charSpaces: 20,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
    {
      id: 'section',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['N3'],
      textConfig: {
        text: "Experience",
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 3,
        charSpaces: 20,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
    {
      id: 'section',
      type: 'text' as const,
      hitbox: { x: 0, y: 0, width: 0, height: 0 },
      position: { x: 7 * 32, y: 4 * 32 },
      address: ['N25'],
      textConfig: {
        text: "Contacts",
        bgColor: 'rgba(0, 0, 0, 0)',
        color: [255, 225, 225],
        scale: 3,
        charSpaces: 20,
        animate: false,
        visibilityAddress: '', // Only show when player is at portal I3
      },
    } as GameObject,
  ],
  characterSpawn: 'M15',
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
