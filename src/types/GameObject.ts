/**
 * Type definitions for game objects and related data structures
 */

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ObjectAnimation {
  frames: readonly string[]; // Array of frame sprite paths
  speed: number; // Animation speed (frames per cycle)
}

export interface TextConfig {
  text: string; // Text content to display
  bgColor: string; // Background color (e.g., 'rgba(0,10,50,1)')
  color: [number, number, number]; // RGB color array (e.g., [230, 0, 190])
  scale: number; // Font scale
  charSpaces: number; // Space between characters
  animate?: boolean; // Whether to animate text appearance
  visibilityRange?: number; // Distance in pixels from player to show text (optional)
  visibilityAddress?: string; // Grid address where text becomes visible (e.g., 'I3'). Takes precedence over visibilityRange
}

export interface GameObject {
  id: string; // Unique identifier for the object type
  type: 'block' | 'animated' | 'input' | 'output' | 'ui' | 'portal' | 'text'; // Object category
  img?: string; // Path to sprite asset (optional if animation exists)
  animation?: ObjectAnimation; // Animation frames and speed (optional)
  textConfig?: TextConfig; // For text objects: text rendering configuration
  hitbox: Hitbox; // Collision boundaries
  position: Position; // World position
  address: string[]; // Grid addresses where object is placed (A-P, 1-16) or with scale notation (e.g., "D12x2" for 2x2)
  isCollectible?: boolean; // If true, object has no collision (for coins, items, etc.)
  gridSize?: { width: number; height: number }; // Grid size in cells (default: 1x1). Set by parsing address notation.
  linkedObjectId?: string; // For input/output objects: ID of linked object (button to trapdoor)
  destinationAddress?: string; // For portal objects: grid address where portal teleports player
  action?: { type: 'navigate'; path: string }; // For portal objects: action to perform (e.g., navigate to another page)
  damageAmount?: number; // For trap objects: damage dealt to character in health points
}
