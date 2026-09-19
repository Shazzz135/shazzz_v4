import { useState, useEffect } from 'react';

/**
 * Game Scene Setup Hook
 * Handles grid sizing, scaling, and responsive layout
 */

export function useGameSceneSetup(gridCols: number, gridRows: number, baseCellSize: number = 32) {
  const [cellSize, setCellSize] = useState(0);

  useEffect(() => {
    const calculateCellSize = () => {
      const cellWidth = window.innerWidth / gridCols;
      const cellHeight = window.innerHeight / gridRows;
      const newCellSize = Math.min(cellWidth, cellHeight);
      setCellSize(newCellSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    return () => window.removeEventListener('resize', calculateCellSize);
  }, [gridCols, gridRows]);

  const scale = cellSize > 0 ? cellSize / baseCellSize : 1;

  return {
    cellSize,
    scale,
  };
}
