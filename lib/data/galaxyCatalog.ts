import type { GalaxyData, GalaxyType } from '../types';

/**
 * Nearby Galaxy Catalog -- expanded from 38 Messier galaxies to ~200 galaxies
 * covering the Local Group and Local Volume (within ~20 Mpc).
 *
 * Sources:
 *   - Karachentsev et al. 2013, "Updated Nearby Galaxy Catalog" (neargalcat)
 *   - NASA/IPAC Extragalactic Database (NED)
 *   - SEDS Messier catalog
 *   - McConnachie 2012, "The Observed Properties of Dwarf Galaxies"
 *
 * RA/Dec in J2000 degrees, distance in Mpc, magnitude = apparent visual,
 * majorAxis/minorAxis in arcminutes, radialVelocity in km/s,
 * absMagnitude = absolute B magnitude, stellarMass = log10(M/Msun).
 */

// ─── Categorize morphological type ──────────────────────────────────────────

export function categorizeType(morph: string | undefined): GalaxyType {
  if (!morph) return 'unknown';
  const m = morph.trim().toUpperCase();
  // Check lenticular before spiral (S0 starts with S)
  if (m.startsWith('S0') || m.startsWith('SB0') || m.includes('S0'))
    return 'lenticular';
  if (m.startsWith('S') || m.startsWith('SA') || m.startsWith('SB'))
    return 'spiral';
  if (m.startsWith('E') || m.startsWith('CD')) return 'elliptical';
  if (m.includes('IR') || m.includes('IM') || m.includes('IBM'))
    return 'irregular';
  if (
    m.includes('DSPH') ||
    m.includes('DEN') ||
    m.includes('DE') ||
    m.includes('DTRANS') ||
    m.includes('DIRR')
  )
    return 'dwarf';
  return 'unknown';
}

// ─── Galaxy data ────────────────────────────────────────────────────────────

export const GALAXIES: GalaxyData[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL GROUP -- Milky Way satellites (< 0.3 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lmc', name: 'Large Magellanic Cloud', altName: 'LMC',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m',
    ra: 80.8942, dec: -69.7561, distanceMpc: 0.050,
    magnitude: 0.9, absMagnitude: -18.1, majorAxis: 645, minorAxis: 550,
    constellation: 'Dorado', radialVelocity: 278, stellarMass: 9.3,
  },
  {
    id: 'smc', name: 'Small Magellanic Cloud', altName: 'SMC / NGC 292',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m pec',
    ra: 13.1867, dec: -72.8286, distanceMpc: 0.063,
    magnitude: 2.7, absMagnitude: -16.8, majorAxis: 320, minorAxis: 185,
    constellation: 'Tucana', radialVelocity: 158, stellarMass: 8.9,
  },
  {
    id: 'sgr-dwarf', name: 'Sagittarius Dwarf Elliptical',
    altName: 'Sgr dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 283.8313, dec: -30.5453, distanceMpc: 0.024,
    magnitude: 4.5, absMagnitude: -13.5, majorAxis: 450,
    constellation: 'Sagittarius', radialVelocity: 140,
  },
  {
    id: 'ursa-minor-dwarf', name: 'Ursa Minor Dwarf',
    altName: 'UMi dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 227.2854, dec: 67.2225, distanceMpc: 0.076,
    magnitude: 11.9, absMagnitude: -8.8, majorAxis: 30.2,
    constellation: 'Ursa Minor', radialVelocity: -247,
  },
  {
    id: 'draco-dwarf', name: 'Draco Dwarf',
    altName: 'Draco dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 260.0517, dec: 57.9153, distanceMpc: 0.076,
    magnitude: 10.9, absMagnitude: -8.8, majorAxis: 35.5,
    constellation: 'Draco', radialVelocity: -292,
  },
  {
    id: 'carina-dwarf', name: 'Carina Dwarf',
    altName: 'Carina dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 100.4029, dec: -50.9661, distanceMpc: 0.106,
    magnitude: 11.3, absMagnitude: -9.1, majorAxis: 23.4,
    constellation: 'Carina', radialVelocity: 229,
  },
  {
    id: 'sextans-dwarf', name: 'Sextans Dwarf',
    altName: 'Sextans dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 153.2625, dec: -1.6147, distanceMpc: 0.086,
    magnitude: 12.0, absMagnitude: -9.3, majorAxis: 30.0,
    constellation: 'Sextans', radialVelocity: 224,
  },
  {
    id: 'sculptor-dwarf', name: 'Sculptor Dwarf',
    altName: 'Sculptor dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 15.0392, dec: -33.7089, distanceMpc: 0.086,
    magnitude: 10.1, absMagnitude: -11.1, majorAxis: 39.8,
    constellation: 'Sculptor', radialVelocity: 110,
  },
  {
    id: 'fornax-dwarf', name: 'Fornax Dwarf',
    altName: 'Fornax dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 39.9971, dec: -34.4492, distanceMpc: 0.147,
    magnitude: 9.3, absMagnitude: -13.4, majorAxis: 19.6,
    constellation: 'Fornax', radialVelocity: 53,
  },
  {
    id: 'leo-i', name: 'Leo I',
    altName: 'Leo I / DDO 74',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dE3',
    ra: 152.1171, dec: 12.3064, distanceMpc: 0.254,
    magnitude: 11.2, absMagnitude: -12.0, majorAxis: 9.8,
    constellation: 'Leo', radialVelocity: 287,
  },
  {
    id: 'leo-ii', name: 'Leo II',
    altName: 'Leo II / DDO 93',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dE0',
    ra: 168.3700, dec: 22.1517, distanceMpc: 0.233,
    magnitude: 12.6, absMagnitude: -9.8, majorAxis: 9.8,
    constellation: 'Leo', radialVelocity: 79,
  },
  {
    id: 'phoenix-dwarf', name: 'Phoenix Dwarf',
    altName: 'Phoenix dIrr/dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dTrans',
    ra: 27.7763, dec: -44.4442, distanceMpc: 0.415,
    magnitude: 13.1, absMagnitude: -9.9, majorAxis: 4.9,
    constellation: 'Phoenix', radialVelocity: -13,
  },
  {
    id: 'tucana-dwarf', name: 'Tucana Dwarf',
    altName: 'Tucana dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 340.4567, dec: -64.4194, distanceMpc: 0.887,
    magnitude: 15.7, absMagnitude: -9.5, majorAxis: 2.9,
    constellation: 'Tucana', radialVelocity: 194,
  },
  {
    id: 'cetus-dwarf', name: 'Cetus Dwarf',
    altName: 'Cetus dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 6.5488, dec: -11.0444, distanceMpc: 0.775,
    magnitude: 14.4, absMagnitude: -11.2, majorAxis: 3.2,
    constellation: 'Cetus', radialVelocity: -87,
  },
  {
    id: 'leo-a', name: 'Leo A',
    altName: 'Leo A / DDO 69',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 149.8604, dec: 30.7464, distanceMpc: 0.798,
    magnitude: 12.9, absMagnitude: -12.1, majorAxis: 5.1,
    constellation: 'Leo', radialVelocity: 24,
  },
  {
    id: 'can-ven-i', name: 'Canes Venatici I Dwarf',
    altName: 'CVn I dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 202.0142, dec: 33.5558, distanceMpc: 0.218,
    magnitude: 13.9, absMagnitude: -8.6, majorAxis: 8.9,
    constellation: 'Canes Venatici', radialVelocity: 31,
  },
  {
    id: 'bootes-i', name: 'Bootes I Dwarf',
    altName: 'Boo I',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 210.025, dec: 14.5, distanceMpc: 0.066,
    magnitude: 13.1, absMagnitude: -6.3, majorAxis: 12.6,
    constellation: 'Bootes', radialVelocity: 99,
  },
  {
    id: 'hercules-dwarf', name: 'Hercules Dwarf',
    altName: 'Her dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 247.7583, dec: 12.7917, distanceMpc: 0.132,
    magnitude: 14.7, absMagnitude: -6.6, majorAxis: 8.6,
    constellation: 'Hercules', radialVelocity: 45,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL GROUP -- M31 (Andromeda) and satellites
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm31', name: 'Andromeda Galaxy', altName: 'M31 / NGC 224',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)b',
    ra: 10.6847, dec: 41.2687, distanceMpc: 0.778,
    magnitude: 3.44, absMagnitude: -21.2, majorAxis: 190, minorAxis: 60,
    constellation: 'Andromeda', radialVelocity: -301, stellarMass: 10.8,
  },
  {
    id: 'm32', name: 'M32', altName: 'M32 / NGC 221',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'cE2',
    ra: 10.6742, dec: 40.8652, distanceMpc: 0.805,
    magnitude: 8.08, absMagnitude: -16.5, majorAxis: 8.7, minorAxis: 6.5,
    constellation: 'Andromeda', radialVelocity: -200, stellarMass: 8.9,
  },
  {
    id: 'm110', name: 'NGC 205', altName: 'M110 / NGC 205',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E5 pec',
    ra: 10.0917, dec: 41.6853, distanceMpc: 0.824,
    magnitude: 8.07, absMagnitude: -16.5, majorAxis: 21.9, minorAxis: 11.0,
    constellation: 'Andromeda', radialVelocity: -241,
  },
  {
    id: 'ngc185', name: 'NGC 185', altName: 'NGC 185',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dE3 pec',
    ra: 9.7415, dec: 48.3372, distanceMpc: 0.617,
    magnitude: 9.2, absMagnitude: -15.5, majorAxis: 11.7, minorAxis: 10.0,
    constellation: 'Cassiopeia', radialVelocity: -202,
  },
  {
    id: 'ngc147', name: 'NGC 147', altName: 'NGC 147 / DDO 3',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dE5',
    ra: 8.3004, dec: 48.5075, distanceMpc: 0.676,
    magnitude: 9.5, absMagnitude: -15.1, majorAxis: 13.2, minorAxis: 7.8,
    constellation: 'Cassiopeia', radialVelocity: -193,
  },
  {
    id: 'and-i', name: 'Andromeda I',
    altName: 'And I',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 11.4250, dec: 38.0328, distanceMpc: 0.745,
    magnitude: 13.6, absMagnitude: -11.7, majorAxis: 2.5,
    constellation: 'Andromeda', radialVelocity: -380,
  },
  {
    id: 'and-ii', name: 'Andromeda II',
    altName: 'And II',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 19.1292, dec: 33.4208, distanceMpc: 0.652,
    magnitude: 13.5, absMagnitude: -12.4, majorAxis: 3.6,
    constellation: 'Andromeda', radialVelocity: -188,
  },
  {
    id: 'and-iii', name: 'Andromeda III',
    altName: 'And III',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 8.8500, dec: 36.4992, distanceMpc: 0.749,
    magnitude: 14.2, absMagnitude: -10.2, majorAxis: 1.5,
    constellation: 'Andromeda', radialVelocity: -351,
  },
  {
    id: 'and-v', name: 'Andromeda V',
    altName: 'And V',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 17.5750, dec: 47.6281, distanceMpc: 0.810,
    magnitude: 15.9, absMagnitude: -9.1, majorAxis: 1.4,
    constellation: 'Andromeda', radialVelocity: -403,
  },
  {
    id: 'and-vi', name: 'Andromeda VI',
    altName: 'And VI / Peg dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 357.9442, dec: 24.5878, distanceMpc: 0.775,
    magnitude: 14.5, absMagnitude: -11.3, majorAxis: 2.8,
    constellation: 'Pegasus', radialVelocity: -354,
  },
  {
    id: 'and-vii', name: 'Andromeda VII',
    altName: 'And VII / Cas dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 351.6292, dec: 50.6814, distanceMpc: 0.762,
    magnitude: 13.7, absMagnitude: -12.0, majorAxis: 3.5,
    constellation: 'Cassiopeia', radialVelocity: -307,
  },
  {
    id: 'ic10', name: 'IC 10',
    altName: 'IC 10',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIrr',
    ra: 5.0988, dec: 59.2942, distanceMpc: 0.794,
    magnitude: 11.8, absMagnitude: -16.3, majorAxis: 6.8, minorAxis: 5.9,
    constellation: 'Cassiopeia', radialVelocity: -344,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL GROUP -- other members
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm33', name: 'Triangulum Galaxy', altName: 'M33 / NGC 598',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)cd',
    ra: 23.4621, dec: 30.6602, distanceMpc: 0.840,
    magnitude: 5.72, absMagnitude: -18.8, majorAxis: 70.8, minorAxis: 41.7,
    constellation: 'Triangulum', radialVelocity: -179, stellarMass: 9.7,
  },
  {
    id: 'ic1613', name: 'IC 1613',
    altName: 'IC 1613 / DDO 8',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 16.1992, dec: 2.1178, distanceMpc: 0.727,
    magnitude: 9.9, absMagnitude: -15.2, majorAxis: 16.2, minorAxis: 14.5,
    constellation: 'Cetus', radialVelocity: -234,
  },
  {
    id: 'wlm', name: 'WLM',
    altName: 'WLM / DDO 221',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IB(s)m',
    ra: 0.4925, dec: -15.4608, distanceMpc: 0.933,
    magnitude: 11.0, absMagnitude: -14.2, majorAxis: 11.5, minorAxis: 4.0,
    constellation: 'Cetus', radialVelocity: -122,
  },
  {
    id: 'ddo210', name: 'DDO 210',
    altName: 'DDO 210 / Aquarius Dwarf',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 311.7175, dec: -12.8481, distanceMpc: 0.950,
    magnitude: 14.0, absMagnitude: -10.9, majorAxis: 2.2,
    constellation: 'Aquarius', radialVelocity: -137,
  },
  {
    id: 'peg-dirr', name: 'Pegasus Dwarf Irregular',
    altName: 'Peg DIG / DDO 216',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 352.1500, dec: 14.7328, distanceMpc: 0.919,
    magnitude: 13.2, absMagnitude: -12.3, majorAxis: 5.0, minorAxis: 2.7,
    constellation: 'Pegasus', radialVelocity: -183,
  },
  {
    id: 'ngc6822', name: 'Barnard\'s Galaxy', altName: 'NGC 6822',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IB(s)m',
    ra: 296.2358, dec: -14.7892, distanceMpc: 0.500,
    magnitude: 9.3, absMagnitude: -15.2, majorAxis: 15.5, minorAxis: 13.5,
    constellation: 'Sagittarius', radialVelocity: -57,
  },
  {
    id: 'leo-t', name: 'Leo T',
    altName: 'Leo T',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dTrans',
    ra: 143.7225, dec: 17.0514, distanceMpc: 0.417,
    magnitude: 16.0, absMagnitude: -8.0, majorAxis: 1.4,
    constellation: 'Leo', radialVelocity: 38,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IC 342 / MAFFEI GROUP (1.5-4 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'maffei1', name: 'Maffei 1',
    altName: 'Maffei 1',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E3',
    ra: 37.9467, dec: 59.6531, distanceMpc: 3.01,
    magnitude: 11.4, absMagnitude: -20.2, majorAxis: 3.4,
    constellation: 'Cassiopeia', radialVelocity: 66,
  },
  {
    id: 'maffei2', name: 'Maffei 2',
    altName: 'Maffei 2',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)bc',
    ra: 40.4758, dec: 59.6022, distanceMpc: 2.80,
    magnitude: 14.8, absMagnitude: -20.2, majorAxis: 5.8, minorAxis: 1.6,
    constellation: 'Cassiopeia', radialVelocity: -17,
  },
  {
    id: 'dwingeloo1', name: 'Dwingeloo 1',
    altName: 'Dwingeloo 1',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)cd',
    ra: 44.9046, dec: 58.9117, distanceMpc: 3.00,
    magnitude: 17.0, absMagnitude: -19.0, majorAxis: 4.2,
    constellation: 'Cassiopeia', radialVelocity: 110,
  },
  {
    id: 'ic342', name: 'IC 342',
    altName: 'IC 342',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)cd',
    ra: 56.7025, dec: 68.0964, distanceMpc: 3.28,
    magnitude: 9.1, absMagnitude: -20.7, majorAxis: 21.4, minorAxis: 20.9,
    constellation: 'Camelopardalis', radialVelocity: 31, stellarMass: 10.3,
  },
  {
    id: 'ngc2403', name: 'NGC 2403',
    altName: 'NGC 2403',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)cd',
    ra: 114.2142, dec: 65.6025, distanceMpc: 3.22,
    magnitude: 8.9, absMagnitude: -19.3, majorAxis: 21.9, minorAxis: 12.3,
    constellation: 'Camelopardalis', radialVelocity: 131, stellarMass: 9.9,
  },
  {
    id: 'ngc1560', name: 'NGC 1560',
    altName: 'NGC 1560',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)d',
    ra: 68.2400, dec: 71.8781, distanceMpc: 3.45,
    magnitude: 12.2, absMagnitude: -16.9, majorAxis: 9.8, minorAxis: 1.5,
    constellation: 'Camelopardalis', radialVelocity: -36,
  },
  {
    id: 'ugc2259', name: 'UGCA 105',
    altName: 'UGCA 105',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 76.3129, dec: 62.5828, distanceMpc: 3.39,
    magnitude: 13.9, absMagnitude: -14.0, majorAxis: 5.5,
    constellation: 'Camelopardalis', radialVelocity: 111,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M81 GROUP (3.5-4 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm81', name: "Bode's Galaxy", altName: 'M81 / NGC 3031',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)ab',
    ra: 148.8882, dec: 69.0653, distanceMpc: 3.63,
    magnitude: 6.94, absMagnitude: -20.9, majorAxis: 26.9, minorAxis: 14.1,
    constellation: 'Ursa Major', radialVelocity: -34, stellarMass: 10.8,
  },
  {
    id: 'm82', name: 'Cigar Galaxy', altName: 'M82 / NGC 3034',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'I0',
    ra: 148.9685, dec: 69.6797, distanceMpc: 3.52,
    magnitude: 8.41, absMagnitude: -19.3, majorAxis: 11.2, minorAxis: 4.3,
    constellation: 'Ursa Major', radialVelocity: 203, stellarMass: 10.3,
  },
  {
    id: 'ngc2976', name: 'NGC 2976',
    altName: 'NGC 2976',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAc pec',
    ra: 146.8142, dec: 67.9161, distanceMpc: 3.56,
    magnitude: 10.8, absMagnitude: -17.4, majorAxis: 5.9, minorAxis: 2.7,
    constellation: 'Ursa Major', radialVelocity: 3,
  },
  {
    id: 'ngc3077', name: 'NGC 3077',
    altName: 'NGC 3077',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'I0 pec',
    ra: 150.8292, dec: 68.7339, distanceMpc: 3.82,
    magnitude: 10.6, absMagnitude: -17.5, majorAxis: 5.4, minorAxis: 4.5,
    constellation: 'Ursa Major', radialVelocity: 14,
  },
  {
    id: 'ngc2366', name: 'NGC 2366',
    altName: 'NGC 2366',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IB(s)m',
    ra: 112.2300, dec: 69.2119, distanceMpc: 3.44,
    magnitude: 11.4, absMagnitude: -16.5, majorAxis: 7.3, minorAxis: 3.5,
    constellation: 'Camelopardalis', radialVelocity: 100,
  },
  {
    id: 'holmberg-ii', name: 'Holmberg II',
    altName: 'Ho II / DDO 50',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 124.7667, dec: 70.7192, distanceMpc: 3.39,
    magnitude: 11.1, absMagnitude: -16.7, majorAxis: 7.9, minorAxis: 6.3,
    constellation: 'Ursa Major', radialVelocity: 157,
  },
  {
    id: 'holmberg-ix', name: 'Holmberg IX',
    altName: 'Ho IX / DDO 66',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 149.3833, dec: 69.0458, distanceMpc: 3.70,
    magnitude: 14.3, absMagnitude: -13.7, majorAxis: 2.5,
    constellation: 'Ursa Major', radialVelocity: 46,
  },
  {
    id: 'ic2574', name: 'IC 2574',
    altName: 'IC 2574 / DDO 81',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SAB(s)m',
    ra: 157.0750, dec: 68.4111, distanceMpc: 4.02,
    magnitude: 10.8, absMagnitude: -17.4, majorAxis: 13.2, minorAxis: 5.4,
    constellation: 'Ursa Major', radialVelocity: 57,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTAURUS A GROUP (3.5-5 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngc5128', name: 'Centaurus A', altName: 'NGC 5128 / Cen A',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'S0 pec',
    ra: 201.3651, dec: -43.0192, distanceMpc: 3.68,
    magnitude: 7.84, absMagnitude: -21.1, majorAxis: 25.7, minorAxis: 20.0,
    constellation: 'Centaurus', radialVelocity: 547, stellarMass: 10.9,
  },
  {
    id: 'ngc5253', name: 'NGC 5253',
    altName: 'NGC 5253',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im pec',
    ra: 204.9833, dec: -31.6400, distanceMpc: 3.56,
    magnitude: 10.9, absMagnitude: -17.1, majorAxis: 5.0, minorAxis: 1.9,
    constellation: 'Centaurus', radialVelocity: 407,
  },
  {
    id: 'ngc5102', name: 'NGC 5102',
    altName: 'NGC 5102',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA0-',
    ra: 200.4900, dec: -36.6297, distanceMpc: 3.40,
    magnitude: 10.4, absMagnitude: -18.1, majorAxis: 8.7, minorAxis: 2.8,
    constellation: 'Centaurus', radialVelocity: 468,
  },
  {
    id: 'ngc4945', name: 'NGC 4945',
    altName: 'NGC 4945',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)cd',
    ra: 196.3642, dec: -49.4683, distanceMpc: 3.72,
    magnitude: 9.3, absMagnitude: -20.5, majorAxis: 20.0, minorAxis: 3.8,
    constellation: 'Centaurus', radialVelocity: 563,
  },
  {
    id: 'eso274-g001', name: 'ESO 274-G001',
    altName: 'ESO 274-G001',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAd',
    ra: 228.5567, dec: -46.8108, distanceMpc: 3.09,
    magnitude: 11.7, absMagnitude: -16.5, majorAxis: 10.0, minorAxis: 0.9,
    constellation: 'Norma', radialVelocity: 522,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCULPTOR GROUP (2-5 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngc253', name: 'Sculptor Galaxy', altName: 'NGC 253',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)c',
    ra: 11.8880, dec: -25.2886, distanceMpc: 3.47,
    magnitude: 8.0, absMagnitude: -20.5, majorAxis: 27.5, minorAxis: 6.8,
    constellation: 'Sculptor', radialVelocity: 243, stellarMass: 10.6,
  },
  {
    id: 'ngc55', name: 'NGC 55',
    altName: 'NGC 55',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m',
    ra: 3.7233, dec: -39.1972, distanceMpc: 2.17,
    magnitude: 8.42, absMagnitude: -18.5, majorAxis: 32.4, minorAxis: 5.6,
    constellation: 'Sculptor', radialVelocity: 129,
  },
  {
    id: 'ngc247', name: 'NGC 247',
    altName: 'NGC 247',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)d',
    ra: 11.7858, dec: -20.7606, distanceMpc: 3.65,
    magnitude: 9.7, absMagnitude: -18.2, majorAxis: 21.4, minorAxis: 6.9,
    constellation: 'Cetus', radialVelocity: 156,
  },
  {
    id: 'ngc300', name: 'NGC 300',
    altName: 'NGC 300',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)d',
    ra: 13.7225, dec: -37.6842, distanceMpc: 2.08,
    magnitude: 8.95, absMagnitude: -18.0, majorAxis: 21.9, minorAxis: 15.5,
    constellation: 'Sculptor', radialVelocity: 146,
  },
  {
    id: 'ngc7793', name: 'NGC 7793',
    altName: 'NGC 7793',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)d',
    ra: 359.4575, dec: -32.5911, distanceMpc: 3.91,
    magnitude: 9.6, absMagnitude: -18.3, majorAxis: 9.3, minorAxis: 6.3,
    constellation: 'Sculptor', radialVelocity: 227,
  },
  {
    id: 'ngc625', name: 'NGC 625',
    altName: 'NGC 625',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m',
    ra: 23.7708, dec: -41.4364, distanceMpc: 3.89,
    magnitude: 11.7, absMagnitude: -16.4, majorAxis: 5.8, minorAxis: 1.9,
    constellation: 'Phoenix', radialVelocity: 396,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M83 GROUP (4-5 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm83', name: 'Southern Pinwheel Galaxy', altName: 'M83 / NGC 5236',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)c',
    ra: 204.2538, dec: -29.8654, distanceMpc: 4.61,
    magnitude: 7.54, absMagnitude: -20.3, majorAxis: 12.9, minorAxis: 11.5,
    constellation: 'Hydra', radialVelocity: 513, stellarMass: 10.5,
  },
  {
    id: 'ngc5068', name: 'NGC 5068',
    altName: 'NGC 5068',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)d',
    ra: 199.7283, dec: -21.0386, distanceMpc: 5.20,
    magnitude: 10.5, absMagnitude: -18.1, majorAxis: 7.2, minorAxis: 6.3,
    constellation: 'Virgo', radialVelocity: 672,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M94 (CVn I) GROUP (4-5 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm94', name: "Croc's Eye Galaxy", altName: 'M94 / NGC 4736',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: '(R)SA(r)ab',
    ra: 192.7213, dec: 41.1203, distanceMpc: 4.66,
    magnitude: 8.2, absMagnitude: -19.8, majorAxis: 11.2, minorAxis: 9.1,
    constellation: 'Canes Venatici', radialVelocity: 308, stellarMass: 10.4,
  },
  {
    id: 'ngc4214', name: 'NGC 4214',
    altName: 'NGC 4214',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IAB(s)m',
    ra: 183.9133, dec: 36.3267, distanceMpc: 2.94,
    magnitude: 10.2, absMagnitude: -17.2, majorAxis: 8.5, minorAxis: 6.6,
    constellation: 'Canes Venatici', radialVelocity: 291,
  },
  {
    id: 'ngc4449', name: 'NGC 4449',
    altName: 'NGC 4449',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 187.0463, dec: 44.0936, distanceMpc: 4.21,
    magnitude: 10.0, absMagnitude: -18.1, majorAxis: 6.2, minorAxis: 4.4,
    constellation: 'Canes Venatici', radialVelocity: 207,
  },
  {
    id: 'ngc4244', name: 'NGC 4244',
    altName: 'NGC 4244',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)cd',
    ra: 184.3738, dec: 37.8072, distanceMpc: 4.37,
    magnitude: 10.4, absMagnitude: -17.7, majorAxis: 16.6, minorAxis: 1.9,
    constellation: 'Canes Venatici', radialVelocity: 244,
  },
  {
    id: 'ngc4395', name: 'NGC 4395',
    altName: 'NGC 4395',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)m',
    ra: 186.4533, dec: 33.5469, distanceMpc: 4.61,
    magnitude: 10.6, absMagnitude: -17.7, majorAxis: 13.2, minorAxis: 11.0,
    constellation: 'Canes Venatici', radialVelocity: 319,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NGC 1313 AND NEARBY IRREGULARS (4-5 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngc1313', name: 'NGC 1313',
    altName: 'NGC 1313',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)d',
    ra: 49.5638, dec: -66.4975, distanceMpc: 4.15,
    magnitude: 9.2, absMagnitude: -19.0, majorAxis: 9.1, minorAxis: 6.9,
    constellation: 'Reticulum', radialVelocity: 470,
  },
  {
    id: 'ngc1569', name: 'NGC 1569',
    altName: 'NGC 1569',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 67.7042, dec: 64.8478, distanceMpc: 3.36,
    magnitude: 11.9, absMagnitude: -18.2, majorAxis: 3.6, minorAxis: 1.8,
    constellation: 'Camelopardalis', radialVelocity: -104,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M64 AND NEARBY (5-7 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm64', name: 'Black Eye Galaxy', altName: 'M64 / NGC 4826',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: '(R)SA(rs)ab',
    ra: 194.1838, dec: 21.6828, distanceMpc: 5.30,
    magnitude: 8.5, absMagnitude: -20.0, majorAxis: 10.0, minorAxis: 5.4,
    constellation: 'Coma Berenices', radialVelocity: 408,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M101 GROUP (6-8 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm101', name: 'Pinwheel Galaxy', altName: 'M101 / NGC 5457',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)cd',
    ra: 210.8024, dec: 54.3487, distanceMpc: 6.85,
    magnitude: 7.86, absMagnitude: -21.1, majorAxis: 28.8, minorAxis: 26.9,
    constellation: 'Ursa Major', radialVelocity: 241, stellarMass: 10.5,
  },
  {
    id: 'ngc5474', name: 'NGC 5474',
    altName: 'NGC 5474',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)cd pec',
    ra: 211.2575, dec: 53.6622, distanceMpc: 6.80,
    magnitude: 11.3, absMagnitude: -17.6, majorAxis: 4.8, minorAxis: 4.3,
    constellation: 'Ursa Major', radialVelocity: 273,
  },
  {
    id: 'ngc5585', name: 'NGC 5585',
    altName: 'NGC 5585',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)d',
    ra: 214.9500, dec: 56.7283, distanceMpc: 5.70,
    magnitude: 11.2, absMagnitude: -17.5, majorAxis: 5.8, minorAxis: 3.7,
    constellation: 'Ursa Major', radialVelocity: 305,
  },
  {
    id: 'm106', name: 'NGC 4258', altName: 'M106 / NGC 4258',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)bc',
    ra: 184.7396, dec: 47.3042, distanceMpc: 7.31,
    magnitude: 8.4, absMagnitude: -20.8, majorAxis: 18.6, minorAxis: 7.2,
    constellation: 'Canes Venatici', radialVelocity: 448, stellarMass: 10.6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M51 AND M63 (8-9 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm51', name: 'Whirlpool Galaxy', altName: 'M51 / NGC 5194',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)bc pec',
    ra: 202.4696, dec: 47.1952, distanceMpc: 8.58,
    magnitude: 8.4, absMagnitude: -21.0, majorAxis: 11.2, minorAxis: 6.9,
    constellation: 'Canes Venatici', radialVelocity: 463, stellarMass: 10.6,
  },
  {
    id: 'ngc5195', name: 'NGC 5195',
    altName: 'NGC 5195 / M51b',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB0 pec',
    ra: 202.4983, dec: 47.2661, distanceMpc: 8.58,
    magnitude: 10.5, absMagnitude: -19.3, majorAxis: 5.8, minorAxis: 4.6,
    constellation: 'Canes Venatici', radialVelocity: 465,
  },
  {
    id: 'm63', name: 'Sunflower Galaxy', altName: 'M63 / NGC 5055',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(rs)bc',
    ra: 198.9554, dec: 42.0294, distanceMpc: 8.87,
    magnitude: 8.6, absMagnitude: -20.9, majorAxis: 12.6, minorAxis: 7.2,
    constellation: 'Canes Venatici', radialVelocity: 504,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEO TRIPLET & LEO I GROUP (9-11 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm65', name: 'NGC 3623', altName: 'M65 / NGC 3623',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)a',
    ra: 169.7331, dec: 13.0922, distanceMpc: 10.30,
    magnitude: 9.3, absMagnitude: -20.5, majorAxis: 9.8, minorAxis: 2.9,
    constellation: 'Leo', radialVelocity: 807,
  },
  {
    id: 'm66', name: 'NGC 3627', altName: 'M66 / NGC 3627',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)b',
    ra: 170.0625, dec: 12.9914, distanceMpc: 10.58,
    magnitude: 8.9, absMagnitude: -20.9, majorAxis: 9.1, minorAxis: 4.2,
    constellation: 'Leo', radialVelocity: 727,
  },
  {
    id: 'ngc3628', name: 'NGC 3628', altName: 'NGC 3628 / Hamburger Galaxy',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAb pec',
    ra: 170.0712, dec: 13.5886, distanceMpc: 10.28,
    magnitude: 9.5, absMagnitude: -20.2, majorAxis: 14.8, minorAxis: 3.0,
    constellation: 'Leo', radialVelocity: 843,
  },
  {
    id: 'm95', name: 'NGC 3351', altName: 'M95 / NGC 3351',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(r)b',
    ra: 160.9904, dec: 11.7036, distanceMpc: 10.00,
    magnitude: 9.7, absMagnitude: -19.9, majorAxis: 7.4, minorAxis: 5.0,
    constellation: 'Leo', radialVelocity: 778,
  },
  {
    id: 'm96', name: 'NGC 3368', altName: 'M96 / NGC 3368',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)ab',
    ra: 161.6904, dec: 11.8197, distanceMpc: 10.10,
    magnitude: 9.2, absMagnitude: -20.4, majorAxis: 7.6, minorAxis: 5.2,
    constellation: 'Leo', radialVelocity: 897,
  },
  {
    id: 'm105', name: 'NGC 3379', altName: 'M105 / NGC 3379',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E1',
    ra: 161.9567, dec: 12.5817, distanceMpc: 10.30,
    magnitude: 9.3, absMagnitude: -20.5, majorAxis: 5.4, minorAxis: 4.8,
    constellation: 'Leo', radialVelocity: 911,
  },
  {
    id: 'ngc3384', name: 'NGC 3384',
    altName: 'NGC 3384',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SB(s)0-',
    ra: 162.0683, dec: 12.6283, distanceMpc: 10.40,
    magnitude: 10.0, absMagnitude: -19.8, majorAxis: 5.5, minorAxis: 2.5,
    constellation: 'Leo', radialVelocity: 704,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M104 AND NEARBY FIELD (9-10 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm104', name: 'Sombrero Galaxy', altName: 'M104 / NGC 4594',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)a',
    ra: 189.9975, dec: -11.6231, distanceMpc: 9.55,
    magnitude: 8.0, absMagnitude: -21.7, majorAxis: 8.7, minorAxis: 3.5,
    constellation: 'Virgo', radialVelocity: 1024, stellarMass: 10.9,
  },
  {
    id: 'm74', name: 'Phantom Galaxy', altName: 'M74 / NGC 628',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)c',
    ra: 24.1740, dec: 15.7836, distanceMpc: 9.77,
    magnitude: 9.4, absMagnitude: -20.2, majorAxis: 10.5, minorAxis: 9.5,
    constellation: 'Pisces', radialVelocity: 657,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // M61, M77, M108, M109 (12-15 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm61', name: 'NGC 4303', altName: 'M61 / NGC 4303',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)bc',
    ra: 185.4788, dec: 4.4736, distanceMpc: 12.27,
    magnitude: 9.7, absMagnitude: -20.7, majorAxis: 6.5, minorAxis: 5.8,
    constellation: 'Virgo', radialVelocity: 1566,
  },
  {
    id: 'm77', name: 'Cetus A', altName: 'M77 / NGC 1068',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: '(R)SA(rs)b',
    ra: 40.6696, dec: -0.0133, distanceMpc: 14.40,
    magnitude: 8.9, absMagnitude: -21.3, majorAxis: 7.1, minorAxis: 6.0,
    constellation: 'Cetus', radialVelocity: 1137,
  },
  {
    id: 'm108', name: 'NGC 3556', altName: 'M108 / NGC 3556',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)cd',
    ra: 167.8796, dec: 55.6736, distanceMpc: 14.10,
    magnitude: 10.0, absMagnitude: -19.8, majorAxis: 8.7, minorAxis: 2.2,
    constellation: 'Ursa Major', radialVelocity: 699,
  },
  {
    id: 'm109', name: 'NGC 3992', altName: 'M109 / NGC 3992',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(rs)bc',
    ra: 179.3996, dec: 53.3744, distanceMpc: 15.17,
    magnitude: 9.8, absMagnitude: -20.9, majorAxis: 7.6, minorAxis: 4.7,
    constellation: 'Ursa Major', radialVelocity: 1048,
  },
  {
    id: 'm98', name: 'NGC 4192', altName: 'M98 / NGC 4192',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)ab',
    ra: 183.4513, dec: 14.9003, distanceMpc: 14.13,
    magnitude: 10.1, absMagnitude: -19.8, majorAxis: 9.8, minorAxis: 2.8,
    constellation: 'Coma Berenices', radialVelocity: -142,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VIRGO CLUSTER (15-20 Mpc)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'm49', name: 'NGC 4472', altName: 'M49 / NGC 4472',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E2',
    ra: 187.4450, dec: 8.0004, distanceMpc: 16.72,
    magnitude: 8.4, absMagnitude: -22.6, majorAxis: 10.2, minorAxis: 8.3,
    constellation: 'Virgo', radialVelocity: 997, stellarMass: 11.3,
  },
  {
    id: 'm58', name: 'NGC 4579', altName: 'M58 / NGC 4579',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)b',
    ra: 189.4308, dec: 11.8178, distanceMpc: 19.83,
    magnitude: 9.7, absMagnitude: -21.5, majorAxis: 5.9, minorAxis: 4.7,
    constellation: 'Virgo', radialVelocity: 1519,
  },
  {
    id: 'm59', name: 'NGC 4621', altName: 'M59 / NGC 4621',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E5',
    ra: 190.5092, dec: 11.6467, distanceMpc: 16.83,
    magnitude: 9.6, absMagnitude: -20.9, majorAxis: 5.4, minorAxis: 3.7,
    constellation: 'Virgo', radialVelocity: 410,
  },
  {
    id: 'm60', name: 'NGC 4649', altName: 'M60 / NGC 4649',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E2',
    ra: 190.9167, dec: 11.5528, distanceMpc: 16.50,
    magnitude: 8.8, absMagnitude: -22.0, majorAxis: 7.6, minorAxis: 6.2,
    constellation: 'Virgo', radialVelocity: 1117, stellarMass: 11.1,
  },
  {
    id: 'm84', name: 'NGC 4374', altName: 'M84 / NGC 4374',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E1',
    ra: 186.2655, dec: 12.8870, distanceMpc: 18.45,
    magnitude: 9.1, absMagnitude: -21.9, majorAxis: 6.5, minorAxis: 5.6,
    constellation: 'Virgo', radialVelocity: 1060,
  },
  {
    id: 'm85', name: 'NGC 4382', altName: 'M85 / NGC 4382',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA(s)0+ pec',
    ra: 186.3504, dec: 18.1911, distanceMpc: 17.88,
    magnitude: 9.1, absMagnitude: -21.4, majorAxis: 7.1, minorAxis: 5.5,
    constellation: 'Coma Berenices', radialVelocity: 729,
  },
  {
    id: 'm86', name: 'NGC 4406', altName: 'M86 / NGC 4406',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E3',
    ra: 186.5492, dec: 12.9461, distanceMpc: 17.08,
    magnitude: 8.9, absMagnitude: -21.6, majorAxis: 8.9, minorAxis: 5.8,
    constellation: 'Virgo', radialVelocity: -244,
  },
  {
    id: 'm87', name: 'Virgo A', altName: 'M87 / NGC 4486',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E+0-1 pec',
    ra: 187.7059, dec: 12.3911, distanceMpc: 16.40,
    magnitude: 8.6, absMagnitude: -22.2, majorAxis: 8.3, minorAxis: 6.6,
    constellation: 'Virgo', radialVelocity: 1307, stellarMass: 11.4,
  },
  {
    id: 'm88', name: 'NGC 4501', altName: 'M88 / NGC 4501',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(rs)b',
    ra: 187.9967, dec: 14.4203, distanceMpc: 15.83,
    magnitude: 9.6, absMagnitude: -21.1, majorAxis: 6.9, minorAxis: 3.7,
    constellation: 'Coma Berenices', radialVelocity: 2281,
  },
  {
    id: 'm89', name: 'NGC 4552', altName: 'M89 / NGC 4552',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E0',
    ra: 188.9158, dec: 12.5564, distanceMpc: 15.78,
    magnitude: 9.8, absMagnitude: -20.7, majorAxis: 5.1, minorAxis: 4.7,
    constellation: 'Virgo', radialVelocity: 340,
  },
  {
    id: 'm90', name: 'NGC 4569', altName: 'M90 / NGC 4569',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)ab',
    ra: 189.2083, dec: 13.1633, distanceMpc: 16.83,
    magnitude: 9.5, absMagnitude: -21.3, majorAxis: 9.5, minorAxis: 4.4,
    constellation: 'Virgo', radialVelocity: -235,
  },
  {
    id: 'm91', name: 'NGC 4548', altName: 'M91 / NGC 4548',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SBb(rs)',
    ra: 188.8600, dec: 14.4964, distanceMpc: 15.83,
    magnitude: 10.2, absMagnitude: -20.4, majorAxis: 5.4, minorAxis: 4.3,
    constellation: 'Coma Berenices', radialVelocity: 486,
  },
  {
    id: 'm99', name: 'Coma Pinwheel Galaxy', altName: 'M99 / NGC 4254',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)c',
    ra: 184.7067, dec: 14.4167, distanceMpc: 15.33,
    magnitude: 9.9, absMagnitude: -20.8, majorAxis: 5.4, minorAxis: 4.7,
    constellation: 'Coma Berenices', radialVelocity: 2407,
  },
  {
    id: 'm100', name: 'NGC 4321', altName: 'M100 / NGC 4321',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)bc',
    ra: 185.7288, dec: 15.8222, distanceMpc: 16.17,
    magnitude: 9.3, absMagnitude: -21.5, majorAxis: 7.4, minorAxis: 6.3,
    constellation: 'Coma Berenices', radialVelocity: 1571,
  },
  {
    id: 'ngc4526', name: 'NGC 4526',
    altName: 'NGC 4526',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SAB(s)0',
    ra: 188.5125, dec: 7.6994, distanceMpc: 16.90,
    magnitude: 9.7, absMagnitude: -20.9, majorAxis: 7.2, minorAxis: 2.3,
    constellation: 'Virgo', radialVelocity: 617,
  },
  {
    id: 'ngc4535', name: 'NGC 4535',
    altName: 'NGC 4535',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)c',
    ra: 188.5846, dec: 8.1978, distanceMpc: 15.77,
    magnitude: 10.0, absMagnitude: -20.6, majorAxis: 7.1, minorAxis: 5.0,
    constellation: 'Virgo', radialVelocity: 1961,
  },
  {
    id: 'ngc4536', name: 'NGC 4536',
    altName: 'NGC 4536',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)bc',
    ra: 188.6129, dec: 2.1881, distanceMpc: 14.93,
    magnitude: 10.6, absMagnitude: -19.9, majorAxis: 7.6, minorAxis: 3.2,
    constellation: 'Virgo', radialVelocity: 1808,
  },
  {
    id: 'ngc4438', name: 'NGC 4438', altName: 'NGC 4438 / Eyes Galaxy',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA(s)0/a pec',
    ra: 186.9413, dec: 13.0089, distanceMpc: 16.00,
    magnitude: 10.2, absMagnitude: -20.5, majorAxis: 8.5, minorAxis: 3.0,
    constellation: 'Virgo', radialVelocity: 71,
  },
  {
    id: 'ngc4388', name: 'NGC 4388',
    altName: 'NGC 4388',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)b',
    ra: 186.4446, dec: 12.6622, distanceMpc: 16.60,
    magnitude: 11.0, absMagnitude: -19.7, majorAxis: 5.6, minorAxis: 1.5,
    constellation: 'Virgo', radialVelocity: 2524,
  },
  {
    id: 'ngc4550', name: 'NGC 4550',
    altName: 'NGC 4550',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SB0',
    ra: 188.8775, dec: 12.2200, distanceMpc: 15.49,
    magnitude: 11.7, absMagnitude: -18.7, majorAxis: 3.3, minorAxis: 0.9,
    constellation: 'Virgo', radialVelocity: 381,
  },
  {
    id: 'ngc4473', name: 'NGC 4473',
    altName: 'NGC 4473',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E5',
    ra: 187.4538, dec: 13.4292, distanceMpc: 15.25,
    magnitude: 10.2, absMagnitude: -20.4, majorAxis: 4.5, minorAxis: 2.6,
    constellation: 'Coma Berenices', radialVelocity: 2260,
  },
  {
    id: 'ngc4478', name: 'NGC 4478',
    altName: 'NGC 4478',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E2',
    ra: 187.5733, dec: 12.3281, distanceMpc: 16.30,
    magnitude: 11.4, absMagnitude: -19.2, majorAxis: 1.8, minorAxis: 1.6,
    constellation: 'Virgo', radialVelocity: 1349,
  },
  {
    id: 'ngc4459', name: 'NGC 4459',
    altName: 'NGC 4459',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA(r)0+',
    ra: 187.2500, dec: 13.9786, distanceMpc: 16.14,
    magnitude: 10.4, absMagnitude: -20.2, majorAxis: 3.5, minorAxis: 2.7,
    constellation: 'Coma Berenices', radialVelocity: 1210,
  },
  {
    id: 'ngc4477', name: 'NGC 4477',
    altName: 'NGC 4477',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SB(s)0',
    ra: 187.5075, dec: 13.6364, distanceMpc: 16.52,
    magnitude: 10.4, absMagnitude: -20.4, majorAxis: 3.8, minorAxis: 3.5,
    constellation: 'Coma Berenices', radialVelocity: 1338,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL NOTABLE NEARBY GALAXIES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ngc1316', name: 'Fornax A', altName: 'NGC 1316',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SAB(s)0',
    ra: 50.6738, dec: -37.2083, distanceMpc: 18.60,
    magnitude: 9.4, absMagnitude: -22.3, majorAxis: 12.0, minorAxis: 8.5,
    constellation: 'Fornax', radialVelocity: 1760,
  },
  {
    id: 'ngc1365', name: 'Great Barred Spiral', altName: 'NGC 1365',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SBb(s)',
    ra: 53.4015, dec: -36.1404, distanceMpc: 17.95,
    magnitude: 10.3, absMagnitude: -21.3, majorAxis: 11.2, minorAxis: 6.2,
    constellation: 'Fornax', radialVelocity: 1636,
  },
  {
    id: 'ngc1399', name: 'NGC 1399',
    altName: 'NGC 1399',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E1',
    ra: 54.6213, dec: -35.4508, distanceMpc: 19.95,
    magnitude: 9.6, absMagnitude: -21.5, majorAxis: 6.9, minorAxis: 6.5,
    constellation: 'Fornax', radialVelocity: 1425,
  },
  {
    id: 'ngc1404', name: 'NGC 1404',
    altName: 'NGC 1404',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E1',
    ra: 54.7171, dec: -35.5936, distanceMpc: 18.68,
    magnitude: 10.0, absMagnitude: -20.6, majorAxis: 3.3, minorAxis: 3.0,
    constellation: 'Fornax', radialVelocity: 1947,
  },
  {
    id: 'ngc2841', name: 'NGC 2841',
    altName: 'NGC 2841',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(r)b',
    ra: 140.5108, dec: 50.9764, distanceMpc: 14.10,
    magnitude: 9.2, absMagnitude: -20.6, majorAxis: 8.1, minorAxis: 3.5,
    constellation: 'Ursa Major', radialVelocity: 638,
  },
  {
    id: 'ngc2903', name: 'NGC 2903',
    altName: 'NGC 2903',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)bc',
    ra: 143.0421, dec: 21.5008, distanceMpc: 8.90,
    magnitude: 9.0, absMagnitude: -20.7, majorAxis: 12.6, minorAxis: 6.0,
    constellation: 'Leo', radialVelocity: 556,
  },
  {
    id: 'ngc4258', name: 'NGC 4258 (water maser)',
    altName: 'NGC 4258',
    // duplicate-ish of M106 but kept for reference with water maser distance
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(s)bc',
    ra: 184.7396, dec: 47.3042, distanceMpc: 7.60,
    magnitude: 8.4, absMagnitude: -20.8, majorAxis: 18.6, minorAxis: 7.2,
    constellation: 'Canes Venatici', radialVelocity: 448,
  },
  {
    id: 'ngc4631', name: 'Whale Galaxy', altName: 'NGC 4631',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)d',
    ra: 190.5333, dec: 32.5414, distanceMpc: 7.35,
    magnitude: 9.8, absMagnitude: -20.0, majorAxis: 15.5, minorAxis: 2.7,
    constellation: 'Canes Venatici', radialVelocity: 606,
  },
  {
    id: 'ngc4656', name: 'Hockey Stick Galaxy', altName: 'NGC 4656',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m pec',
    ra: 190.9875, dec: 32.1700, distanceMpc: 7.35,
    magnitude: 10.5, absMagnitude: -19.0, majorAxis: 15.1, minorAxis: 2.4,
    constellation: 'Canes Venatici', radialVelocity: 646,
  },
  {
    id: 'ngc891', name: 'NGC 891',
    altName: 'NGC 891',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)b',
    ra: 35.6392, dec: 42.3492, distanceMpc: 9.78,
    magnitude: 10.0, absMagnitude: -20.1, majorAxis: 13.5, minorAxis: 2.5,
    constellation: 'Andromeda', radialVelocity: 528,
  },
  {
    id: 'ngc4565', name: 'Needle Galaxy', altName: 'NGC 4565',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)b',
    ra: 189.0867, dec: 25.9875, distanceMpc: 14.90,
    magnitude: 9.6, absMagnitude: -21.0, majorAxis: 15.9, minorAxis: 1.9,
    constellation: 'Coma Berenices', radialVelocity: 1230,
  },
  {
    id: 'ngc3115', name: 'Spindle Galaxy', altName: 'NGC 3115',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'S0-',
    ra: 151.3083, dec: -7.7186, distanceMpc: 9.68,
    magnitude: 8.9, absMagnitude: -20.8, majorAxis: 7.2, minorAxis: 2.5,
    constellation: 'Sextans', radialVelocity: 663,
  },
  {
    id: 'ngc5866', name: 'NGC 5866', altName: 'NGC 5866',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA(s)0+',
    ra: 226.6229, dec: 55.7633, distanceMpc: 14.90,
    magnitude: 9.9, absMagnitude: -20.5, majorAxis: 4.7, minorAxis: 1.9,
    constellation: 'Draco', radialVelocity: 672,
  },
  {
    id: 'ngc3521', name: 'NGC 3521',
    altName: 'NGC 3521',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SAB(rs)bc',
    ra: 166.4525, dec: -0.0358, distanceMpc: 10.70,
    magnitude: 8.9, absMagnitude: -20.7, majorAxis: 11.0, minorAxis: 5.1,
    constellation: 'Leo', radialVelocity: 805,
  },
  {
    id: 'ngc4258-2', name: 'NGC 3198',
    altName: 'NGC 3198',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(rs)c',
    ra: 154.9783, dec: 45.5497, distanceMpc: 13.80,
    magnitude: 10.3, absMagnitude: -19.6, majorAxis: 8.5, minorAxis: 3.3,
    constellation: 'Ursa Major', radialVelocity: 663,
  },
  {
    id: 'ngc4736', name: 'NGC 4490',
    altName: 'NGC 4490 / Cocoon Galaxy',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)d pec',
    ra: 187.6508, dec: 41.6436, distanceMpc: 7.80,
    magnitude: 9.8, absMagnitude: -19.6, majorAxis: 6.3, minorAxis: 3.1,
    constellation: 'Canes Venatici', radialVelocity: 565,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL LOCAL VOLUME DWARFS & IRREGULARS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ugc4879', name: 'UGC 4879',
    altName: 'UGC 4879 / VV 124',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 139.4417, dec: 52.8517, distanceMpc: 1.36,
    magnitude: 15.5, absMagnitude: -12.4, majorAxis: 1.0,
    constellation: 'Ursa Major', radialVelocity: -73,
  },
  {
    id: 'kk246', name: 'KK 246',
    altName: 'KK 246 / ESO 461-036',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 298.6000, dec: -31.7581, distanceMpc: 7.83,
    magnitude: 16.4, absMagnitude: -12.4, majorAxis: 0.9,
    constellation: 'Sagittarius', radialVelocity: 40,
  },
  {
    id: 'ddo187', name: 'DDO 187',
    altName: 'DDO 187 / UGC 9128',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 213.6063, dec: 23.0294, distanceMpc: 2.30,
    magnitude: 14.4, absMagnitude: -12.5, majorAxis: 1.7,
    constellation: 'Canes Venatici', radialVelocity: 154,
  },
  {
    id: 'griz5', name: 'GR 8',
    altName: 'GR 8 / DDO 155',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'ImV',
    ra: 194.4521, dec: 14.2219, distanceMpc: 2.13,
    magnitude: 14.7, absMagnitude: -12.1, majorAxis: 1.1,
    constellation: 'Virgo', radialVelocity: 214,
  },
  {
    id: 'sag-dirr', name: 'Sagittarius Dwarf Irregular',
    altName: 'SagDIG',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IB(s)m',
    ra: 292.4958, dec: -17.6792, distanceMpc: 1.06,
    magnitude: 15.5, absMagnitude: -11.5, majorAxis: 2.9,
    constellation: 'Sagittarius', radialVelocity: -79,
  },
  {
    id: 'sex-a', name: 'Sextans A',
    altName: 'Sextans A / DDO 75',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 152.7458, dec: -4.6917, distanceMpc: 1.32,
    magnitude: 11.9, absMagnitude: -14.0, majorAxis: 5.9, minorAxis: 4.9,
    constellation: 'Sextans', radialVelocity: 324,
  },
  {
    id: 'sex-b', name: 'Sextans B',
    altName: 'Sextans B / DDO 70',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 150.0000, dec: 5.3306, distanceMpc: 1.36,
    magnitude: 11.8, absMagnitude: -14.1, majorAxis: 5.1, minorAxis: 3.5,
    constellation: 'Sextans', radialVelocity: 300,
  },
  {
    id: 'ngc3109', name: 'NGC 3109',
    altName: 'NGC 3109',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SB(s)m',
    ra: 150.7792, dec: -26.1592, distanceMpc: 1.26,
    magnitude: 10.4, absMagnitude: -15.7, majorAxis: 19.7, minorAxis: 3.7,
    constellation: 'Hydra', radialVelocity: 403,
  },
  {
    id: 'antlia-dwarf', name: 'Antlia Dwarf',
    altName: 'Antlia dSph',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph/dIrr',
    ra: 152.8600, dec: -27.3300, distanceMpc: 1.31,
    magnitude: 16.2, absMagnitude: -10.4, majorAxis: 2.0,
    constellation: 'Antlia', radialVelocity: 362,
  },
  {
    id: 'eso294-g010', name: 'ESO 294-G010',
    altName: 'ESO 294-G010',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph/dIrr',
    ra: 4.2917, dec: -41.8575, distanceMpc: 1.92,
    magnitude: 15.6, absMagnitude: -11.2, majorAxis: 1.7,
    constellation: 'Phoenix', radialVelocity: 117,
  },
  {
    id: 'eso540-g031', name: 'ESO 540-G031',
    altName: 'ESO 540-G031',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dTrans',
    ra: 8.7000, dec: -21.1917, distanceMpc: 3.42,
    magnitude: 16.4, absMagnitude: -11.0, majorAxis: 1.3,
    constellation: 'Sculptor', radialVelocity: 228,
  },
  {
    id: 'kkg3', name: 'KKH 98',
    altName: 'KKH 98',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'dIm',
    ra: 352.7125, dec: 68.3833, distanceMpc: 2.45,
    magnitude: 16.7, absMagnitude: -10.2, majorAxis: 0.8,
    constellation: 'Cassiopeia', radialVelocity: -136,
  },
  {
    id: 'kk-77', name: 'DDO 44',
    altName: 'DDO 44 / KK 61',
    type: 'Dwarf', galaxyType: 'dwarf', hubbleType: 'dSph',
    ra: 112.1542, dec: 66.8750, distanceMpc: 3.19,
    magnitude: 15.7, absMagnitude: -12.2, majorAxis: 1.8,
    constellation: 'Camelopardalis', radialVelocity: 213,
  },
  {
    id: 'ddo82', name: 'DDO 82',
    altName: 'DDO 82 / UGC 5692',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 157.7792, dec: 70.6131, distanceMpc: 4.01,
    magnitude: 13.4, absMagnitude: -14.7, majorAxis: 3.4,
    constellation: 'Ursa Major', radialVelocity: 59,
  },
  {
    id: 'ngc6503', name: 'NGC 6503',
    altName: 'NGC 6503',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)cd',
    ra: 267.9608, dec: 70.1425, distanceMpc: 5.27,
    magnitude: 10.2, absMagnitude: -18.1, majorAxis: 7.1, minorAxis: 2.4,
    constellation: 'Draco', radialVelocity: 60,
  },
  {
    id: 'ngc784', name: 'NGC 784',
    altName: 'NGC 784',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)dm',
    ra: 30.3292, dec: 28.8378, distanceMpc: 5.19,
    magnitude: 12.2, absMagnitude: -16.3, majorAxis: 6.6, minorAxis: 1.5,
    constellation: 'Triangulum', radialVelocity: 198,
  },
  {
    id: 'ngc2683', name: 'NGC 2683',
    altName: 'NGC 2683',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(rs)b',
    ra: 133.1692, dec: 33.4214, distanceMpc: 9.36,
    magnitude: 9.7, absMagnitude: -20.1, majorAxis: 9.3, minorAxis: 2.2,
    constellation: 'Lynx', radialVelocity: 411,
  },
  {
    id: 'ugca92', name: 'UGCA 92',
    altName: 'UGCA 92 / EGB0427+63',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 68.0958, dec: 63.6144, distanceMpc: 3.01,
    magnitude: 14.2, absMagnitude: -14.3, majorAxis: 2.0,
    constellation: 'Camelopardalis', radialVelocity: -99,
  },
  {
    id: 'ngc404', name: 'NGC 404',
    altName: 'NGC 404 / Mirach\'s Ghost',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: 'SA(s)0-',
    ra: 17.3633, dec: 35.7186, distanceMpc: 3.05,
    magnitude: 11.2, absMagnitude: -16.6, majorAxis: 3.5, minorAxis: 3.5,
    constellation: 'Andromeda', radialVelocity: -48,
  },
  {
    id: 'ngc3621', name: 'NGC 3621',
    altName: 'NGC 3621',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)d',
    ra: 169.5688, dec: -32.8136, distanceMpc: 6.64,
    magnitude: 9.7, absMagnitude: -19.5, majorAxis: 12.3, minorAxis: 7.1,
    constellation: 'Hydra', radialVelocity: 727,
  },
  {
    id: 'ngc7331', name: 'NGC 7331',
    altName: 'NGC 7331',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SA(s)b',
    ra: 339.2671, dec: 34.4156, distanceMpc: 14.72,
    magnitude: 9.5, absMagnitude: -21.0, majorAxis: 10.5, minorAxis: 3.7,
    constellation: 'Pegasus', radialVelocity: 816,
  },
  {
    id: 'ngc1291', name: 'NGC 1291',
    altName: 'NGC 1291',
    type: 'Lenticular', galaxyType: 'lenticular', hubbleType: '(R)SB(s)0/a',
    ra: 49.3208, dec: -41.1078, distanceMpc: 10.40,
    magnitude: 9.4, absMagnitude: -20.5, majorAxis: 10.5, minorAxis: 8.1,
    constellation: 'Eridanus', radialVelocity: 839,
  },
  {
    id: 'ngc1512', name: 'NGC 1512',
    altName: 'NGC 1512',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(r)a',
    ra: 60.9762, dec: -43.3489, distanceMpc: 11.60,
    magnitude: 10.6, absMagnitude: -19.7, majorAxis: 8.9, minorAxis: 5.6,
    constellation: 'Horologium', radialVelocity: 898,
  },
  {
    id: 'ngc2768', name: 'NGC 2768',
    altName: 'NGC 2768',
    type: 'Elliptical', galaxyType: 'elliptical', hubbleType: 'E6',
    ra: 137.9063, dec: 60.0372, distanceMpc: 21.80,
    magnitude: 9.9, absMagnitude: -21.6, majorAxis: 8.1, minorAxis: 4.3,
    constellation: 'Ursa Major', radialVelocity: 1373,
  },
  {
    id: 'ngc4485', name: 'NGC 4485',
    altName: 'NGC 4485',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IB(s)m pec',
    ra: 187.5879, dec: 41.7003, distanceMpc: 7.80,
    magnitude: 11.9, absMagnitude: -17.5, majorAxis: 2.3, minorAxis: 1.6,
    constellation: 'Canes Venatici', radialVelocity: 493,
  },
  {
    id: 'ngc5204', name: 'NGC 5204',
    altName: 'NGC 5204',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'SA(s)m',
    ra: 202.4017, dec: 58.4208, distanceMpc: 4.65,
    magnitude: 11.7, absMagnitude: -16.6, majorAxis: 5.0, minorAxis: 3.0,
    constellation: 'Ursa Major', radialVelocity: 201,
  },
  {
    id: 'ugc8508', name: 'UGC 8508',
    altName: 'UGC 8508',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IAm',
    ra: 203.1750, dec: 54.9267, distanceMpc: 2.69,
    magnitude: 14.4, absMagnitude: -13.1, majorAxis: 1.7, minorAxis: 1.0,
    constellation: 'Ursa Major', radialVelocity: 62,
  },
  {
    id: 'ngc4163', name: 'NGC 4163',
    altName: 'NGC 4163',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IAm',
    ra: 183.0150, dec: 36.1644, distanceMpc: 2.96,
    magnitude: 13.6, absMagnitude: -14.1, majorAxis: 1.9, minorAxis: 1.1,
    constellation: 'Canes Venatici', radialVelocity: 165,
  },
  {
    id: 'ngc4190', name: 'NGC 4190',
    altName: 'NGC 4190',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im pec',
    ra: 183.4567, dec: 36.6342, distanceMpc: 2.78,
    magnitude: 13.4, absMagnitude: -14.0, majorAxis: 1.7, minorAxis: 1.5,
    constellation: 'Canes Venatici', radialVelocity: 228,
  },
  {
    id: 'ddo125', name: 'DDO 125',
    altName: 'DDO 125 / UGC 7577',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 186.7550, dec: 43.4897, distanceMpc: 2.74,
    magnitude: 12.8, absMagnitude: -14.4, majorAxis: 4.0, minorAxis: 2.9,
    constellation: 'Canes Venatici', radialVelocity: 196,
  },
  {
    id: 'ddo165', name: 'DDO 165',
    altName: 'DDO 165 / UGC 8201',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 198.1417, dec: 67.7050, distanceMpc: 4.57,
    magnitude: 12.8, absMagnitude: -15.4, majorAxis: 3.5, minorAxis: 1.9,
    constellation: 'Canes Venatici', radialVelocity: 37,
  },
  {
    id: 'ddo53', name: 'DDO 53',
    altName: 'DDO 53 / UGC 4459',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'Im',
    ra: 127.6271, dec: 66.1764, distanceMpc: 3.56,
    magnitude: 14.5, absMagnitude: -13.5, majorAxis: 1.5,
    constellation: 'Ursa Major', radialVelocity: 19,
  },
  {
    id: 'ddo154', name: 'DDO 154',
    altName: 'DDO 154 / UGC 8024',
    type: 'Irregular', galaxyType: 'irregular', hubbleType: 'IBm',
    ra: 193.5250, dec: 27.1489, distanceMpc: 3.74,
    magnitude: 14.2, absMagnitude: -14.1, majorAxis: 3.0, minorAxis: 2.2,
    constellation: 'Canes Venatici', radialVelocity: 375,
  },
  {
    id: 'ngc4605', name: 'NGC 4605',
    altName: 'NGC 4605',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)c pec',
    ra: 189.9975, dec: 61.6086, distanceMpc: 5.47,
    magnitude: 10.9, absMagnitude: -17.6, majorAxis: 5.8, minorAxis: 2.3,
    constellation: 'Ursa Major', radialVelocity: 142,
  },
  {
    id: 'ngc2146', name: 'NGC 2146',
    altName: 'NGC 2146',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(s)ab pec',
    ra: 94.6579, dec: 78.3569, distanceMpc: 17.20,
    magnitude: 10.6, absMagnitude: -21.0, majorAxis: 6.0, minorAxis: 3.4,
    constellation: 'Camelopardalis', radialVelocity: 893,
  },
  {
    id: 'ngc3344', name: 'NGC 3344',
    altName: 'NGC 3344',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: '(R)SAB(r)bc',
    ra: 160.8783, dec: 24.9222, distanceMpc: 6.90,
    magnitude: 9.9, absMagnitude: -19.0, majorAxis: 7.1, minorAxis: 6.5,
    constellation: 'Leo Minor', radialVelocity: 586,
  },
  {
    id: 'ngc2500', name: 'NGC 2500',
    altName: 'NGC 2500',
    type: 'Spiral', galaxyType: 'spiral', hubbleType: 'SB(rs)d',
    ra: 120.4708, dec: 50.7381, distanceMpc: 10.10,
    magnitude: 12.0, absMagnitude: -18.0, majorAxis: 2.9, minorAxis: 2.6,
    constellation: 'Lynx', radialVelocity: 517,
  },
];

// ─── Assign galaxyType to any entry that lacks it ───────────────────────────

for (const g of GALAXIES) {
  if (!g.galaxyType) {
    g.galaxyType = categorizeType(g.hubbleType ?? g.type);
  }
}

// ─── Position & rendering helpers ───────────────────────────────────────────

/**
 * Convert RA/Dec/distance to 3D cartesian coordinates.
 * Uses equatorial coordinate system: X toward RA=0, Y toward Dec=+90, Z toward RA=90.
 */
export function computeGalaxyPositions(galaxies: GalaxyData[]): GalaxyData[] {
  return galaxies.map((g) => {
    if (g.distanceMpc == null) return g;
    const raRad = (g.ra * Math.PI) / 180;
    const decRad = (g.dec * Math.PI) / 180;
    const d = g.distanceMpc;
    return {
      ...g,
      x: d * Math.cos(decRad) * Math.cos(raRad),
      y: d * Math.sin(decRad),
      z: d * Math.cos(decRad) * Math.sin(raRad),
    };
  });
}

/**
 * Map galaxy morphological type to a display color hex string.
 */
export function galaxyTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('spiral')) return '#7eb8ff';     // blue-white
  if (t.includes('elliptical')) return '#ffb347';  // amber
  if (t.includes('lenticular')) return '#d4a5ff';  // lavender
  if (t.includes('irregular')) return '#68d98a';   // green
  if (t.includes('dwarf')) return '#a080d0';       // dim purple
  return '#aaaacc';                                // default gray
}

/**
 * Get a color by GalaxyType enum value (used in scene layers).
 */
export function galaxyTypeEnumColor(gtype: GalaxyType): string {
  switch (gtype) {
    case 'spiral':      return '#7eb8ff';
    case 'elliptical':  return '#ffb347';
    case 'lenticular':  return '#d4a5ff';
    case 'irregular':   return '#68d98a';
    case 'dwarf':       return '#a080d0';
    default:            return '#aaaacc';
  }
}

/**
 * Logarithmic distance scaling so nearby (0.05 Mpc) and distant (20 Mpc) galaxies
 * are all visible in the scene. Returns a value suitable for Three.js world units.
 */
export function logScale(distanceMpc: number, base = 10, spread = 8): number {
  return Math.log(1 + distanceMpc) / Math.log(base) * spread;
}

/**
 * Compute scaled 3D positions using logarithmic distance for the scene.
 */
export function computeScaledPositions(galaxies: GalaxyData[]): GalaxyData[] {
  return galaxies.map((g) => {
    if (g.distanceMpc == null) return g;
    const raRad = (g.ra * Math.PI) / 180;
    const decRad = (g.dec * Math.PI) / 180;
    const d = logScale(g.distanceMpc);
    return {
      ...g,
      x: d * Math.cos(decRad) * Math.cos(raRad),
      y: d * Math.sin(decRad),
      z: d * Math.cos(decRad) * Math.sin(raRad),
    };
  });
}
