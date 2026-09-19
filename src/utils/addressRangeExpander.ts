/**
 * Address Range Expander
 * Converts range notation to individual grid addresses
 * 
 * Supported formats:
 * - Single: 'A1' → ['A1']
 * - Horizontal: 'A-D11' → ['A11', 'B11', 'C11', 'D11']
 * - Vertical: 'A1-5' → ['A1', 'A2', 'A3', 'A4', 'A5']
 * - Horizontal with modifiers: 'A-D11F' → ['A11F', 'B11F', 'C11F', 'D11F']
 * - Vertical with modifiers: 'A1-5F' → ['A1F', 'A2F', 'A3F', 'A4F', 'A5F']
 */

function getColumnIndex(col: string): number {
  return col.charCodeAt(0) - 'A'.charCodeAt(0);
}

function getColumnLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

export function expandAddressRange(addresses: string[]): string[] {
  const expanded: string[] = [];

  for (const addr of addresses) {
    // Check for horizontal range (e.g., 'A-D11' or 'A-D11F')
    const horizontalMatch = addr.match(/^([A-P])-([A-P])(\d+)([A-Z]*)$/);
    if (horizontalMatch) {
      const [, startCol, endCol, row, modifier] = horizontalMatch;
      const start = getColumnIndex(startCol);
      const end = getColumnIndex(endCol);
      const minCol = Math.min(start, end);
      const maxCol = Math.max(start, end);

      for (let i = minCol; i <= maxCol; i++) {
        expanded.push(`${getColumnLetter(i)}${row}${modifier}`);
      }
      continue;
    }

    // Check for vertical range (e.g., 'A1-5' or 'A1-5F')
    const verticalMatch = addr.match(/^([A-P])(\d+)-(\d+)([A-Z]*)$/);
    if (verticalMatch) {
      const [, col, startRow, endRow, modifier] = verticalMatch;
      const start = parseInt(startRow);
      const end = parseInt(endRow);
      const minRow = Math.min(start, end);
      const maxRow = Math.max(start, end);

      for (let i = minRow; i <= maxRow; i++) {
        expanded.push(`${col}${i}${modifier}`);
      }
      continue;
    }

    // Single address, add as-is
    expanded.push(addr);
  }

  return expanded;
}
