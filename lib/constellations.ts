// Constellation line pairs: HIP ID pairs for stick figures
// Shared between ConstellationLines.tsx (3D) and TwoDDotsCanvas (2D)
// ~80 pairs covering major constellations visible from both hemispheres
export const CONSTELLATION_PAIRS: [number, number][] = [
  // ── Orion (7 lines) ──
  [27989, 25336],   // Betelgeuse - Bellatrix
  [27989, 26311],   // Betelgeuse - Alnilam
  [25336, 26311],   // Bellatrix - Alnilam
  [26311, 26727],   // Alnilam - Alnitak
  [26727, 24436],   // Alnitak - Rigel
  [25336, 24436],   // Bellatrix - Rigel
  [27366, 26727],   // Saiph - Alnitak

  // ── Ursa Major / Big Dipper (6 lines) ──
  [54061, 53910],   // Dubhe - Merak
  [53910, 58001],   // Merak - Phecda
  [58001, 59774],   // Phecda - Megrez
  [59774, 62956],   // Megrez - Alioth
  [62956, 65378],   // Alioth - Mizar
  [65378, 67301],   // Mizar - Alkaid

  // ── Cassiopeia (4 lines) ──
  [746, 4427],      // Caph - Navi
  [4427, 6686],     // Navi - Ruchbah
  [6686, 8886],     // Ruchbah - Segin
  [4427, 4436],     // Navi - Schedar

  // ── Cygnus / Northern Cross (4 lines) ──
  [102098, 95947],  // Deneb - Sadr
  [95947, 102488],  // Sadr - Albireo
  [95947, 95168],   // Sadr - Aljanah (epsilon Cyg)
  [95947, 97649],   // Sadr - connecting toward Aquila

  // ── Lyra (1 line) ──
  [91262, 91971],   // Vega - Sheliak

  // ── Aquila (1 line) ──
  [97649, 97278],   // Altair - Tarazed

  // ── Gemini (3 lines) ──
  [36850, 37826],   // Castor - Pollux
  [36850, 31592],   // Castor - Mebsuda
  [37826, 31681],   // Pollux - Alhena

  // ── Taurus (1 line) ──
  [21421, 25428],   // Aldebaran - Elnath

  // ── Canis Major (3 lines) ──
  [32349, 30324],   // Sirius - Murzim
  [32349, 33579],   // Sirius - Adhara
  [33579, 34444],   // Adhara - Wezen

  // ── Canis Minor (implied via Procyon standalone) ──

  // ── Scorpius (3 lines) ──
  [80763, 85927],   // Antares - Shaula
  [85927, 86670],   // Shaula - Lesath
  [80763, 78401],   // Antares - Yed Prior area

  // ── Sagittarius / Teapot (2 lines) ──
  [90185, 89931],   // Kaus Australis - Kaus Media
  [92855, 90185],   // Nunki - Kaus Australis

  // ── Centaurus (2 lines) ──
  [68702, 71683],   // Hadar - Alpha Centauri A
  [68702, 68933],   // Hadar - Menkent

  // ── Crux / Southern Cross (1 line) ──
  [60718, 62434],   // Acrux - Mimosa

  // ── Andromeda (2 lines) ──
  [677, 5447],      // Alpheratz - Mirach
  [5447, 9640],     // Mirach - Almach

  // ── Pegasus / Great Square (3 lines) ──
  [677, 1067],      // Alpheratz - Algenib
  [1067, 113963],   // Algenib - Scheat
  [113963, 113881], // Scheat - Markab

  // ── Perseus (1 line) ──
  [15863, 14576],   // Mirfak - Algol

  // ── Leo (4 lines) ──
  [49669, 50583],   // Regulus - Eta Leo
  [57632, 54872],   // Denebola - Zosma

  // ── Virgo (1 line) ──
  [61941, 65474],   // Porrima - Spica

  // ── Boötes (2 lines) ──
  [69673, 72105],   // Arcturus - Izar
  [69673, 69974],   // Arcturus - Muphrid

  // ── Corona Borealis (1 line) ──
  [76267, 75097],   // Alphecca - Pherkad

  // ── Aquarius (1 line) ──
  [106278, 109074], // Sadalsuud - Sadalmelik

  // ── Ursa Minor / Little Dipper (2 lines) ──
  [11767, 74785],   // Polaris - Kochab

  // ── Aries (2 lines) ──
  [9884, 8903],     // Hamal - Sheratan
  [8903, 8832],     // Sheratan - Mesartim

  // ── Pisces area ──
  [113368, 113963], // Fomalhaut toward Pegasus direction

  // ── Eridanus (1 line) ──
  [7588, 16537],    // Achernar - Epsilon Eridani direction

  // ── Corvus (1 line) ──
  [59803, 60965],   // Gienah - Algorab

  // ── Ophiuchus (1 line) ──
  [86032, 84012],   // Rasalhague - Sabik
];
