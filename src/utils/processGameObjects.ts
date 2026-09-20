import type { GameObject } from '../types/GameObject';
import { expandScaledAddress, getGridScale } from './gridScaling';

export function processGameObjects(objects: GameObject[]): GameObject[] {
  return objects.map(obj => {
    const expandedAddresses: string[] = [];
    let gridSize = { width: 1, height: 1 };

    for (const addr of obj.address) {
      if (addr.includes('x')) {
        const scale = getGridScale(addr);
        gridSize = scale;

        const expanded = expandScaledAddress(addr);
        expandedAddresses.push(...expanded);
      } else {
        expandedAddresses.push(addr);
      }
    }

    return {
      ...obj,
      address: expandedAddresses.length > 0 ? expandedAddresses : obj.address,
      gridSize: expandedAddresses.length > 0 ? gridSize : undefined,
    };
  });
}