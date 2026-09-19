import { useRef, useState } from 'react';
import { dungeonLevel } from '../data/hubData';
import { processGameObjects } from '../utils/processGameObjects';
import Character from '../components/Character';
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

export default function World() {
  // ========== GRID CONFIGURATION ==========
  const gridCols = 30;
  const gridRows = 16;
  const BASE_CELL_SIZE = 32;
  const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ========== LEVEL DATA ==========
  const currentLevel = dungeonLevel; // Hub only uses dungeon level
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
  const { showGrid, setShowGrid, showHitbox } = debug;

  // ========== STATE & REFS ==========
  const [characterPos, setCharacterPos] = useState({ x: 0, y: 0 });
  const characterRef = useRef<{ takeDamage: (amount: number) => void; teleportTo: (x: number, y: number) => void }>(null);

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
  );
  const healthUILayer = useHealthUI(playerHealth, heartFlickerState, cellSize);

  // ========== EVENT HANDLERS ==========

  const handlePortalEnterWithRef = (charX: number, charY: number) => {
    handlePortalEnterBase(charX, charY, cellSize, characterRef);
  };

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
        {/* Grid Toggle Button */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="absolute top-4 right-4 z-10 px-3 py-2 rounded font-bold text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>

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
              onHealthChange={(health) => setPlayerHealth(health)}
              onDeath={() => {
                // Player died - any World-level cleanup can go here
              }}
              onButtonPress={handleSwitchActivation}
              openedDoors={openedDoors}
              showHitbox={showHitbox}
              onPositionChange={(x, y) => {
                setCharacterPos({ x, y });
              }}
              onPunch={() => {
                // Punch detection can be implemented here if needed in future
              }}
              onPortalEnter={handlePortalEnterWithRef}
            />
          )}
        </div>

        {/* Health UI Display */}
        {healthUILayer}

        {/* Mobile Controls */}
        <MobileControls />
      </div>
    </>
  );
}
