/**
 * Character hitbox configurations for each animation state
 * Defines collision boundaries for physics engine
 * 
 * Properties:
 * - width/height: Hitbox dimensions in pixels
 * - offsetX/offsetY: Position relative to character sprite origin (0,0)
 */

export type HitboxState = 'idle' | 'running' | 'jumping' | 'punching' | 'prone';

export interface CharacterHitbox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

// Hitbox dimensions for each animation state (used for collision detection)
export const HITBOX_CONFIG: Record<HitboxState, CharacterHitbox> = {
  idle: {
    width: 20,
    height: 44,
    offsetX: 10,
    offsetY: 4,
  },
  running: {
    width: 20,
    height: 44,
    offsetX: 10,
    offsetY: 4,
  },
  jumping: {
    width: 20,
    height: 44,
    offsetX: 10,
    offsetY: 4,
  },
  punching: {
    width: 20,
    height: 44,
    offsetX: 10,
    offsetY: 4,
  },
  prone: {
    width: 40,
    height: 16,
    offsetX: 4,
    offsetY: 20,
  },
};
