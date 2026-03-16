/**
 * Utility functions for handling dynamic grid scaling
 * Allows objects to span multiple grid cells using notation like "D12x2" for 2x2 scaling
 */

/**
 * Parse a grid address with optional scale notation
 * Examples:
 * - "D12" -> { baseRow: 3 (D), baseCol: 11 (12-1), width: 1, height: 1 }
 * - "D12x2" -> { baseRow: 3 (D), baseCol: 11 (12-1), width: 2, height: 2 }
 * - "D12x2y1" -> { baseRow: 3 (D), baseCol: 11 (12-1), width: 2, height: 1 }
 */
export interface ParsedAddress {
  baseRow: number; // 0-based row (A=0, B=1, etc.)
  baseCol: number; // 0-based column
  width: number; // How many columns it spans
  height: number; // How many rows it spans
  rawAddress: string; // Original address string
}

export function parseGridAddress(address: string): ParsedAddress {
  // Match pattern: Letter + Number + optional scale (e.g., "D12" or "D12x2" or "D12x2y1")
  const match = address.match(/^([A-P])(\d+)(?:x(\d+))?(?:y(\d+))?$/);
  
  if (!match) {
    throw new Error(`Invalid grid address format: ${address}`);
  }

  const [, letter, colStr, widthStr, heightStr] = match;
  const baseRow = letter.charCodeAt(0) - 65; // A=0, B=1, ..., P=15
  const baseCol = parseInt(colStr) - 1; // Convert 1-based to 0-based
  const width = widthStr ? parseInt(widthStr) : 1;
  const height = heightStr ? parseInt(heightStr) : width; // Default height to width if only one scale number (e.g., "D12x2" means 2x2)

  return {
    baseRow,
    baseCol,
    width,
    height,
    rawAddress: address,
  };
}

/**
 * Expand a scaled address to all grid cells it occupies
 * For "D12x2", returns all cells in the 2x2 grid
 * Remember: letters go top to bottom (rows), numbers go left to right (columns)
 */
export function expandScaledAddress(address: string): string[] {
  const parsed = parseGridAddress(address);
  const cells: string[] = [];

  // Iterate through all rows and columns the object spans
  for (let row = parsed.baseRow; row < parsed.baseRow + parsed.height; row++) {
    for (let col = parsed.baseCol; col < parsed.baseCol + parsed.width; col++) {
      if (row >= 0 && row <= 15 && col >= 0 && col <= 29) {
        const letter = String.fromCharCode(65 + row);
        const number = col + 1;
        cells.push(`${letter}${number}`);
      }
    }
  }

  return cells;
}

/**
 * Get base address (top-left corner) from a scaled address
 */
export function getBaseAddress(address: string): string {
  const parsed = parseGridAddress(address);
  const letter = String.fromCharCode(65 + parsed.baseRow);
  const number = parsed.baseCol + 1;
  return `${letter}${number}`;
}

/**
 * Extract just the scale from an address (e.g., "D12x2" -> { width: 2, height: 2 })
 */
export function getGridScale(address: string): { width: number; height: number } {
  const parsed = parseGridAddress(address);
  return { width: parsed.width, height: parsed.height };
}
