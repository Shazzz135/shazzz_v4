import type { GameObject } from '../types/GameObject';
import BlockObject from '../objects/BlockObject';
import AnimatedObject from '../objects/AnimatedObject';
import InputObject from '../objects/InputObject';
import OutputObject from '../objects/OutputObject';
import TextObject from '../objects/TextObject';

/**
 * Game Objects Layer Hook
 * Renders all game objects (blocks, animated, portals, inputs, outputs, text)
 */

export function useGameObjectsLayer(
  gameObjects: GameObject[],
  cellSize: number,
  objectFrames: Record<string, number>,
  buttonAnimationFrames: Record<string, number>,
  doorAnimationFrames: Record<string, number>,
  completedDoors: Set<string>,
  activatedSwitches: Set<string>,
  openedDoors: Set<string>,
  characterX: number,
  characterY: number,
  showHitbox: boolean,
) {
  if (cellSize <= 0) {
    return null;
  }

  return (
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
  );
}
