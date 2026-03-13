# Hitbox Reference Guide

This document contains all hitbox configurations for game objects in the Shazzz sandbox level.

## Terrain & Blocks

### Grass Full
- **ID**: `grass_full`
- **Hitbox**: `{ x: 0, y: 0, width: 32, height: 32 }`
- **Type**: Solid collision
- **Collectible**: No

### Grass Half
- **ID**: `grass_half`
- **Hitbox**: `{ x: 0, y: 0, width: 32, height: 32 }`
- **Type**: Solid collision
- **Collectible**: No

### Stone Full
- **ID**: `stone_full`
- **Hitbox**: `{ x: 0, y: 0, width: 32, height: 32 }`
- **Type**: Solid collision
- **Collectible**: No

### Stone Half
- **ID**: `stone_half`
- **Hitbox**: `{ x: 0, y: 0, width: 32, height: 32 }`
- **Type**: Solid collision
- **Collectible**: No

## Obstacles

### Crystals (All)
- **IDs**: `crystal_1`, `crystal_2`, `crystal_3`, `crystal_4`
- **Hitbox**: `{ x: 6.4, y: 0, width: 19.2, height: 16 }`
- **Notes**: 
  - Collision area is top 50% of cell (top 16px)
  - Centered horizontally (middle 60% width)
  - Does NOT block movement, character can walk through
- **Type**: Solid collision
- **Collectible**: No

## Collectibles

### Coins (Both)
- **IDs**: `coin_1`, `coin_2`
- **Hitbox**: `{ x: 6.4, y: 6.4, width: 19.2, height: 19.2 }`
- **Notes**:
  - 60% of cell size (19.2px × 19.2px)
  - Perfectly centered in the cell
  - Smaller hitbox than sprite in all directions
  - Does NOT block movement, pass through
- **Type**: Collectible (no collision)
- **Collectible**: Yes

## Hazards

### Spikes
- **ID**: `spikes`
- **Hitbox**: `{ x: 0, y: 22.4, width: 32, height: 9.6 }`
- **Notes**:
  - Damage area is bottom 30% of cell (bottom 9.6px)
  - Full width damage zone
  - Does NOT block movement, pass through
  - Deals 0.5 damage (half heart) on contact
  - 3 second cooldown between hits
  - Character flickers during hit (300ms)
  - 3 second invulnerability period
- **Type**: Damage (no collision)
- **Collectible**: Yes

## Character Hitbox (Standing States: idle, running, jumping, punching)
- **Width**: 20px
- **Height**: 44px
- **OffsetX**: 10
- **OffsetY**: 4
- **Notes**:
  - Applied with 0.95 scale factor in rendering
  - Actual collision hitbox = `(width * scale * 0.95) × (height * scale * 0.95)`

### Character Hitbox (Prone State)
- **Width**: 40px
- **Height**: 16px
- **OffsetX**: 4
- **OffsetY**: 20
- **Notes**:
  - Lower profile when lying down
  - Full width collision area

## Grid System
- **Cell Size**: 32px × 32px
- **Grid Dimensions**: 30 columns × 16 rows
- **Total Grid Size**: 960px × 512px (at 32px base scale)

## Notes on Hitbox Calculations
- All hitbox `x` and `y` values are relative to the grid cell origin (0,0)
- Hitbox coordinates are applied as offset from cell position:
  - `hitbox.x` is horizontal offset into the cell
  - `hitbox.y` is vertical offset into the cell
  - `hitbox.width` and `hitbox.height` define the collision area size
- Example: Crystal at grid position (288px, 0px) with hitbox `{x: 6.4, y: 0, width: 19.2, height: 16}` has actual collision bounds:
  - Left: 288 + 6.4 = 294.4px
  - Top: 0 + 0 = 0px
  - Right: 294.4 + 19.2 = 313.6px
  - Bottom: 0 + 16 = 16px
