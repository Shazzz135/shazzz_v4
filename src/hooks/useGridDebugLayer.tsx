/**
 * Grid Debug Layer Hook
 * Renders grid lines and cell address labels for debugging
 */

export function useGridDebugLayer(
  gridCols: number,
  gridRows: number,
  cellSize: number,
  showGrid: boolean,
  isMobile: boolean,
) {
  if (!showGrid || cellSize <= 0 || isMobile) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0"
      width={gridCols * cellSize}
      height={gridRows * cellSize}
      style={{ pointerEvents: 'none' }}
    >
      {/* Vertical grid lines */}
      {Array.from({ length: gridCols + 1 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * cellSize}
          y1={0}
          x2={i * cellSize}
          y2={gridRows * cellSize}
          stroke="#666666"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      {/* Horizontal grid lines */}
      {Array.from({ length: gridRows + 1 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * cellSize}
          x2={gridCols * cellSize}
          y2={i * cellSize}
          stroke="#666666"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      {/* Grid labels */}
      {Array.from({ length: gridRows }).map((_, row) =>
        Array.from({ length: gridCols }).map((_, col) => {
          const letter = String.fromCharCode(65 + row); // A-P
          const number = col + 1; // 1-30
          const address = `${letter}${number}`;
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          return (
            <text
              key={`label-${address}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#999999"
              fontSize={(cellSize * 0.4).toString()}
              opacity="0.6"
              pointerEvents="none"
            >
              {address}
            </text>
          );
        })
      )}
    </svg>
  );
}
