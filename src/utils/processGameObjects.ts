/**
 * Utility to process game objects and expand scaled addresses
 */

import type { GameObject } from '../types/GameObject';
import { expandScaledAddress, getGridScale } from './gridScaling';

/**
 * Process game objects to expand scaled addresses
 * Converts "D12x2" notation into the actual grid cells it occupies
 * and sets the gridSize property
 */
export function processGameObjects(objects: GameObject[]): GameObject[] {
  return objects.map(obj => {
    // Expand each address and check for scale notation
    const expandedAddresses: string[] = [];
    let gridSize = { width: 1, height: 1 };
    let baseAddress = '';

    for (const addr of obj.address) {
      // Check if this address has scale notation
      if (addr.includes('x')) {
        const scale = getGridScale(addr);
        gridSize = scale;
        // Get all cells this scaled address occupies
        const expanded = expandScaledAddress(addr);
        expandedAddresses.push(...expanded);
        // Set base address for positioning
        if (!baseAddress) {
          const parsed = addr.match(/^([A-P])(\d+)/);
          if (parsed) {
            baseAddress = `${parsed[1]}${parsed[2]}`;
          }
        }
      } else {
        expandedAddresses.push(addr);
      }
    }

    // Return modified object with expanded addresses and gridSize
    return {
      ...obj,
      address: expandedAddresses.length > 0 ? expandedAddresses : obj.address,
      gridSize: expandedAddresses.length > 0 ? gridSize : undefined,
    };
  });
}
