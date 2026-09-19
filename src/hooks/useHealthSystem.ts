import { useState, useEffect, useRef } from 'react';

/**
 * Health System Hook
 * Manages player health, damage, and heart flicker animation
 */

export function useHealthSystem() {
  const [playerHealth, setPlayerHealth] = useState(3); // 3 hearts max
  const [heartFlickerState, setHeartFlickerState] = useState(true);

  const lastPlayerHealthRef = useRef(3);
  const flickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const invulnerabilityCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartInvulnerabilityEndRef = useRef<number | null>(null);

  // Manage heart flicker when player takes damage
  useEffect(() => {
    if (playerHealth < lastPlayerHealthRef.current) {
      // Player took damage
      lastPlayerHealthRef.current = playerHealth;

      // Clear existing intervals
      if (flickerIntervalRef.current) clearInterval(flickerIntervalRef.current);
      if (invulnerabilityCheckIntervalRef.current) clearInterval(invulnerabilityCheckIntervalRef.current);

      heartInvulnerabilityEndRef.current = Date.now() + 3000; // 3 second immunity

      // Start flicker animation - initial state set deferred
      queueMicrotask(() => {
        setHeartFlickerState(false);
      });

      flickerIntervalRef.current = setInterval(() => {
        setHeartFlickerState((prev) => !prev);
      }, 200);

      invulnerabilityCheckIntervalRef.current = setInterval(() => {
        if (heartInvulnerabilityEndRef.current && Date.now() >= heartInvulnerabilityEndRef.current) {
          setHeartFlickerState(true);
          heartInvulnerabilityEndRef.current = null;

          if (flickerIntervalRef.current) clearInterval(flickerIntervalRef.current);
          if (invulnerabilityCheckIntervalRef.current) clearInterval(invulnerabilityCheckIntervalRef.current);
          flickerIntervalRef.current = null;
          invulnerabilityCheckIntervalRef.current = null;
        }
      }, 50);
    } else if (playerHealth > lastPlayerHealthRef.current) {
      lastPlayerHealthRef.current = playerHealth;
    }
  }, [playerHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flickerIntervalRef.current) clearInterval(flickerIntervalRef.current);
      if (invulnerabilityCheckIntervalRef.current) clearInterval(invulnerabilityCheckIntervalRef.current);
    };
  }, []);

  return {
    playerHealth,
    setPlayerHealth,
    heartFlickerState,
  };
}
