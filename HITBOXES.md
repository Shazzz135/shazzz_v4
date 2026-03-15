# Hitbox Reference

This document outlines the hitbox specifications for all game objects. All measurements are in pixels at the base 32px cell size.

## Format

```
hitbox: { x, y, width, height }
```

- **x**: Horizontal offset from cell left edge
- **y**: Vertical offset from cell top edge
- **width**: Hitbox width in pixels
- **height**: Hitbox height in pixels

---

## Input Objects (Buttons/Switches)

All buttons are positioned at the **bottom center** of their grid cell.

| Object | Hitbox | Layout |
|--------|--------|--------|
| Blue Button | `{ x: 8, y: 16, width: 16, height: 16 }` | Bottom center (50% width/height) |
| Green Button | `{ x: 8, y: 16, width: 16, height: 16 }` | Bottom center (50% width/height) |
| Red Button | `{ x: 8, y: 16, width: 16, height: 16 }` | Bottom center (50% width/height) |

### Button Hitbox Visualization

```
┌────────────────┐
│                │  (0px, 0px) - top left
│                │
│                │  16px tall
│    ┌──────┐    │
│    │HITBOX│    │  (8px, 16px) - 16x16 box
│    └──────┘    │
│                │
└────────────────┘
     (32px)
```

---

## Output Objects (Trapdoors/Doors)

All doors are positioned at the **left side** taking up the left 50% of the grid cell.

| Object | Hitbox | Layout |
|--------|--------|--------|
| Blue Trapdoor | `{ x: 0, y: 0, width: 16, height: 32 }` | Left 50% (full height) |
| Green Trapdoor | `{ x: 0, y: 0, width: 16, height: 32 }` | Left 50% (full height) |
| Red Trapdoor | `{ x: 0, y: 0, width: 16, height: 32 }` | Left 50% (full height) |

### Door Hitbox Visualization

```
┌────────────────┐
│█████│          │  (0px, 0px) - top left
│█████│          │
│█████│ HITBOX   │  32px tall
│█████│ 16x32    │
│█████│          │
│█████│          │
└────────────────┘
  (16px)  (32px)
```

---

## Block Objects

All static blocks use full-cell hitboxes.

| Object | Hitbox |
|--------|--------|
| Grass Full | `{ x: 0, y: 0, width: 32, height: 32 }` |
| Grass Half | `{ x: 0, y: 0, width: 32, height: 32 }` |
| Stone Full | `{ x: 0, y: 0, width: 32, height: 32 }` |
| Stone Half | `{ x: 0, y: 0, width: 32, height: 32 }` |

---

## Animated Objects

| Object | Hitbox |
|--------|--------|
| Coin | `{ x: 0, y: 0, width: 32, height: 32 }` |
| Crystal | `{ x: 0, y: 0, width: 32, height: 32 }` |

---

## Notes

- Hitboxes are defined at the 32px base cell size
- At runtime, hitboxes are scaled proportionally with cellSize: `scaleFactor = cellSize / 32`
- Buttons can be pressed when the character's hitbox overlaps the button hitbox
- Doors block movement when closed; hitboxes are ignored when the door is open
