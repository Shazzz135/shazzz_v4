import React from 'react';
import type { NPC } from '../types/NPC';
import type { GameObject } from '../types/GameObject';
import Goblin from '../components/Goblin';

// Type for Goblin component refs - stores refs by NPC ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoblinRefsMap = Record<string, any>; // Goblin component ref type

/**
 * NPC Layer Hook
 * Renders NPCs (goblins, etc) - only renders if NPCs exist in the level
 */

export function useNPCLayer(
  npcs: NPC[] | undefined,
  cellSize: number,
  gridCols: number,
  gridRows: number,
  gameObjects: GameObject[],
  openedDoors: Set<string>,
  characterX: number,
  characterY: number,
  characterWidth: number,
  characterHeight: number,
  scale: number,
  showHitbox: boolean,
  goblinRefsRef: React.MutableRefObject<GoblinRefsMap>,
  defeatedGoblins: Set<string>,
  playerHealth: number,
  goblinHitCounts: Record<string, number>,
  goblinInGracePeriod: Set<string>,
  onGoblinAttackHit: () => void,
) {
  if (!npcs || npcs.length === 0 || cellSize <= 0) {
    return null;
  }

  return (
    <>
      {npcs.map((npc: NPC) => {
        if (npc.type === 'goblin') {
          return (
            <Goblin
              key={npc.id}
              ref={(ref) => {
                if (ref) {
                  goblinRefsRef.current[npc.id] = ref;
                }
              }}
              id={npc.id}
              address={npc.address}
              cellSize={cellSize}
              gridWidth={gridCols}
              gridHeight={gridRows}
              gameObjects={gameObjects}
              openedDoors={openedDoors}
              characterX={characterX}
              characterY={characterY}
              characterWidth={characterWidth}
              characterHeight={characterHeight}
              scale={scale}
              showHitbox={showHitbox}
              isDefeated={defeatedGoblins.has(npc.id)}
              isPlayerDead={playerHealth <= 0}
              hitCount={goblinHitCounts[npc.id] ?? 0}
              isInGracePeriod={goblinInGracePeriod.has(npc.id)}
              onAttackHit={onGoblinAttackHit}
            />
          );
        }
        return null;
      })}
    </>
  );
}
