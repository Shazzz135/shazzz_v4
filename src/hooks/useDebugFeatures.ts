import { useState } from 'react';

/**
 * Debug Features Hook
 * Manages admin/debug features like grid and hitbox visibility toggles
 */

export function useDebugFeatures() {
  const [showGrid, setShowGrid] = useState(false);
  const [showHitbox, setShowHitbox] = useState(false);

  return {
    showGrid,
    setShowGrid,
    showHitbox,
    setShowHitbox,
  };
}
