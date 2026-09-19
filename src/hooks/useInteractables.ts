import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameObject } from '../types/GameObject';

/**
 * Interactables Hook
 * Manages all interactive object logic: switches/buttons, doors, and portals
 * Handles activation/deactivation and coordination between linked objects
 * Animation coordination is handled by the animation system which watches these states
 */

interface CharacterRef {
  takeDamage: (amount: number, source: string) => void;
  teleportTo: (x: number, y: number) => void;
}

export function useInteractables(gameObjects: GameObject[]) {
  const navigate = useNavigate();
  const [activatedSwitches, setActivatedSwitches] = useState<Set<string>>(new Set());
  const [openedDoors, setOpenedDoors] = useState<Set<string>>(new Set());
  const [portalTeleporting, setPortalTeleporting] = useState(false);

  /**
   * Handle switch/button activation or deactivation
   * The animation system automatically watches activatedSwitches and updates animations
   */
  const handleSwitchActivation = useCallback(
    (switchObjectId: string) => {
      const switchObj = gameObjects.find((obj) => obj.id === switchObjectId);
      if (!switchObj) return;

      if (activatedSwitches.has(switchObjectId)) {
        // Deactivate button and close linked door
        setActivatedSwitches((prev) => {
          const newSet = new Set(prev);
          newSet.delete(switchObjectId);
          return newSet;
        });

        if (switchObj.linkedObjectId) {
          setOpenedDoors((prev) => {
            const newSet = new Set(prev);
            newSet.delete(switchObj.linkedObjectId!);
            return newSet;
          });
        }
      } else {
        // Activate button and open linked door
        setActivatedSwitches((prev) => {
          const newSet = new Set(prev);
          newSet.add(switchObjectId);
          return newSet;
        });

        if (switchObj.linkedObjectId) {
          setOpenedDoors((prev) => {
            const newSet = new Set(prev);
            newSet.add(switchObj.linkedObjectId!);
            return newSet;
          });
        }
      }
    },
    [gameObjects, activatedSwitches],
  );

  /**
   * Handle portal interaction
   * Supports page navigation via action property
   */
  const handlePortalEnter = useCallback(
    (charX: number, charY: number, cellSize: number, characterRef: React.MutableRefObject<CharacterRef | null>) => {
      if (portalTeleporting) return;

      const charCol = Math.floor(charX / cellSize);
      const charRow = Math.floor(charY / cellSize);
      const charAddress = String.fromCharCode(65 + charRow) + (charCol + 1);

      console.log(`PORTAL: E pressed at ${charAddress}`);

      const portal = gameObjects.find((obj) => {
        if (obj.type !== 'portal') return false;
        return obj.address.some((addr) => addr.startsWith(charAddress));
      });

      if (!portal) {
        console.log(`PORTAL: No portal at ${charAddress}`);
        return;
      }

      // Handle page navigation action
      if (portal.action?.type === 'navigate') {
        console.log(`PORTAL: Navigating to ${portal.action.path}`);
        setPortalTeleporting(true);
        navigate(portal.action.path);
        return;
      }

      // Handle destination address teleportation
      if (portal.destinationAddress && characterRef.current) {
        console.log(`PORTAL: Teleporting to ${portal.destinationAddress}`);
        setPortalTeleporting(true);

        const destRow = portal.destinationAddress.charCodeAt(0) - 65;
        const destCol = parseInt(portal.destinationAddress.substring(1)) - 1;
        const destX = destCol * cellSize;
        const destY = destRow * cellSize;

        setTimeout(() => {
          characterRef.current?.teleportTo(destX, destY);
          setPortalTeleporting(false);
        }, 300);
        return;
      }

      console.log('PORTAL: No action or destination defined');
    },
    [gameObjects, portalTeleporting, navigate],
  );

  return {
    activatedSwitches,
    openedDoors,
    portalTeleporting,
    setPortalTeleporting,
    handleSwitchActivation,
    handlePortalEnter,
  };
}
