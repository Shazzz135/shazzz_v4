import { useState, useEffect, useRef, useCallback } from 'react';
import type { NPC } from '../types/NPC';
import type { GoblinHandle } from '../components/Goblin';

/**
 * Character Combat Hook
 * Manages punch detection, goblin hits, defeat tracking, and grace periods
 */

const GRACE_PERIOD_MS = 2000; // 2 second grace period between goblin hits

export function useCharacterCombat(
  gameObjects: any[],
  currentLevelNpcs: NPC[] | undefined,
  isMobile: boolean,
) {
  const ANIMATION_TICK_RATE = isMobile ? 32 : 16;

  const [goblinHitCounts, setGoblinHitCounts] = useState<Record<string, number>>({});
  const [goblinInGracePeriod, setGoblinInGracePeriod] = useState<Set<string>>(new Set());
  const [defeatedGoblins, setDefeatedGoblins] = useState<Set<string>>(new Set());

  const goblinRefsRef = useRef<Record<string, GoblinHandle>>({});
  const goblinHitsRef = useRef<Record<string, number>>({});
  const goblinDefeatedRef = useRef<Set<string>>(new Set());
  const goblinLastHitTimeRef = useRef<Record<string, number>>({});
  const lastPunchGoblinRef = useRef<string | null>(null);

  // Update grace period state
  useEffect(() => {
    const graceLoop = setInterval(() => {
      lastPunchGoblinRef.current = null;

      const now = Date.now();
      const newGracePeriodSet = new Set<string>();
      currentLevelNpcs?.forEach((npc) => {
        if (npc.type === 'goblin') {
          const lastHitTime = goblinLastHitTimeRef.current[npc.id] ?? 0;
          if (now - lastHitTime < GRACE_PERIOD_MS) {
            newGracePeriodSet.add(npc.id);
          }
        }
      });
      setGoblinInGracePeriod(newGracePeriodSet);
    }, ANIMATION_TICK_RATE);

    return () => clearInterval(graceLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelNpcs]);

  /**
   * Handle character punch collision with goblins
   */
  const handlePunch = useCallback(
    (punchX: number, punchY: number, punchWidth: number, punchHeight: number, characterX: number) => {
      const now = Date.now();
      const defeatedCountBefore = goblinDefeatedRef.current.size;
      let anyDefeated = false;

      currentLevelNpcs?.forEach((npc) => {
        if (npc.type !== 'goblin' || goblinDefeatedRef.current.has(npc.id)) return;
        if (lastPunchGoblinRef.current === npc.id) return;

        const goblinRef = goblinRefsRef.current[npc.id];
        if (!goblinRef) return;

        const goblinPos = goblinRef.getPosition();

        // AABB collision check
        const punchHits =
          punchX < goblinPos.x + goblinPos.width &&
          punchX + punchWidth > goblinPos.x &&
          punchY < goblinPos.y + goblinPos.height &&
          punchY + punchHeight > goblinPos.y;

        if (!punchHits) return;

        // Check grace period
        const lastHitTime = goblinLastHitTimeRef.current[npc.id] ?? 0;
        if (now - lastHitTime < GRACE_PERIOD_MS) return;

        // Register hit
        const currentHits = (goblinHitsRef.current[npc.id] ?? 0) + 1;
        goblinHitsRef.current[npc.id] = currentHits;
        goblinLastHitTimeRef.current[npc.id] = now;
        lastPunchGoblinRef.current = npc.id;

        // Make goblin turn towards player
        goblinRef.turnTowardPlayer(characterX);

        // Update hit count for display
        setGoblinHitCounts((prev) => ({ ...prev, [npc.id]: currentHits }));

        // Check if defeated
        if (currentHits >= 1) {
          goblinDefeatedRef.current.add(npc.id);
          anyDefeated = true;
        }
      });

      if (anyDefeated || goblinDefeatedRef.current.size > defeatedCountBefore) {
        setDefeatedGoblins(new Set(goblinDefeatedRef.current));
      }
    },
    [currentLevelNpcs],
  );

  return {
    goblinRefsRef,
    goblinHitCounts,
    goblinInGracePeriod,
    defeatedGoblins,
    handlePunch,
  };
}
