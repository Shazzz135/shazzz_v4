import { useState, useEffect, useRef } from 'react';
import type { GameObject } from '../types/GameObject';

/**
 * Animation System Hook
 * Manages all object animations: regular animated objects, button animations, and door animations
 * Automatically initializes and coordinates animations when switches/doors are activated
 */

interface AnimationSystemState {
  objectFrames: Record<string, number>;
  buttonAnimationFrames: Record<string, number>;
  doorAnimationFrames: Record<string, number>;
  completedDoors: Set<string>;
  doorAnimationDirection: Record<string, 'forward' | 'backward'>;
  buttonAnimationDirection: Record<string, 'forward' | 'backward'>;
}

export function useAnimationSystem(
  gameObjects: GameObject[],
  activatedSwitches: Set<string>,
  openedDoors: Set<string>,
  isMobile: boolean,
) {
  const ANIMATION_TICK_RATE = isMobile ? 32 : 16; // 30 FPS on mobile, 60 FPS on desktop
  const animationTickRef = useRef(0);

  const [state, setState] = useState<AnimationSystemState>({
    objectFrames: {},
    buttonAnimationFrames: {},
    doorAnimationFrames: {},
    completedDoors: new Set(),
    doorAnimationDirection: {},
    buttonAnimationDirection: {},
  });

  // Animation loop for all objects
  useEffect(() => {
    const animationLoop = setInterval(() => {
      animationTickRef.current += 1;

      const newFrames: Record<string, number> = {};
      const newButtonFrames: Record<string, number> = {};
      const newDoorFrames: Record<string, number> = {};
      const newCompletedDoors = new Set(state.completedDoors);
      const newButtonDirection: Record<string, 'forward' | 'backward'> = { ...state.buttonAnimationDirection };
      const newDoorDir: Record<string, 'forward' | 'backward' | null> = { ...state.doorAnimationDirection };

      // Check for button/door state changes and initialize animations
      gameObjects.forEach((obj) => {
        if (obj.type === 'input' && obj.animation) {
          const isActive = activatedSwitches.has(obj.id);
          const wasActive = state.buttonAnimationDirection[obj.id] === 'forward' || 
                           Object.keys(state.buttonAnimationFrames).some(key => 
                             key.startsWith(`${obj.id}-`) && state.buttonAnimationFrames[key] > 0
                           );

          // If state changed, initialize frames
          if (isActive !== wasActive) {
            const frameCount = obj.animation.frames.length;
            const maxFrame = frameCount - 1;

            obj.address.forEach((addr) => {
              const key = `${obj.id}-${addr}`;
              if (isActive) {
                newButtonFrames[key] = 0;
                newButtonDirection[obj.id] = 'forward';
              } else {
                newButtonFrames[key] = maxFrame;
                newButtonDirection[obj.id] = 'backward';
              }
            });
          }
        }

        if (obj.type === 'output' && obj.animation) {
          const isOpen = openedDoors.has(obj.id);
          const wasOpen = Object.keys(state.doorAnimationFrames).some(key => 
            key.startsWith(`${obj.id}-`) && state.doorAnimationFrames[key] > 0
          );

          // If state changed, initialize frames
          if (isOpen !== wasOpen) {
            const frameCount = obj.animation.frames.length;
            const maxFrame = frameCount - 1;

            obj.address.forEach((addr) => {
              const key = `${obj.id}-${addr}`;
              if (isOpen) {
                newDoorFrames[key] = 0;
                delete newDoorDir[obj.id];
              } else {
                newDoorFrames[key] = maxFrame;
                newDoorDir[obj.id] = 'backward';
              }
            });

            if (isOpen) {
              newCompletedDoors.delete(obj.id);
            }
          }
        }
      });

      gameObjects.forEach((obj) => {
        if (obj.animation) {
          obj.address.forEach((addr) => {
            const key = `${obj.id}-${addr}`;

            if (obj.type === 'input') {
              // Handle button animation
              if (activatedSwitches.has(obj.id)) {
                const currentFrame = state.buttonAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                const frameCount = obj.animation!.frames.length;
                const maxFrame = frameCount - 1;

                if (animationTickRef.current % animSpeed === 0 && currentFrame < maxFrame) {
                  newButtonFrames[key] = currentFrame + 1;
                } else {
                  newButtonFrames[key] = currentFrame;
                }
              } else if (state.buttonAnimationDirection[obj.id] === 'backward') {
                // Button deactivating - animate backward
                const currentFrame = state.buttonAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;

                if (animationTickRef.current % animSpeed === 0 && currentFrame > 0) {
                  newButtonFrames[key] = currentFrame - 1;
                } else if (currentFrame === 0) {
                  delete newButtonDirection[obj.id];
                  newButtonFrames[key] = 0;
                } else {
                  newButtonFrames[key] = currentFrame;
                }
              } else {
                newButtonFrames[key] = 0;
              }
            } else if (obj.type === 'output') {
              // Handle door animation
              if (openedDoors.has(obj.id) && !state.completedDoors.has(obj.id)) {
                // Door is opening
                const currentFrame = state.doorAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;
                const frameCount = obj.animation!.frames.length;

                if (animationTickRef.current % animSpeed === 0 && currentFrame < frameCount - 1) {
                  newDoorFrames[key] = currentFrame + 1;
                } else if (currentFrame === frameCount - 1) {
                  newCompletedDoors.add(obj.id);
                  newDoorFrames[key] = currentFrame;
                } else {
                  newDoorFrames[key] = currentFrame;
                }
              } else if (state.doorAnimationDirection[obj.id] === 'backward') {
                // Door is closing - animate backward
                const currentFrame = state.doorAnimationFrames[key] ?? 0;
                const animSpeed = obj.animation!.speed;

                if (animationTickRef.current % animSpeed === 0 && currentFrame > 0) {
                  newDoorFrames[key] = currentFrame - 1;
                } else if (currentFrame === 0) {
                  delete newDoorDir[obj.id];
                  newDoorFrames[key] = 0;
                } else {
                  newDoorFrames[key] = currentFrame;
                }
              }
            } else {
              // Regular animated objects
              const currentFrame = state.objectFrames[key] ?? 0;
              const animSpeed = obj.animation!.speed;
              const frameCount = obj.animation!.frames.length;

              if (animationTickRef.current % animSpeed === 0) {
                newFrames[key] = (currentFrame + 1) % frameCount;
              } else {
                newFrames[key] = currentFrame;
              }
            }
          });
        }
      });

      // Only update state if there are changes
      setState((prev) => ({
        ...prev,
        objectFrames: Object.keys(newFrames).length > 0 ? { ...prev.objectFrames, ...newFrames } : prev.objectFrames,
        buttonAnimationFrames: Object.keys(newButtonFrames).length > 0 ? { ...prev.buttonAnimationFrames, ...newButtonFrames } : prev.buttonAnimationFrames,
        doorAnimationFrames: Object.keys(newDoorFrames).length > 0 ? { ...prev.doorAnimationFrames, ...newDoorFrames } : prev.doorAnimationFrames,
        completedDoors: newCompletedDoors.size > prev.completedDoors.size ? newCompletedDoors : prev.completedDoors,
        buttonAnimationDirection: Object.keys(newButtonDirection).length > 0 ? newButtonDirection : prev.buttonAnimationDirection,
        doorAnimationDirection: Object.fromEntries(
          Object.entries(newDoorDir).filter(([, v]) => v !== null && v !== undefined)
        ) as Record<string, 'forward' | 'backward'>,
      }));
    }, ANIMATION_TICK_RATE);

    return () => clearInterval(animationLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameObjects, activatedSwitches, openedDoors]);

  return state;
}
