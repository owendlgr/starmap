export interface Star {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  mag: number;
  bv: number;
  spectral: string;
  type: string;
  ra: number;
  dec: number;
  dist_pc: number;
  size: number;
  color: [number, number, number];
  catalog: string;
  hip: number;
}

export interface StarChunk {
  count: number;
  stars: Star[];
}

export interface SearchEntry {
  id: number;
  name: string;
  type: string;
  mag: number;
  dist_pc: number;
}

export type ScaleUnit = 'pc' | 'ly' | 'au';
export type InteractionMode = 'explore' | 'measure';
export type Layer = 'stars' | 'galaxies' | 'nebulae' | 'clusters';
