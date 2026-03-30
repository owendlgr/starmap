# UI Verification & Alignment Prompt for Claude Code

You are auditing and correcting the StarMap application's UI to match the design language of **worldmonitor.app**. This document contains the exact design specifications extracted directly from the live site. Every component in StarMap must conform to these rules. Audit every file in `components/` and `app/`, compare against these specs, and fix any deviation.

---

## 1. GLOBAL FOUNDATION

### Color System (exact RGB values)

```
/* BACKGROUNDS — darkest to lightest */
--bg-body:            rgb(10, 10, 10);      /* #0A0A0A — page body, panels */
--bg-header:          rgb(20, 20, 20);      /* #141414 — header bar, map area */
--bg-elevated:        rgb(26, 26, 26);      /* #1A1A1A — raised surfaces, cards */
--bg-subtle:          rgba(255, 255, 255, 0.03);  /* very faint lift on dark surfaces */
--bg-subtle-hover:    rgba(255, 255, 255, 0.05);  /* hover states on dark bg */
--bg-toolbar:         rgba(0, 0, 0, 0.3);         /* semi-transparent bottom panels */
--bg-border:          rgb(42, 42, 42);      /* #2A2A2A — used as subtle surface AND border color */
--bg-muted:           rgb(68, 68, 68);      /* #444444 — disabled/muted surfaces */

/* TEXT COLORS */
--text-primary:       rgb(232, 232, 232);   /* #E8E8E8 — primary body text */
--text-secondary:     rgb(136, 136, 136);   /* #888888 — secondary/muted text */
--text-tertiary:      rgb(85, 85, 85);      /* #555555 — very muted labels */
--text-disabled:      rgb(68, 68, 68);      /* #444444 — disabled text */
--text-inverse:       rgb(10, 10, 10);      /* #0A0A0A — text on bright backgrounds */

/* ACCENT — GREEN (primary brand accent) */
--accent-green:       rgb(68, 255, 136);    /* #44FF88 — live indicators, active states, primary accent */
--accent-green-muted: rgb(45, 138, 110);    /* #2D8A6E — secondary green, muted active */
--accent-green-bg:    rgba(68, 255, 136, 0.1);   /* green tinted background */
--accent-green-border:rgba(74, 222, 128, 0.2);   /* green tinted border */

/* ACCENT — RED (alerts, danger) */
--accent-red:         rgb(255, 68, 68);     /* #FF4444 — alerts, danger, high priority */
--accent-red-bg:      rgba(255, 59, 48, 0.3);    /* red tinted background */

/* ACCENT — ORANGE (warnings, elevated) */
--accent-orange:      rgb(255, 170, 0);     /* #FFAA00 — warnings, elevated status */
--accent-orange-bg:   rgba(255, 149, 0, 0.3);    /* orange tinted background */

/* ACCENT — BLUE (links, selected) */
--accent-blue:        rgb(59, 130, 246);    /* #3B82F6 — links, active selection */

/* BORDERS */
--border-default:     rgb(42, 42, 42);      /* #2A2A2A — standard panel/element borders */
--border-muted:       rgb(136, 136, 136);   /* #888888 — on some interactive elements */
```

### Typography

```
/* FONT FAMILY — monospace stack, SF Mono primary */
font-family: "SF Mono", Monaco, "Cascadia Code", "Fira Code", "DejaVu Sans Mono", "Liberation Mono", Menlo, Consolas, monospace;

/* THE ENTIRE SITE USES A MONOSPACE FONT. This is non-negotiable. */

/* SIZES */
--font-xs:    9px;    /* legend text, fine print */
--font-sm:    10px;   /* section headers (uppercase), footer text */
--font-base:  12px;   /* body text, buttons, inputs, nav items — this is the DEFAULT */
--font-md:    13px;   /* some button text */
--font-lg:    14px;   /* prominent labels */
--font-xl:    16px;   /* logo/brand "MONITOR" text */

/* IMPORTANT: The base font size is 12px. Do NOT use 14px or 16px as body default. */

/* TRANSFORMS */
/* Section headers and labels use: */
text-transform: uppercase;
letter-spacing: 1px;
font-size: 10px;
/* Example: "LAYERS", "GLOBAL SITUATION", "LIVE NEWS", "LIVE WEBCAMS" */

/* The brand name "MONITOR" uses: */
font-size: 16px;
font-weight: 700;
letter-spacing: 2-3px;
text-transform: uppercase;
```

---

## 2. LAYOUT STRUCTURE

The app is a **single-viewport, no-scroll** layout. Everything fits within `100vw x 100vh`.

```
┌─────────────────────────────────────────────────────┐
│  HEADER BAR (40px height, full width)               │
├─────────────────────────────────────────────────────┤
│  STATUS BAR / SUBHEADER (thin strip, ~24px)         │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  LAYER   │         MAIN CANVAS / MAP                │
│  PANEL   │         (fills remaining space)          │
│  (180px) │                                          │
│  float   │                              ┌──────┐   │
│  over    │                              │CTRLS │   │
│  map     │                              │+/−/⌂ │   │
│          │                              └──────┘   │
│          │  ┌──────── LEGEND BAR ──────────────┐   │
├──────────┴──┴──────────────────────────────────┴───┤
│  BOTTOM LEFT PANEL      │  BOTTOM RIGHT PANEL      │
│  (e.g., data feed)      │  (e.g., secondary data)  │
├─────────────────────────┴──────────────────────────┤
│  FOOTER (thin, ~30px)                              │
└────────────────────────────────────────────────────┘
```

### Key Layout Rules

- **Full viewport**: `width: 100vw; height: 100vh; overflow: hidden;`
- **Main container**: `display: flex; flex-direction: column;`
- **No scrolling on body** — all content is within viewport
- **Map/canvas fills all remaining vertical space** between header and bottom panels
- **Layer panel floats over the map** — `position: absolute; z-index: 100;`
- **Bottom panels split horizontally** — left and right, separated by thin border
- **Controls (zoom +/−, home) float** on the right edge of the map

---

## 3. HEADER BAR (exact spec)

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 8px 16px;
  background: rgb(20, 20, 20);         /* --bg-header */
  border-bottom: 1px solid rgb(42, 42, 42);  /* --border-default */
  font-size: 12px;
  color: rgb(232, 232, 232);           /* --text-primary */
}
```

### Header Left Section (`display: flex; gap: 16px; align-items: center;`)
Contains:
1. **Page navigation icons** — small icon buttons (globe, layers, map, etc.), ~24x24px, no visible border, icon-only
2. **Active page indicator** — the active icon gets a green pill/badge behind it: `background: rgb(45, 138, 110); border-radius: 10px; color: white; padding: 2px 8px;` with label text like "WORLD"
3. **Brand text** — "MONITOR" in `font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;`
4. **Version label** — "v2.6.5" in `color: rgb(136, 136, 136);` (muted)
5. **Live indicator** — green dot `●` in `color: rgb(68, 255, 136);` followed by "LIVE" text

### Header Right Section (`display: flex; gap: 12px; align-items: center;`)
Contains:
1. **Status badges** — colored pill badges (e.g., "DEFCON 5") with colored background
2. **Notification counter** — red-orange badge with number
3. **Search** — `⌘K Search` button with border
4. **Link/Share button**
5. **Fullscreen toggle** — icon button
6. **Settings gear** — icon button

### Header Button Styling
```css
/* Icon buttons (no text) */
.header-icon-btn {
  background: transparent;
  border: none;
  color: rgb(136, 136, 136);   /* muted gray */
  padding: 4px;
  cursor: pointer;
  font-size: 13px;
}
.header-icon-btn:hover {
  color: rgb(232, 232, 232);   /* brighten on hover */
}

/* Bordered buttons (Search, Link) */
.header-bordered-btn {
  background: transparent;
  border: 1px solid rgb(42, 42, 42);
  border-radius: 4px;
  color: rgb(136, 136, 136);
  padding: 4px 10px;
  font-size: 12px;
  font-family: inherit;  /* monospace */
}

/* Active page pill */
.header-active-page {
  background: rgb(45, 138, 110);
  border-radius: 10px;
  color: white;
  padding: 2px 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## 4. STATUS BAR / SUBHEADER

A thin horizontal strip below the header showing contextual status.

```css
.status-bar {
  background: rgba(255, 255, 255, 0.05);  /* very subtle lift */
  padding: 4px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgb(136, 136, 136);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

Contains:
- **Left**: Context label (e.g., "GLOBAL SITUATION")
- **Center**: Timestamp in uppercase monospace: `"MON, 30 MAR 2026 21:52:46 UTC"`
- **Right**: View toggle — two adjacent buttons "2D" and "3D"

### 2D/3D View Toggle
```css
.view-toggle-btn {
  padding: 2px 8px;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid rgb(42, 42, 42);
  cursor: pointer;
}
.view-toggle-btn.active {
  background: rgb(59, 130, 246);  /* --accent-blue */
  color: white;
  border-color: rgb(59, 130, 246);
}
.view-toggle-btn.inactive {
  background: transparent;
  color: rgb(136, 136, 136);
}
```

---

## 5. LAYER / FILTER PANEL (floating over map)

```css
.layer-panel {
  position: absolute;
  top: 10px;    /* offset from map top */
  left: 10px;   /* offset from map left */
  width: 180px;
  max-height: 300px;
  overflow-y: auto;
  background: rgb(10, 10, 10);          /* --bg-body */
  border: 1px solid rgb(42, 42, 42);    /* --border-default */
  border-radius: 4px;
  z-index: 100;
  font-size: 12px;
}
```

### Panel Header
```css
.layer-panel-header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgb(136, 136, 136);   /* muted header text */
  border-bottom: 1px solid rgb(42, 42, 42);
}
```

Contains: "LAYERS" label, help icon "?", collapse chevron "▼"

### Search Input
```css
.layer-search {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgb(42, 42, 42);
  border-radius: 3px;
  color: rgb(232, 232, 232);
  padding: 5px 8px;
  font-size: 11px;
  font-family: inherit;  /* monospace */
  margin: 6px;
}
.layer-search::placeholder {
  color: rgb(85, 85, 85);
}
```

### Layer Toggle Items
```css
.layer-toggle-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.layer-toggle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgb(232, 232, 232);
}
.layer-toggle-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
```

### Checkbox (custom)
```css
/* Green filled square when checked */
.layer-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgb(42, 42, 42);
  display: flex;
  align-items: center;
  justify-content: center;
}
.layer-checkbox.checked {
  background: rgb(45, 138, 110);   /* muted green */
  border-color: rgb(45, 138, 110);
}
/* Checkmark is white "✓" inside */
```

---

## 6. MAP CONTROLS (floating right side)

```css
.map-controls {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
}

.map-control-btn {
  width: 32px;
  height: 32px;
  background: rgb(20, 20, 20);
  border: 1px solid rgb(42, 42, 42);
  color: rgb(232, 232, 232);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-control-btn:hover {
  background: rgb(42, 42, 42);
}
```

Contains: `+` (zoom in), `−` (zoom out), `⌂` (reset/home view)

---

## 7. LEGEND BAR (bottom of map area)

```css
.legend-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 12px;
  background: rgb(10, 10, 10);
  border: 1px solid rgb(42, 42, 42);
  border-radius: 0;
  font-size: 9px;
  color: rgb(136, 136, 136);
  height: 22px;
}
```

Contains: "LEGEND" label + colored dots with labels (e.g., `● High Alert  ● Elevated  ● Monitoring`)

---

## 8. BOTTOM PANELS (split left/right)

Two panels sitting below the map, separated by a vertical border.

```css
.bottom-panels {
  display: flex;
  border-top: 1px solid rgb(42, 42, 42);
  height: ~120px;  /* approximate, adapts to content */
}

.bottom-panel {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);  /* semi-transparent */
  border-right: 1px solid rgb(42, 42, 42);  /* divider between panels */
}
```

### Panel Toolbar (inside each bottom panel)
```css
.bottom-panel-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  gap: 8px;
  border-bottom: 1px solid rgb(42, 42, 42);
}
```

Contains:
- **Title**: uppercase, bold — e.g., "LIVE NEWS" or "LIVE WEBCAMS"
- **Live count**: red/green dot + number (e.g., `● 93`) — dot is accent color, number is white
- **Tab buttons**: horizontal row of category filters

### Tab Buttons (inside bottom panels)
```css
.tab-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-family: inherit;  /* monospace */
  text-transform: uppercase;
  border: 1px solid rgb(42, 42, 42);
  background: transparent;
  color: rgb(232, 232, 232);
  cursor: pointer;
}
.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}
.tab-btn.active {
  background: rgb(255, 68, 68);  /* red for highlighted/active */
  border-color: rgb(255, 68, 68);
  color: white;
}
```

---

## 9. FOOTER

```css
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 10px;
  color: rgb(68, 68, 68);   /* very muted */
  background: rgb(10, 10, 10);
  border-top: 1px solid rgb(42, 42, 42);
}
```

- **Left**: Brand name + version (e.g., "WORLD MONITOR V2.6.5 · @HANDLE")
- **Center/Right**: Links (Pro, Blog, Docs, Status, GitHub, Discord, X, Download App) in `color: rgb(68, 68, 68)` — no underlines, space-separated

---

## 10. SIDEBAR / DETAIL PANEL (when item selected)

When a data point is clicked, a sidebar slides in from the right:

```css
.detail-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 430px;
  height: 100vh;
  background: rgb(10, 10, 10);
  border-left: 1px solid rgb(42, 42, 42);
  z-index: 5000;
  overflow-y: auto;
  padding: 16px;
}
```

---

## 11. GLOBAL PATTERNS TO ENFORCE

### Borders
- **Every panel, card, and section boundary** uses `1px solid rgb(42, 42, 42)` — the SINGLE border style
- Border radius is minimal: `0px` for full-width elements, `3-4px` for floating panels and buttons
- **No thick borders. No colored borders.** Only `#2A2A2A` borders except for green/red accent states

### Spacing
- Padding inside panels: `6px 8px` (compact) to `8px 16px` (header)
- Gap between items: `2px` (tight lists), `8px` (toolbar items), `12-16px` (header sections)
- **Everything is compact and dense** — no large whitespace gaps

### Hover States
- Background brightens to `rgba(255, 255, 255, 0.05)` on dark backgrounds
- Text color shifts from `rgb(136, 136, 136)` → `rgb(232, 232, 232)` (gray to light)
- **No color change animations longer than 150ms**
- Cursor: `pointer` on all interactive elements

### Active/Selected States
- Active tabs/pills: `background: rgb(45, 138, 110)` (green) or `rgb(59, 130, 246)` (blue) or `rgb(255, 68, 68)` (red) depending on context
- Active layer toggles: green checkbox fill
- Active nav item: green pill badge

### Scrollbars (if any)
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgb(42, 42, 42); border-radius: 2px; }
```

### Transitions
```css
/* All interactive state changes */
transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
```

---

## 12. ADAPTATION FOR STARMAP

When applying these specs to StarMap's pages (Star Map, Planets, Galaxy Map, Earth/Missions), adapt as follows:

| WorldMonitor Element       | StarMap Equivalent                        |
|---------------------------|-------------------------------------------|
| Map (Mapbox/WebGL canvas) | Three.js canvas (Stars, Planets, Galaxies)|
| Layer toggles panel       | Data filter panel (star types, magnitude ranges, constellation toggles, etc.) |
| Header nav icons          | Page navigation (Star Map, Planets, Galaxies, Missions) |
| "GLOBAL SITUATION"        | Page-specific context label (e.g., "STAR MAP", "SOLAR SYSTEM", "GALAXY MAP") |
| Legend bar                 | Star type legend / planet legend / galaxy type legend |
| Bottom panels             | Data feed panels (recent selections, stats, search results) |
| Detail sidebar            | Star/Planet/Galaxy info sidebar (SidePanel.tsx) |
| 2D/3D toggle              | Keep as-is for star map; adapt for perspective modes |
| Live indicator            | Data source indicator (e.g., "● HIPPARCOS" "● GAIA DR3") |
| Zoom +/−/home controls    | Camera zoom/reset controls for Three.js |

---

## 13. VERIFICATION CHECKLIST

After applying these specs, verify each item:

- [ ] `body` background is `rgb(10, 10, 10)`, NOT pure black `#000`
- [ ] ALL text uses the monospace font stack (`"SF Mono", Monaco, ...`)
- [ ] Base font size is `12px`, NOT `14px` or `16px`
- [ ] Header is exactly `40px` tall with `rgb(20, 20, 20)` background
- [ ] ALL borders are `1px solid rgb(42, 42, 42)` — no other border color for structural dividers
- [ ] Layer/filter panel floats over the canvas at `top: 10px; left: 10px;` with `width: 180px`
- [ ] Section headers (LAYERS, LIVE NEWS, etc.) are `10px uppercase letter-spacing: 1px`
- [ ] No large whitespace — the UI is dense and compact
- [ ] Bottom panels use `rgba(0, 0, 0, 0.3)` semi-transparent background
- [ ] Tab buttons inside panels have `1px solid #2A2A2A` border with uppercase text
- [ ] Active green accent is `rgb(68, 255, 136)` — NOT a CSS green or emerald
- [ ] Footer text is `10px` in `rgb(68, 68, 68)` — very muted
- [ ] Sidebar detail panel is `430px` wide, slides from right, `z-index: 5000`
- [ ] Hover states use `rgba(255, 255, 255, 0.05)` background lift
- [ ] Map/canvas controls (zoom, home) are `32px` square buttons on the right edge
- [ ] No border-radius greater than `4px` anywhere except pill badges (`border-radius: 10px`)
- [ ] Layout is `100vh` with no body scroll — all panels fit within viewport
- [ ] Scrollbars are thin (`4px`) and styled `rgb(42, 42, 42)` on transparent
- [ ] Brand name in header is `16px bold uppercase` with wide letter-spacing
- [ ] The overall feel is: DARK, DENSE, MONOSPACE, DATA-FIRST, MINIMAL — like a terminal dashboard

---

## EXECUTION INSTRUCTIONS

1. Read every component file in `components/` and every page in `app/`
2. Create or update `app/globals.css` with the CSS custom properties from Section 1
3. Update `tailwind.config.js` (or equivalent) to use these exact color values
4. Audit and fix each component against the specs above
5. Ensure the layout structure matches Section 2 exactly
6. Run through the Section 13 checklist and fix any failures
7. Run `npm run build` to verify no errors
