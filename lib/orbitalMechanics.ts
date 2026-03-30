/**
 * Kepler equation solver and orbital mechanics utilities.
 *
 * Transforms Keplerian orbital elements into 3D Cartesian positions
 * using Newton-Raphson iteration for the Kepler equation.
 *
 * Reference frame: heliocentric ecliptic (J2000 epoch).
 */

import type { OrbitalElements } from './types';

const DEG2RAD = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

/**
 * Solve Kepler's equation  M = E - e*sin(E)  for eccentric anomaly E
 * using Newton-Raphson iteration.
 *
 * @param meanAnomaly  Mean anomaly in radians
 * @param eccentricity Orbital eccentricity (0 <= e < 1)
 * @param tolerance    Convergence tolerance (default 1e-8)
 * @returns Eccentric anomaly in radians
 */
export function solveKepler(
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-8,
): number {
  // Normalize M to [0, 2*PI)
  let M = meanAnomaly % TWO_PI;
  if (M < 0) M += TWO_PI;

  // Initial guess: E = M for low eccentricity, E = PI for high
  let E = eccentricity < 0.8 ? M : Math.PI;

  for (let i = 0; i < 50; i++) {
    const dE = (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }

  return E;
}

/**
 * Advance the mean anomaly over time.
 *
 * M(t) = M0 + (2*PI / period) * t
 *
 * @param M0       Mean anomaly at epoch (degrees)
 * @param period   Orbital period (days)
 * @param timeDays Elapsed time (days)
 * @returns Mean anomaly at time t (radians)
 */
export function meanAnomalyAtTime(
  M0: number,
  period: number,
  timeDays: number,
): number {
  const M0rad = M0 * DEG2RAD;
  const n = TWO_PI / period; // mean motion (rad/day)
  return M0rad + n * timeDays;
}

/**
 * Compute the 3D heliocentric position from orbital elements at a given time.
 *
 * Pipeline:
 *   1. Advance mean anomaly: M(t) = M0 + n*t
 *   2. Solve Kepler equation for eccentric anomaly E
 *   3. Compute true anomaly v from E
 *   4. Compute radius r = a*(1 - e*cos(E))
 *   5. Rotate from orbital plane to 3D using i, Omega, omega
 *
 * @param elements  Keplerian orbital elements
 * @param timeDays  Elapsed time since epoch (days)
 * @returns 3D position {x, y, z} in AU (heliocentric ecliptic)
 */
export function orbitalPosition(
  elements: OrbitalElements,
  timeDays: number,
): { x: number; y: number; z: number } {
  const { semiMajorAxis: a, eccentricity: e, inclination, longAscNode, argPerihelion, meanAnomaly: M0, period } = elements;

  // Step 1: mean anomaly at time
  const M = meanAnomalyAtTime(M0, period, timeDays);

  // Step 2: eccentric anomaly
  const E = solveKepler(M, e);

  // Step 3: true anomaly
  const sinV = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const v = Math.atan2(sinV, cosV);

  // Step 4: radius
  const r = a * (1 - e * Math.cos(E));

  // Step 5: position in orbital plane
  const xOrb = r * Math.cos(v);
  const yOrb = r * Math.sin(v);

  // Step 6: rotate to 3D ecliptic frame
  const i = inclination * DEG2RAD;
  const Omega = longAscNode * DEG2RAD;
  const omega = argPerihelion * DEG2RAD;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);

  // Rotation matrix elements (orbital plane -> ecliptic)
  const x =
    (cosOmega * cosW - sinOmega * sinW * cosI) * xOrb +
    (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrb;

  const y =
    (sinOmega * cosW + cosOmega * sinW * cosI) * xOrb +
    (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrb;

  const z =
    (sinW * sinI) * xOrb +
    (cosW * sinI) * yOrb;

  return { x, y, z };
}

/**
 * Generate N evenly-spaced points along an orbit ellipse for visualization.
 *
 * @param elements  Keplerian orbital elements
 * @param numPoints Number of points to generate (default 360)
 * @returns Array of 3D positions in AU
 */
export function orbitPoints(
  elements: OrbitalElements,
  numPoints: number = 360,
): Array<{ x: number; y: number; z: number }> {
  const { semiMajorAxis: a, eccentricity: e, inclination, longAscNode, argPerihelion } = elements;

  const i = inclination * DEG2RAD;
  const Omega = longAscNode * DEG2RAD;
  const omega = argPerihelion * DEG2RAD;

  const cosOmega = Math.cos(Omega);
  const sinOmega = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);

  const points: Array<{ x: number; y: number; z: number }> = [];

  for (let n = 0; n <= numPoints; n++) {
    // Sweep true anomaly from 0 to 2*PI
    const v = (n / numPoints) * TWO_PI;

    // Radius at this true anomaly
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(v));

    // Position in orbital plane
    const xOrb = r * Math.cos(v);
    const yOrb = r * Math.sin(v);

    // Rotate to 3D ecliptic
    const x =
      (cosOmega * cosW - sinOmega * sinW * cosI) * xOrb +
      (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrb;

    const y =
      (sinOmega * cosW + cosOmega * sinW * cosI) * xOrb +
      (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrb;

    const z =
      (sinW * sinI) * xOrb +
      (cosW * sinI) * yOrb;

    points.push({ x, y, z });
  }

  return points;
}
