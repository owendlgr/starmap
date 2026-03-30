# Claude Code Configuration - StarMap

## Behavioral Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files over creating new ones
- NEVER proactively create documentation files unless explicitly requested
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## Project Architecture

- **Framework**: Next.js 14 (App Router)
- **3D Engine**: Three.js via custom components
- **State**: Zustand store (`lib/useStore.ts`)
- **Data**: Hipparcos catalog + NASA exoplanets + Gaia DR3
- **Structure**: `app/` (pages/API), `components/` (React/Three.js), `lib/` (utils/store), `data/` (star catalogs), `scripts/` (Python data pipelines)

## Build & Test

```bash
npm run dev        # Development
npm run build      # Production build
npm run lint       # Lint
npm run generate-data    # Regenerate star catalog (Python)
npm run fetch-gaia       # Fetch Gaia DR3 data (Python)
```

## Key Components

- `StarMap.tsx` — Main 3D scene orchestrator
- `StarField.tsx` — Point cloud rendering for stars
- `GaiaField.tsx` — Gaia DR3 star rendering
- `ExoplanetHostField.tsx` — NASA exoplanet host star markers
- `ConstellationLines.tsx` — IAU constellation line drawings
- `SidePanel.tsx` — Star info panel
- `NavBar.tsx` — Top navigation
- `useStore.ts` — Zustand state (camera, selection, filters, mode)

## Conventions

- Components are in `components/` (flat, no nesting)
- Types in `lib/types.ts`
- Coordinate math in `lib/coordinates.ts`
- All star data is pre-generated — do not modify `data/` files directly
- Supports 2D bird's-eye and 3D perspective modes
