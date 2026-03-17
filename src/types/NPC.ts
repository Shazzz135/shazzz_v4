/**
 * Type definitions for NPCs (Non-Player Characters)
 */

export interface NPC {
  id: string;
  type: 'goblin'; // NPC type
  address: string; // Grid address (e.g., "N1", "P2")
}
