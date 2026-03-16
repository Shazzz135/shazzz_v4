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

export interface GameObject {
  id: string; // Unique identifier for the object type
  type: 'block' | 'animated' | 'input' | 'output'; // Object category
  img?: string; // Path to sprite asset (optional if animation exists)
  animation?: ObjectAnimation; // Animation frames and speed (optional)
  hitbox: Hitbox; // Collision boundaries
  position: Position; // World position
  address: string[]; // Grid addresses where object is placed (A-P, 1-16) or with scale notation (e.g., "D12x2" for 2x2)
  isCollectible?: boolean; // If true, object has no collision (for coins, items, etc.)
  gridSize?: { width: number; height: number }; // Grid size in cells (default: 1x1). Set by parsing address notation.
  linkedObjectId?: string; // For input/output objects: ID of linked object (button to trapdoor)
}
