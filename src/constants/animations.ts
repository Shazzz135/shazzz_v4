/**
 * Animation frame definitions and metadata
 * Contains sprite paths and animation playback speeds for all character states
 */

import idle1 from '../assets/character/idle/idle1.svg';
import idle2 from '../assets/character/idle/idle2.svg';
import running1 from '../assets/character/running/running1.svg';
import running2 from '../assets/character/running/running2.svg';
import running3 from '../assets/character/running/running3.svg';
import running4 from '../assets/character/running/running4.svg';
import jumping1 from '../assets/character/jumping/jumping1.svg';
import jumping2 from '../assets/character/jumping/jumping2.svg';
import punching1 from '../assets/character/punching/punching1.svg';
import punching2 from '../assets/character/punching/punching2.svg';
import prone1 from '../assets/character/prone/prone1.svg';
import prone2 from '../assets/character/prone/prone2.svg';
import crystal1 from '../assets/platforms/crystal/crystal1.svg';
import crystal2 from '../assets/platforms/crystal/crystal2.svg';
import crystal3 from '../assets/platforms/crystal/crystal3.svg';
import crystal4 from '../assets/platforms/crystal/crystal4.svg';
import coin1 from '../assets/objects/coin/coin1.svg';
import coin2 from '../assets/objects/coin/coin2.svg';

export type AnimationState = 'idle' | 'running' | 'jumping' | 'punching' | 'prone';

export const CHARACTER_WIDTH = 48;
export const CHARACTER_HEIGHT = 48;

export interface AnimationFrames {
  idle: string[];
  running: string[];
  jumping: string[];
  punching: string[];
  prone: string[];
}

// Frame sequences for each animation state
export const ANIMATION_FRAMES: AnimationFrames = {
  idle: [idle1, idle2],
  running: [running1, running2, running3, running4],
  jumping: [jumping1, jumping2],
  punching: [punching1, punching2, punching1],
  prone: [prone1, prone2],
} as const;

export const ANIMATION_SPEED: Record<AnimationState, number> = {
  idle: 10,
  running: 6,
  jumping: 3,
  punching: 5,
  prone: 2,
};

// Object animations
export const OBJECT_ANIMATIONS = {
  crystal: {
    frames: [crystal1, crystal2, crystal3, crystal4],
    speed: 20,
  },
  coin: {
    frames: [coin1, coin2],
    speed: 25,
  },
} as const;
