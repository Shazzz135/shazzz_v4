import { useRef, useState, useCallback } from 'react';
import { contactsLevel } from '../data/contactsData';
import { processGameObjects } from '../utils/processGameObjects';
import Character from '../components/Character';
import Goblin, { type GoblinHandle } from '../components/Goblin';
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

export default function Contacts() {
  // ========== GRID CONFIGURATION ==========
  const gridCols = 30;
  const gridRows = 16;
  const BASE_CELL_SIZE = 32;
  const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  // ========== LEVEL DATA ==========
  const currentLevel = contactsLevel;
  const gameObjects = processGameObjects(currentLevel.objects);

  // ========== SCENE SETUP ==========
  const { cellSize, scale } = useGameSceneSetup(
    gridCols,
    gridRows,
    BASE_CELL_SIZE,
  );

  // ========== CORE GAME LOGIC HOOKS ==========
  const interactables = useInteractables(gameObjects);
  const {
    activatedSwitches,
    openedDoors,
    handleSwitchActivation,
    handlePortalEnter: handlePortalEnterBase,
  } = interactables;

  const animationState = useAnimationSystem(
    gameObjects,
    activatedSwitches,
    openedDoors,
    isMobile,
  );

  const {
    objectFrames,
    buttonAnimationFrames,
    doorAnimationFrames,
    completedDoors,
  } = animationState;

  const health = useHealthSystem();
  const { playerHealth, setPlayerHealth, heartFlickerState } = health;

  const debug = useDebugFeatures();
  const { showGrid, setShowGrid, showHitbox, setShowHitbox } = debug;

  // ========== STATE & REFS ==========
  const [characterPos, setCharacterPos] = useState({ x: 0, y: 0 });

  const characterRef = useRef<{
    takeDamage: (amount: number) => void;
    teleportTo: (x: number, y: number) => void;
  }>(null);

  const goblinRefsRef = useRef<Record<string, GoblinHandle>>({});
  const [defeatedGoblins, setDefeatedGoblins] = useState(new Set<string>());
  const [goblinHitCounts, setGoblinHitCounts] = useState<Record<string, number>>(
    {},
  );
  const [_goblinInGracePeriod] = useState(new Set<string>());
  const [collectedItems, setCollectedItems] = useState(new Set<string>());

  // ========== RENDERING LAYERS ==========
  const gridLayer = useGridDebugLayer(
    gridCols,
    gridRows,
    cellSize,
    showGrid,
    isMobile,
  );

  const hitboxLayer = useHitboxDebugLayer(
    gameObjects,
    cellSize,
    showHitbox,
  );

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

  const healthUILayer = useHealthUI(
    playerHealth,
    heartFlickerState,
    cellSize,
  );

  // ========== EVENT HANDLERS ==========

  const handlePortalEnterWithRef = useCallback(
    (charX: number, charY: number) => {
      handlePortalEnterBase(
        charX,
        charY,
        cellSize,
        characterRef,
      );
    },
    [cellSize, handlePortalEnterBase],
  );

  const handleHealthChange = useCallback(
    (health: number) => {
      setPlayerHealth(health);
    },
    [setPlayerHealth],
  );

  const handleDeath = useCallback(() => {
    // Player died - any World-level cleanup can go here
  }, []);

  const handlePositionChange = useCallback((x: number, y: number) => {
    setCharacterPos({ x, y });
  }, []);

  const handlePunch = useCallback(
    (
      punchX: number,
      punchY: number,
      punchWidth: number,
      punchHeight: number,
    ) => {
      if (!currentLevel.npcs) return;

      for (const npc of currentLevel.npcs) {
        if (npc.type === 'goblin') {
          const goblinRef = goblinRefsRef.current[npc.id];

          if (!goblinRef) continue;

          const goblinPos = goblinRef.getPosition?.();

          if (!goblinPos) continue;

          const punchCollides =
            punchX < goblinPos.x + goblinPos.width &&
            punchX + punchWidth > goblinPos.x &&
            punchY < goblinPos.y + goblinPos.height &&
            punchY + punchHeight > goblinPos.y;

          if (punchCollides) {
            setGoblinHitCounts((prev) => {
              const newCount = Math.min(
                (prev[npc.id] ?? 0) + 1,
                1,
              );

              if (newCount >= 1) {
                setDefeatedGoblins(
                  (prevDefeated) =>
                    new Set([...prevDefeated, npc.id]),
                );
              }

              return {
                ...prev,
                [npc.id]: newCount,
              };
            });
          }
        }
      }
    },
    [currentLevel.npcs],
  );

  const handleGoblinAttack = useCallback(() => {
    if (characterRef.current) {
      characterRef.current.takeDamage(1.5);
    }
  }, []);

  const handleCollectItem = useCallback((itemAddress: string) => {
    setCollectedItems(
      (prev) => new Set([...prev, itemAddress]),
    );
  }, []);

  const handleGoblinMount = useCallback(
    (goblinId: string, goblinRef: GoblinHandle) => {
      goblinRefsRef.current[goblinId] = goblinRef;
    },
    [],
  );

  return (
    <>
      <RotateDeviceScreen />

      <div
        className="w-screen h-screen overflow-hidden flex items-start justify-center relative"
        style={{
          backgroundImage: currentLevel.background
            ? `url(${currentLevel.background})`
            : undefined,
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

        <div
          className="relative"
          style={{
            width: gridCols * cellSize,
            height: gridRows * cellSize,
          }}
        >
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
          {cellSize > 0 &&
            currentLevel.npcs &&
            currentLevel.npcs.map((npc) => {
              if (npc.type === 'goblin') {
                return (
                  <Goblin
                    key={npc.id}
                    id={npc.id}
                    address={npc.address}
                    cellSize={cellSize}
                    gridWidth={gridCols}
                    gridHeight={gridRows}
                    gameObjects={gameObjects}
                    openedDoors={openedDoors}
                    characterX={characterPos.x}
                    characterY={characterPos.y}
                    characterWidth={
                      characterRef.current
                        ? 48 * scale * 0.95
                        : 0
                    }
                    characterHeight={
                      characterRef.current
                        ? 48 * scale * 0.95
                        : 0
                    }
                    scale={scale}
                    showHitbox={showHitbox}
                    isDefeated={defeatedGoblins.has(npc.id)}
                    isPlayerDead={playerHealth <= 0}
                    hitCount={goblinHitCounts[npc.id] ?? 0}
                    isInGracePeriod={_goblinInGracePeriod.has(
                      npc.id,
                    )}
                    onAttackHit={handleGoblinAttack}
                    onMount={handleGoblinMount}
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

        {/* Responsive Contacts Popup Overlay (Compact on mobile, original large size on desktop) */}
        <section className="inventory-section absolute inset-0 z-[99999] flex items-center justify-center p-4 md:p-0 pointer-events-none">
          
          {/* Popup Card */}
          <div className="relative z-10 w-[240px] md:w-[460px] bg-[#120822] border border-[#480385]/60 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-[0_0_20px_rgba(72,3,133,0.3)] md:shadow-[0_0_40px_rgba(72,3,133,0.4)] text-center flex flex-col items-center space-y-2 md:space-y-5 pointer-events-auto">
            
            {/* Title */}
            <div className="space-y-0.5 md:space-y-1.5">
              <h2 className="text-sm md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 via-purple-200 to-[#480385] bg-clip-text text-transparent">
                Nick's Contacts
              </h2>
            </div>

            {/* Prominent Email Display */}
            <div className="w-full py-1.5 px-2 md:py-1 md:px-4 text-purple-200 font-mono text-[9.5px] md:text-lg font-bold tracking-tight shadow-inner select-all break-all">
              nickshahbaz135@gmail.com
            </div>

            {/* Email Me Button */}
            <a
              href="mailto:nickshahbaz135@gmail.com"
              className="w-full py-1.5 px-2 md:py-3 md:px-4 rounded-lg font-medium text-[10px] md:text-base text-white bg-gradient-to-r from-[#480385] to-[#6b0ab9] hover:from-[#5804a1] hover:to-[#7c0cd4] transition-all duration-300 shadow-[0_0_10px_rgba(72,3,133,0.5)] flex items-center justify-center space-x-1 md:space-x-2 group"
            >
              <span>Email Me!</span>
              <svg className="w-3 h-3 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>

            {/* Social Links Section */}
            <div className="pt-2 md:pt-4 border-t border-purple-900/40 w-full flex flex-col items-center space-y-1.5 md:space-y-3">
              <span className="text-[8px] md:text-xs uppercase tracking-widest text-gray-400 font-semibold">
                Socials
              </span>
              <div className="flex space-x-6 md:space-x-8 items-center justify-center">
                
                {/* X (Twitter) */}
                <a
                  href="https://x.com/Shazzz135"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  
                >
                  <svg className="w-5 h-5 md:w-8 md:h-8 " viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/nick-shahbaz-b258b8241/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"                >
                  <svg className="w-5 h-5 md:w-8 md:h-8 " viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com/Shazzz135"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5 md:w-8 md:h-8 " viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>

              </div>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}