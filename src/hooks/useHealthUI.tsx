import { UI_OBJECTS } from '../objects/definitions';

/**
 * Health UI Hook
 * Renders the health display (3 hearts)
 */

export function useHealthUI(
  playerHealth: number,
  heartFlickerState: boolean,
  cellSize: number,
) {
  if (cellSize <= 0) {
    return null;
  }

  const renderHeart = (heartIndex: number, minHealth: number, maxHealth: number) => {
    let heartState: 'full' | 'half' | 'empty' = 'empty';
    if (playerHealth >= maxHealth) {
      heartState = 'full';
    } else if (playerHealth >= minHealth) {
      heartState = 'half';
    }

    const heartImages = {
      full: UI_OBJECTS.heartFull.img,
      half: UI_OBJECTS.heartHalf.img,
      empty: UI_OBJECTS.heartEmpty.img,
    };

    return (
      <div key={`heart-${heartIndex}`} style={{ width: cellSize * 2, height: cellSize * 2 }}>
        <img
          src={heartImages[heartState]}
          alt={`Heart ${heartIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: heartFlickerState ? 1 : 0.3,
            transition: 'opacity 0.05s',
          }}
        />
      </div>
    );
  };

  return (
    <div className="absolute top-0 left-0 z-20 flex gap-2" style={{ padding: `${cellSize * 0.5}px` }}>
      {/* Heart 1 (represents 0-1 health) */}
      {renderHeart(0, 0.5, 1)}
      {/* Heart 2 (represents 1-2 health) */}
      {renderHeart(1, 1.5, 2)}
      {/* Heart 3 (represents 2-3 health) */}
      {renderHeart(2, 2.5, 3)}
    </div>
  );
}
