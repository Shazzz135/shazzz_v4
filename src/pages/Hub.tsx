import { useState, useEffect, useRef } from 'react';
import { dungeonLevel } from '../data/hubData';
import { sandboxLevel } from '../data/sandboxData';
import { processGameObjects } from '../utils/processGameObjects';
import type { NPC } from '../types/NPC';
import Character from '../components/Character';
import { CHARACTER_WIDTH, CHARACTER_HEIGHT } from '../constants/animations';
import Goblin from '../components/Goblin';
import MobileControls from '../components/MobileControls';
import RotateDeviceScreen from '../components/RotateDeviceScreen';
import BlockObject from '../objects/BlockObject';
import AnimatedObject from '../objects/AnimatedObject';
import InputObject from '../objects/InputObject';
import OutputObject from '../objects/OutputObject';
import TextObject from '../objects/TextObject';
import { UI_OBJECTS } from '../objects/definitions';
import {
  useAnimationSystem,
  useInteractables,
  useCharacterCombat,
  useHealthSystem,
  useDebugFeatures,
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

  // ========== STATE ==========
  const [cellSize, setCellSize] = useState(0);
  const [activeDataset, setActiveDataset] = useState<'levelSelect' | 'sandbox'>('levelSelect');
  const [characterX, setCharacterX] = useState(0);
  const [characterY, setCharacterY] = useState(0);

  void setActiveDataset; // Kept for future use

  const currentLevel = activeDataset === 'levelSelect' ? dungeonLevel : sandboxLevel;
  const gameObjects = processGameObjects(currentLevel.objects);

  // ========== HOOKS - Organize by concern ==========
  // Must declare hooks before using their return values
  const interactables = useInteractables(gameObjects);
  const { activatedSwitches, openedDoors } = interactables;
  
  const animationState = useAnimationSystem(gameObjects, activatedSwitches, openedDoors, isMobile);
  const combat = useCharacterCombat(gameObjects, currentLevel.npcs, isMobile);
  const health = useHealthSystem();
  const debug = useDebugFeatures();

  const { handleSwitchActivation, handlePortalEnter: handlePortalEnterBase } = interactables;
  const { objectFrames, buttonAnimationFrames, doorAnimationFrames, completedDoors } = animationState;
  const { playerHealth, setPlayerHealth, heartFlickerState } = health;
  const { showGrid, setShowGrid, showHitbox } = debug;
  const { goblinRefsRef, goblinHitCounts, goblinInGracePeriod, defeatedGoblins, handlePunch } = combat;

  const scale = cellSize > 0 ? cellSize / BASE_CELL_SIZE : 1;
  const characterRef = useRef<{ takeDamage: (amount: number) => void; teleportTo: (x: number, y: number) => void }>(null);


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
  }, []);

  const handleGoblinAttack = () => {
    characterRef.current?.takeDamage(1);
  };

  const handlePunchWrapper = (punchX: number, punchY: number, punchWidth: number, punchHeight: number) => {
    handlePunch(punchX, punchY, punchWidth, punchHeight, characterX);
  };

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
        {cellSize > 0 && (
          <div className="absolute inset-0">
            {gameObjects.map((obj) => {
              return obj.address.map((addr) => {
                const key = `${obj.id}-${addr}`;
                const frameIndex = objectFrames[key] ?? 0;

                // Render appropriate component based on object type
                switch (obj.type) {
                  case 'block':
                    return (
                      <BlockObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'animated':
                    return (
                      <AnimatedObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        frameIndex={frameIndex}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'portal':
                    return (
                      <AnimatedObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        frameIndex={frameIndex}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'input':
                    return (
                      <InputObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        isActivated={activatedSwitches.has(obj.id)}
                        frameIndex={buttonAnimationFrames[key] ?? 0}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'output':
                    return (
                      <OutputObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        isActivated={openedDoors.has(obj.id)}
                        frameIndex={doorAnimationFrames[key] ?? 0}
                        isCompleted={completedDoors.has(obj.id)}
                        showHitbox={showHitbox}
                      />
                    );
                  case 'text':
                    return (
                      <TextObject
                        key={key}
                        object={obj}
                        address={addr}
                        cellSize={cellSize}
                        playerX={characterX}
                        playerY={characterY}
                        showHitbox={showHitbox}
                      />
                    );
                  default:
                    return null;
                }
              });
            })}
          </div>
        )}

        {/* Grid Layer - disabled on mobile for performance */}
        {cellSize > 0 && showGrid && !isMobile && (
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
        )}

        {/* Debug Layer - Hitboxes */}
        {cellSize > 0 && showHitbox && (
          <svg
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            {/* Object hitboxes */}
            {gameObjects.map((obj) =>
              obj.address.map((addr) => {
                const cleanAddr = addr.endsWith('R') ? addr.slice(0, -1) : addr;
                const rowLetter = cleanAddr.charCodeAt(0);
                const gridY = (rowLetter - 65) * cellSize;
                const gridX = (parseInt(cleanAddr.substring(1)) - 1) * cellSize;

                // Scale hitbox to match current cellSize (hitboxes defined at 32px base)
                const HITBOX_BASE_SIZE = 32;
                const scaleFactor = cellSize / HITBOX_BASE_SIZE;
                const scaledWidth = obj.hitbox.width * scaleFactor;
                const scaledHeight = obj.hitbox.height * scaleFactor;
                const scaledOffsetX = obj.hitbox.x * scaleFactor;
                const scaledOffsetY = obj.hitbox.y * scaleFactor;

                const hitboxX = gridX + scaledOffsetX;
                const hitboxY = gridY + scaledOffsetY;

                return (
                  <rect
                    key={`${obj.id}-${addr}`}
                    x={hitboxX}
                    y={hitboxY}
                    width={scaledWidth}
                    height={scaledHeight}
                    fill="none"
                    stroke={obj.isCollectible ? '#00FF00' : '#FF0000'}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                );
              })
            )}
          </svg>
        )}

        {/* Character Layer */}
        {cellSize > 0 && (
          <>
            {/* Render NPCs */}
            {currentLevel.npcs?.map((npc: NPC) => {
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
                    characterWidth={CHARACTER_WIDTH * scale}
                    characterHeight={CHARACTER_HEIGHT * scale}
                    scale={scale}
                    showHitbox={showHitbox}
                    isDefeated={defeatedGoblins.has(npc.id)}
                    isPlayerDead={playerHealth <= 0}
                    hitCount={goblinHitCounts[npc.id] ?? 0}
                    isInGracePeriod={goblinInGracePeriod.has(npc.id)}
                    onAttackHit={handleGoblinAttack}
                  />
                );
              }
              return null;
            })}

            {/* Render Player Character */}
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
                // Character component already handles death animation and input lockout
              }}
              onButtonPress={handleSwitchActivation}
              openedDoors={openedDoors}
              showHitbox={showHitbox}
              onPositionChange={(x, y) => {
                setCharacterX(x);
                setCharacterY(y);
              }}
              onPunch={handlePunchWrapper}
              onPortalEnter={handlePortalEnterWithRef}
            />
          </>
        )}
      </div>

      {/* Player Health Display - 3 Hearts at A1x2, A4x2, A7x2 (dies right to left) */}
      {cellSize > 0 && (
        <div className="absolute top-0 left-0 z-20 flex gap-2" style={{ padding: `${cellSize * 0.5}px` }}>
          {/* Heart 1 (A1x2) - Leftmost, dies last - represents 0-1 health */}
          <div style={{ width: cellSize * 2, height: cellSize * 2 }}>
            <img
              src={playerHealth >= 1 ? UI_OBJECTS.heartFull.img : playerHealth >= 0.5 ? UI_OBJECTS.heartHalf.img : UI_OBJECTS.heartEmpty.img}
              alt="Heart 1"
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: heartFlickerState ? 1 : 0.3, transition: 'opacity 0.05s' }}
            />
          </div>
          {/* Heart 2 (A4x2) - Middle - represents 1-2 health */}
          <div style={{ width: cellSize * 2, height: cellSize * 2 }}>
            <img
              src={playerHealth >= 2 ? UI_OBJECTS.heartFull.img : playerHealth >= 1.5 ? UI_OBJECTS.heartHalf.img : UI_OBJECTS.heartEmpty.img}
              alt="Heart 2"
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: heartFlickerState ? 1 : 0.3, transition: 'opacity 0.05s' }}
            />
          </div>
          {/* Heart 3 (A7x2) - Rightmost, dies first - represents 2-3 health */}
          <div style={{ width: cellSize * 2, height: cellSize * 2 }}>
            <img
              src={playerHealth >= 3 ? UI_OBJECTS.heartFull.img : playerHealth >= 2.5 ? UI_OBJECTS.heartHalf.img : UI_OBJECTS.heartEmpty.img}
              alt="Heart 3"
              style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: heartFlickerState ? 1 : 0.3, transition: 'opacity 0.05s' }}
            />
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileControls />
    </div>
    </>
  );
}
