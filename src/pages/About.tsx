import { useRef, useState, useCallback } from 'react';
import { aboutLevel } from '../data/aboutData';
import { processGameObjects } from '../utils/processGameObjects';
import Character from '../components/Character';
import Goblin from '../components/Goblin';
import MobileControls from '../components/MobileControls';
import RotateDeviceScreen from '../components/RotateDeviceScreen';
import {
  useAnimationSystem,
  useInteractables,
  useHealthSystem,
  useDebugFeatures,
  useGameSceneSetup,
  useGridDebugLayer,
  useHitboxDebugLayer,
  useGameObjectsLayer,
  useHealthUI,
} from '../hooks';

/**
 * Universal Level/Game Scene Component
 * Renders a complete game level with grid, game objects, and character
 * Can be reused for multiple levels by passing different levelData
 * Dynamically scales to fit screen while maintaining 30×16 grid layout
 */

export default function About() {
  // ========== GRID CONFIGURATION ==========
  const gridCols = 30;
  const gridRows = 16;
  const BASE_CELL_SIZE = 32;
  const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ========== LEVEL DATA ==========
  const currentLevel = aboutLevel; // Hub only uses dungeon level
  const gameObjects = processGameObjects(currentLevel.objects);

  // ========== SCENE SETUP ==========
  const { cellSize, scale } = useGameSceneSetup(gridCols, gridRows, BASE_CELL_SIZE);

  // ========== CORE GAME LOGIC HOOKS ==========
  const interactables = useInteractables(gameObjects);
  const { activatedSwitches, openedDoors, handleSwitchActivation, handlePortalEnter: handlePortalEnterBase } = interactables;

  const animationState = useAnimationSystem(gameObjects, activatedSwitches, openedDoors, isMobile);
  const { objectFrames, buttonAnimationFrames, doorAnimationFrames, completedDoors } = animationState;

  const health = useHealthSystem();
  const { playerHealth, setPlayerHealth, heartFlickerState } = health;

  const debug = useDebugFeatures();
  const { showGrid, setShowGrid, showHitbox, setShowHitbox } = debug;

  // ========== STATE & REFS ==========
  const [characterPos, setCharacterPos] = useState({ x: 0, y: 0 });
  const characterRef = useRef<{ takeDamage: (amount: number) => void; teleportTo: (x: number, y: number) => void }>(null);
  const goblinRefsRef = useRef<Record<string, { takeDamage: (amount: number) => void }>({});
  const [defeatedGoblins, setDefeatedGoblins] = useState(new Set<string>());
  const [goblinHitCounts, setGoblinHitCounts] = useState<Record<string, number>>({});
  const [_goblinInGracePeriod] = useState(new Set<string>());
  const [collectedItems, setCollectedItems] = useState(new Set<string>());

  // ========== RENDERING LAYERS (Using hooks to generate JSX) ==========
  const gridLayer = useGridDebugLayer(gridCols, gridRows, cellSize, showGrid, isMobile);
  const hitboxLayer = useHitboxDebugLayer(gameObjects, cellSize, showHitbox);
  const gameObjectsLayer = useGameObjectsLayer(
    gameObjects,
    cellSize,
    objectFrames,
    buttonAnimationFrames,
    doorAnimationFrames,
    completedDoors,
    activatedSwitches,
    openedDoors,
    characterPos.x,
    characterPos.y,
    showHitbox,
    collectedItems,
  );
  const healthUILayer = useHealthUI(playerHealth, heartFlickerState, cellSize);

  // ========== EVENT HANDLERS ==========

  const handlePortalEnterWithRef = useCallback((charX: number, charY: number) => {
    handlePortalEnterBase(charX, charY, cellSize, characterRef);
  }, [cellSize, handlePortalEnterBase, characterRef]);

  const handleHealthChange = useCallback((health: number) => {
    setPlayerHealth(health);
  }, [setPlayerHealth]);

  const handleDeath = useCallback(() => {
    // Player died - any World-level cleanup can go here
  }, []);

  const handlePositionChange = useCallback((x: number, y: number) => {
    setCharacterPos({ x, y });
  }, []);

  const handlePunch = useCallback((punchX: number, punchY: number, punchWidth: number, punchHeight: number) => {
    // Check if punch hits any goblins and deal 1 heart of damage
    if (!currentLevel.npcs) return;

    for (const npc of currentLevel.npcs) {
      if (npc.type === 'goblin') {
        const goblinRef = goblinRefsRef.current[npc.id];
        if (!goblinRef) continue;

        const goblinPos = goblinRef.getPosition?.();
        if (!goblinPos) continue;

        // Check AABB collision between punch hitbox and goblin
        const punchCollides =
          punchX < goblinPos.x + goblinPos.width &&
          punchX + punchWidth > goblinPos.x &&
          punchY < goblinPos.y + goblinPos.height &&
          punchY + punchHeight > goblinPos.y;

        if (punchCollides) {
          // Deal 1 full heart of damage to goblin (goblin has only 1 heart, so any hit defeats it)
          setGoblinHitCounts((prev) => {
            const newCount = Math.min((prev[npc.id] ?? 0) + 1, 1);
            if (newCount >= 1) {
              setDefeatedGoblins((prevDefeated) => new Set([...prevDefeated, npc.id]));
            }
            return { ...prev, [npc.id]: newCount };
          });
        }
      }
    }
  }, [currentLevel.npcs, goblinRefsRef]);

  const handleGoblinAttack = useCallback(() => {
    // Goblin deals 0.5 hearts of damage to player
    if (characterRef.current) {
      characterRef.current.takeDamage(0.5);
    }
  }, []);

  const handleCollectItem = useCallback((itemAddress: string) => {
    // Mark item as collected (will disappear from rendering)
    setCollectedItems((prev) => new Set([...prev, itemAddress]));
  }, []);

  // Callback for Goblin to register itself on mount
  const handleGoblinMount = useCallback((goblinId: string, goblinRef: { takeDamage: (amount: number) => void }) => {
    goblinRefsRef.current[goblinId] = goblinRef;
  }, []);

  return (
    <>
      <RotateDeviceScreen />
      <div
        className="w-screen h-screen overflow-hidden flex items-start justify-center relative"
        style={{
          backgroundImage: currentLevel.background ? `url(${currentLevel.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#000000',
        }}
      >
        {/* Admin Debug Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="px-3 py-2 rounded font-bold text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button
            onClick={() => setShowHitbox(!showHitbox)}
            className="px-3 py-2 rounded font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            {showHitbox ? 'Hide Hitbox' : 'Show Hitbox'}
          </button>
        </div>

        <div className="relative" style={{ width: gridCols * cellSize, height: gridRows * cellSize }}>
          {/* Game Objects Layer */}
          {gameObjectsLayer}

          {/* Grid Debug Layer */}
          {gridLayer}

          {/* Hitbox Debug Layer */}
          {hitboxLayer}

          {/* Character Layer */}
          {cellSize > 0 && (
            <Character
              ref={characterRef}
              gameObjects={gameObjects}
              cellSize={cellSize}
              gridWidth={gridCols}
              gridHeight={gridRows}
              scale={scale}
              spawnAddress={currentLevel.characterSpawn}
              onHealthChange={handleHealthChange}
              onDeath={handleDeath}
              onButtonPress={handleSwitchActivation}
              onCollectItem={handleCollectItem}
              openedDoors={openedDoors}
              showHitbox={showHitbox}
              onPositionChange={handlePositionChange}
              onPunch={handlePunch}
              onPortalEnter={handlePortalEnterWithRef}
            />
          )}

          {/* NPCs Layer */}
          {cellSize > 0 && currentLevel.npcs &&
            currentLevel.npcs.map((npc) => {
              if (npc.type === 'goblin') {
                return (
                  <Goblin
                    key={npc.id}
                    ref={(ref) => {
                      if (ref) {
                        queueMicrotask(() => {
                          goblinRefsRef.current[npc.id] = ref;
                        });
                      }
                    }}
                    id={npc.id}
                    address={npc.address}
                    cellSize={cellSize}
                    gridWidth={gridCols}
                    gridHeight={gridRows}
                    gameObjects={gameObjects}
                    openedDoors={openedDoors}
                    characterX={characterPos.x}
                    characterY={characterPos.y}
                    characterWidth={characterRef.current ? 48 * scale * 0.95 : 0}
                    characterHeight={characterRef.current ? 48 * scale * 0.95 : 0}
                    scale={scale}
                    showHitbox={showHitbox}
                    isDefeated={defeatedGoblins.has(npc.id)}
                    isPlayerDead={playerHealth <= 0}
                    hitCount={goblinHitCounts[npc.id] ?? 0}
                    isInGracePeriod={_goblinInGracePeriod.has(npc.id)}
                    onAttackHit={handleGoblinAttack}
                  />
                );
              }
              return null;
            })}
        </div>

        {/* Health UI Display */}
        {healthUILayer}

        {/* Mobile Controls */}
        <MobileControls />
      </div>
    </>
  );
}
