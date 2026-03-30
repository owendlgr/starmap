import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Mission, LaunchSite } from '@/lib/types';

/* ── Fallback dataset: ~50 real landmark missions across all agencies ── */

const FALLBACK_MISSIONS: Mission[] = [
  // NASA - Apollo Program
  { id: 'apollo-11', name: 'Apollo 11', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '1969-07-16T13:32:00Z', rocket: 'Saturn V', orbit: 'Lunar Orbit', description: 'First crewed Moon landing. Neil Armstrong and Buzz Aldrin walked on the lunar surface.', launchSite: { name: 'LC-39A, Kennedy Space Center', latitude: 28.6083, longitude: -80.6041 } },
  { id: 'apollo-13', name: 'Apollo 13', agency: 'NASA', agencyCountry: 'USA', status: 'Partial Failure', date: '1970-04-11T19:13:00Z', rocket: 'Saturn V', orbit: 'Lunar Orbit', description: 'Mission aborted after oxygen tank explosion. Crew returned safely to Earth.', launchSite: { name: 'LC-39A, Kennedy Space Center', latitude: 28.6083, longitude: -80.6041 } },
  { id: 'sts-1', name: 'STS-1 Columbia', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '1981-04-12T12:00:03Z', rocket: 'Space Shuttle', orbit: 'Low Earth Orbit', description: 'First Space Shuttle mission. Columbia orbited Earth 37 times.', launchSite: { name: 'LC-39A, Kennedy Space Center', latitude: 28.6083, longitude: -80.6041 } },
  { id: 'sts-31', name: 'STS-31 Discovery (Hubble)', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '1990-04-24T12:33:51Z', rocket: 'Space Shuttle', orbit: 'Low Earth Orbit', description: 'Deployed the Hubble Space Telescope into orbit.', launchSite: { name: 'LC-39B, Kennedy Space Center', latitude: 28.6272, longitude: -80.6208 } },
  { id: 'mars-perseverance', name: 'Mars 2020 (Perseverance)', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '2020-07-30T11:50:00Z', rocket: 'Atlas V 541', orbit: 'Heliocentric', description: 'Mars rover mission carrying Ingenuity helicopter. Landed in Jezero Crater.', launchSite: { name: 'SLC-41, Cape Canaveral', latitude: 28.5833, longitude: -80.5830 } },
  { id: 'jwst', name: 'James Webb Space Telescope', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '2021-12-25T12:20:00Z', rocket: 'Ariane 5 ECA', orbit: 'Sun-Earth L2', description: 'Largest and most powerful space telescope ever launched. Joint NASA/ESA/CSA mission.', launchSite: { name: 'ELA-3, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },
  { id: 'artemis-1', name: 'Artemis I', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '2022-11-16T06:47:44Z', rocket: 'Space Launch System', orbit: 'Lunar Orbit', description: 'Uncrewed test flight of SLS and Orion around the Moon.', launchSite: { name: 'LC-39B, Kennedy Space Center', latitude: 28.6272, longitude: -80.6208 } },
  { id: 'voyager-1', name: 'Voyager 1', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '1977-09-05T12:56:00Z', rocket: 'Titan IIIE', orbit: 'Heliocentric', description: 'Farthest human-made object from Earth. Visited Jupiter and Saturn.', launchSite: { name: 'SLC-41, Cape Canaveral', latitude: 28.5833, longitude: -80.5830 } },

  // Roscosmos / Soviet
  { id: 'sputnik-1', name: 'Sputnik 1', agency: 'RVSN USSR', agencyCountry: 'RUS', status: 'Success', date: '1957-10-04T19:28:34Z', rocket: 'Sputnik 8K71PS', orbit: 'Low Earth Orbit', description: 'First artificial satellite to orbit Earth. Started the Space Age.', launchSite: { name: 'Site 1/5, Baikonur Cosmodrome', latitude: 45.9200, longitude: 63.3420 } },
  { id: 'vostok-1', name: 'Vostok 1', agency: 'RVSN USSR', agencyCountry: 'RUS', status: 'Success', date: '1961-04-12T06:07:00Z', rocket: 'Vostok-K', orbit: 'Low Earth Orbit', description: 'First human spaceflight. Yuri Gagarin orbited Earth once.', launchSite: { name: 'Site 1/5, Baikonur Cosmodrome', latitude: 45.9200, longitude: 63.3420 } },
  { id: 'mir-launch', name: 'Mir Core Module', agency: 'Soviet Space Program', agencyCountry: 'RUS', status: 'Success', date: '1986-02-20T21:28:23Z', rocket: 'Proton-K', orbit: 'Low Earth Orbit', description: 'Launch of the Mir space station core module.', launchSite: { name: 'Site 200/39, Baikonur Cosmodrome', latitude: 46.0290, longitude: 63.0420 } },
  { id: 'soyuz-ms-22', name: 'Soyuz MS-22', agency: 'Roscosmos', agencyCountry: 'RUS', status: 'Success', date: '2022-09-21T13:54:49Z', rocket: 'Soyuz 2.1a', orbit: 'Low Earth Orbit', description: 'Crewed mission to the International Space Station.', launchSite: { name: 'Site 31/6, Baikonur Cosmodrome', latitude: 45.9960, longitude: 63.5640 } },
  { id: 'proton-nauka', name: 'Proton-M | Nauka', agency: 'Roscosmos', agencyCountry: 'RUS', status: 'Success', date: '2021-07-21T14:58:25Z', rocket: 'Proton-M', orbit: 'Low Earth Orbit', description: 'ISS Multipurpose Laboratory Module (Nauka).', launchSite: { name: 'Site 200/39, Baikonur Cosmodrome', latitude: 46.0290, longitude: 63.0420 } },

  // SpaceX
  { id: 'falcon1-flight4', name: 'Falcon 1 | Flight 4 (RatSat)', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2008-09-28T23:15:00Z', rocket: 'Falcon 1', orbit: 'Low Earth Orbit', description: 'First privately funded liquid-fueled rocket to reach orbit.', launchSite: { name: 'Omelek Island', latitude: 9.0477, longitude: 167.7431 } },
  { id: 'crs-1', name: 'Falcon 9 | SpX CRS-1', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2012-10-08T00:35:00Z', rocket: 'Falcon 9', orbit: 'Low Earth Orbit', description: 'First operational ISS resupply mission by SpaceX.', launchSite: { name: 'SLC-40, Cape Canaveral', latitude: 28.5618, longitude: -80.5770 } },
  { id: 'dm-2', name: 'Falcon 9 | Crew Dragon Demo-2', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2020-05-30T19:22:45Z', rocket: 'Falcon 9', orbit: 'Low Earth Orbit', description: 'First crewed orbital spaceflight by a commercial company. Carried NASA astronauts to ISS.', launchSite: { name: 'LC-39A, Kennedy Space Center', latitude: 28.6083, longitude: -80.6041 } },
  { id: 'starlink-6-1', name: 'Falcon 9 | Starlink Group 6-1', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2023-02-27T12:13:00Z', rocket: 'Falcon 9', orbit: 'Low Earth Orbit', description: 'Batch deployment of Starlink internet satellites.', launchSite: { name: 'SLC-40, Cape Canaveral', latitude: 28.5618, longitude: -80.5770 } },
  { id: 'fh-1', name: 'Falcon Heavy | Demo Flight', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2018-02-06T20:45:00Z', rocket: 'Falcon Heavy', orbit: 'Heliocentric', description: 'First flight of Falcon Heavy. Launched a Tesla Roadster into heliocentric orbit.', launchSite: { name: 'LC-39A, Kennedy Space Center', latitude: 28.6083, longitude: -80.6041 } },
  { id: 'ift-4', name: 'Starship | IFT-4', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2024-06-06T12:50:00Z', rocket: 'Starship', orbit: 'Suborbital', description: 'Fourth integrated flight test of Starship/Super Heavy. Both stages achieved controlled splashdown.', launchSite: { name: 'Starbase, Boca Chica', latitude: 25.9972, longitude: -97.1560 } },
  { id: 'ift-5', name: 'Starship | IFT-5', agency: 'SpaceX', agencyCountry: 'USA', status: 'Success', date: '2024-10-13T12:25:00Z', rocket: 'Starship', orbit: 'Suborbital', description: 'Fifth integrated flight test. First successful booster catch by Mechazilla tower.', launchSite: { name: 'Starbase, Boca Chica', latitude: 25.9972, longitude: -97.1560 } },

  // ESA / Arianespace
  { id: 'ariane5-maiden', name: 'Ariane 5 | V88 (Maiden Flight)', agency: 'Arianespace', agencyCountry: 'FRA', status: 'Failed', date: '1996-06-04T12:33:59Z', rocket: 'Ariane 5 G', orbit: 'Geostationary Transfer Orbit', description: 'First flight of Ariane 5. Failed 37 seconds after launch due to software error.', launchSite: { name: 'ELA-3, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },
  { id: 'ariane5-va256', name: 'Ariane 5 | VA256 (JWST)', agency: 'Arianespace', agencyCountry: 'FRA', status: 'Success', date: '2021-12-25T12:20:00Z', rocket: 'Ariane 5 ECA', orbit: 'Sun-Earth L2', description: 'Launched the James Webb Space Telescope on Christmas Day 2021.', launchSite: { name: 'ELA-3, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },
  { id: 'ariane6-maiden', name: 'Ariane 6 | Maiden Flight', agency: 'Arianespace', agencyCountry: 'FRA', status: 'Partial Failure', date: '2024-07-09T19:00:00Z', rocket: 'Ariane 62', orbit: 'Low Earth Orbit', description: 'First flight of Ariane 6. Upper stage APU anomaly prevented final deorbit burn.', launchSite: { name: 'ELA-4, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },
  { id: 'rosetta', name: 'Rosetta', agency: 'European Space Agency', agencyCountry: 'FRA', status: 'Success', date: '2004-03-02T07:17:51Z', rocket: 'Ariane 5 G+', orbit: 'Heliocentric', description: 'First spacecraft to orbit a comet and deploy a lander (Philae) on its surface.', launchSite: { name: 'ELA-3, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },
  { id: 'vega-c-maiden', name: 'Vega-C | Maiden Flight', agency: 'Arianespace', agencyCountry: 'FRA', status: 'Success', date: '2022-07-13T13:13:00Z', rocket: 'Vega-C', orbit: 'Low Earth Orbit', description: 'First flight of the Vega-C rocket carrying LARES-2.', launchSite: { name: 'ZLV, Guiana Space Centre', latitude: 5.2360, longitude: -52.7686 } },

  // ISRO (India)
  { id: 'chandrayaan-3', name: 'Chandrayaan-3', agency: 'Indian Space Research Organization', agencyCountry: 'IND', status: 'Success', date: '2023-07-14T09:05:17Z', rocket: 'LVM3', orbit: 'Lunar Orbit', description: 'Third Indian lunar mission. Successfully landed near the lunar south pole.', launchSite: { name: 'Second Launch Pad, Satish Dhawan', latitude: 13.7199, longitude: 80.2304 } },
  { id: 'mangalyaan', name: 'Mars Orbiter Mission (Mangalyaan)', agency: 'Indian Space Research Organization', agencyCountry: 'IND', status: 'Success', date: '2013-11-05T09:08:00Z', rocket: 'PSLV-XL', orbit: 'Heliocentric', description: 'India\'s first interplanetary mission. Reached Mars orbit on first attempt.', launchSite: { name: 'First Launch Pad, Satish Dhawan', latitude: 13.7330, longitude: 80.2350 } },
  { id: 'pslv-c37', name: 'PSLV-C37 (104 Satellites)', agency: 'Indian Space Research Organization', agencyCountry: 'IND', status: 'Success', date: '2017-02-15T03:58:00Z', rocket: 'PSLV-XL', orbit: 'Sun-Synchronous Orbit', description: 'Set world record by launching 104 satellites in a single mission.', launchSite: { name: 'First Launch Pad, Satish Dhawan', latitude: 13.7330, longitude: 80.2350 } },
  { id: 'aditya-l1', name: 'Aditya-L1', agency: 'Indian Space Research Organization', agencyCountry: 'IND', status: 'Success', date: '2023-09-02T06:20:00Z', rocket: 'PSLV-XL', orbit: 'Sun-Earth L1', description: 'India\'s first solar observation mission, placed at Sun-Earth L1 point.', launchSite: { name: 'Second Launch Pad, Satish Dhawan', latitude: 13.7199, longitude: 80.2304 } },

  // JAXA (Japan)
  { id: 'h2a-f26', name: 'H-IIA F26 (Hayabusa2)', agency: 'JAXA', agencyCountry: 'JPN', status: 'Success', date: '2014-12-03T04:22:04Z', rocket: 'H-IIA 202', orbit: 'Heliocentric', description: 'Asteroid sample-return mission to Ryugu. Successfully returned samples in 2020.', launchSite: { name: 'LA-Y1, Tanegashima', latitude: 30.4010, longitude: 131.0090 } },
  { id: 'slim', name: 'H-IIA F47 (SLIM)', agency: 'JAXA', agencyCountry: 'JPN', status: 'Success', date: '2023-09-07T00:42:11Z', rocket: 'H-IIA 202', orbit: 'Lunar Orbit', description: 'Smart Lander for Investigating Moon. Japan became 5th country to land on the Moon.', launchSite: { name: 'LA-Y1, Tanegashima', latitude: 30.4010, longitude: 131.0090 } },
  { id: 'h3-tf2', name: 'H3 TF2', agency: 'JAXA', agencyCountry: 'JPN', status: 'Success', date: '2024-02-17T00:22:55Z', rocket: 'H3', orbit: 'Sun-Synchronous Orbit', description: 'Second test flight of H3 rocket. First successful orbital insertion.', launchSite: { name: 'LA-Y2, Tanegashima', latitude: 30.4010, longitude: 131.0090 } },

  // CNSA (China)
  { id: 'chang-e-5', name: "Chang'e 5", agency: 'China Aerospace Science and Technology Corporation', agencyCountry: 'CHN', status: 'Success', date: '2020-11-23T20:30:00Z', rocket: 'Long March 5', orbit: 'Lunar Orbit', description: 'Lunar sample-return mission. Returned 1,731g of lunar material.', launchSite: { name: 'LC-101, Wenchang', latitude: 19.6145, longitude: 110.9510 } },
  { id: 'tianwen-1', name: 'Tianwen-1', agency: 'China Aerospace Science and Technology Corporation', agencyCountry: 'CHN', status: 'Success', date: '2020-07-23T04:41:15Z', rocket: 'Long March 5', orbit: 'Heliocentric', description: 'China\'s first Mars mission. Successfully landed Zhurong rover on Mars.', launchSite: { name: 'LC-101, Wenchang', latitude: 19.6145, longitude: 110.9510 } },
  { id: 'css-tianhe', name: 'Long March 5B | Tianhe', agency: 'China Aerospace Science and Technology Corporation', agencyCountry: 'CHN', status: 'Success', date: '2021-04-29T03:23:15Z', rocket: 'Long March 5B', orbit: 'Low Earth Orbit', description: 'Core module of the Chinese Space Station (Tiangong).', launchSite: { name: 'LC-101, Wenchang', latitude: 19.6145, longitude: 110.9510 } },
  { id: 'shenzhou-16', name: 'Shenzhou 16', agency: 'China Aerospace Science and Technology Corporation', agencyCountry: 'CHN', status: 'Success', date: '2023-05-30T01:31:00Z', rocket: 'Long March 2F', orbit: 'Low Earth Orbit', description: 'Crewed mission to the Tiangong space station.', launchSite: { name: 'SLS-1, Jiuquan', latitude: 40.9581, longitude: 100.2913 } },
  { id: 'cz-6a', name: 'Long March 6A | Maiden Flight', agency: 'China Aerospace Science and Technology Corporation', agencyCountry: 'CHN', status: 'Success', date: '2022-03-29T09:50:00Z', rocket: 'Long March 6A', orbit: 'Sun-Synchronous Orbit', description: 'First flight of Long March 6A with solid rocket boosters.', launchSite: { name: 'LC-16, Taiyuan', latitude: 38.8490, longitude: 111.6080 } },

  // Rocket Lab
  { id: 'rocketlab-its-a-test', name: "Electron | It's a Test", agency: 'Rocket Lab', agencyCountry: 'NZL', status: 'Partial Failure', date: '2017-05-25T04:20:00Z', rocket: 'Electron', orbit: 'Low Earth Orbit', description: 'First Electron launch from Mahia Peninsula, New Zealand.', launchSite: { name: 'LC-1A, Mahia Peninsula', latitude: -39.2615, longitude: 177.8648 } },
  { id: 'rocketlab-capstone', name: 'Electron | CAPSTONE', agency: 'Rocket Lab', agencyCountry: 'NZL', status: 'Success', date: '2022-06-28T09:55:00Z', rocket: 'Electron', orbit: 'Lunar Transfer', description: 'NASA CAPSTONE CubeSat mission to test lunar Gateway orbit.', launchSite: { name: 'LC-1A, Mahia Peninsula', latitude: -39.2615, longitude: 177.8648 } },

  // ULA
  { id: 'vulcan-cert-1', name: 'Vulcan Centaur | Cert-1 (Peregrine)', agency: 'United Launch Alliance', agencyCountry: 'USA', status: 'Success', date: '2024-01-08T07:18:00Z', rocket: 'Vulcan Centaur', orbit: 'Lunar Transfer', description: 'Maiden flight of Vulcan Centaur carrying Astrobotic Peregrine lunar lander.', launchSite: { name: 'SLC-41, Cape Canaveral', latitude: 28.5833, longitude: -80.5830 } },

  // Blue Origin
  { id: 'new-glenn-1', name: 'New Glenn | NG-1', agency: 'Blue Origin', agencyCountry: 'USA', status: 'Success', date: '2025-01-13T07:03:00Z', rocket: 'New Glenn', orbit: 'Medium Earth Orbit', description: 'Maiden flight of New Glenn. Booster landing attempt was unsuccessful but payload reached orbit.', launchSite: { name: 'LC-36, Cape Canaveral', latitude: 28.4694, longitude: -80.5370 } },

  // South Korea
  { id: 'nuri-3', name: 'KSLV-II Nuri | Flight 3', agency: 'Korea Aerospace Research Institute', agencyCountry: 'KOR', status: 'Success', date: '2023-05-25T09:24:00Z', rocket: 'KSLV-II Nuri', orbit: 'Sun-Synchronous Orbit', description: 'Third Nuri flight carrying 8 satellites. First operational mission.', launchSite: { name: 'LC-2, Naro Space Center', latitude: 34.4316, longitude: 127.5350 } },

  // ISS Assembly
  { id: 'zarya', name: 'Proton-K | Zarya (ISS)', agency: 'Roscosmos', agencyCountry: 'RUS', status: 'Success', date: '1998-11-20T06:40:00Z', rocket: 'Proton-K', orbit: 'Low Earth Orbit', description: 'First ISS module launched. Functional Cargo Block (FGB) built by Russia for NASA.', launchSite: { name: 'Site 81/23, Baikonur Cosmodrome', latitude: 46.0710, longitude: 63.0430 } },

  // Historic
  { id: 'explorer-1', name: 'Explorer 1', agency: 'NASA', agencyCountry: 'USA', status: 'Success', date: '1958-02-01T03:48:00Z', rocket: 'Juno I', orbit: 'Low Earth Orbit', description: 'First US satellite. Discovered the Van Allen radiation belts.', launchSite: { name: 'LC-26A, Cape Canaveral', latitude: 28.4689, longitude: -80.5324 } },
  { id: 'gaganyaan-tv-d1', name: 'GSLV Mk III | TV-D1 (Gaganyaan Abort)', agency: 'Indian Space Research Organization', agencyCountry: 'IND', status: 'Success', date: '2023-10-21T04:30:00Z', rocket: 'LVM3 (Test Vehicle)', orbit: 'Suborbital', description: 'Gaganyaan crew escape system test. Verified abort procedures for India\'s human spaceflight program.', launchSite: { name: 'Second Launch Pad, Satish Dhawan', latitude: 13.7199, longitude: 80.2304 } },
];

/* ── In-memory cache ────────────────────────────────────────── */

let cachedData: { missions: Mission[]; launchSites: LaunchSite[] } | null = null;
let cacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/* ── Normalize LL2 data to our Mission type ─────────────────── */

interface LL2Result {
  id: string;
  name: string;
  net: string;
  status?: { name?: string };
  launch_service_provider?: { name?: string; country_code?: string };
  rocket?: { configuration?: { name?: string } };
  pad?: { name?: string; latitude?: string; longitude?: string };
  mission?: { description?: string; orbit?: { name?: string } };
  image?: string;
}

function normalizeLL2(results: LL2Result[]): Mission[] {
  return results.map((r) => {
    const pad = r.pad ?? {};
    const provider = r.launch_service_provider ?? {};
    const mission = r.mission ?? {};
    const orbit = mission.orbit ?? {};
    return {
      id: String(r.id),
      name: r.name ?? '',
      date: r.net ?? '',
      status: r.status?.name ?? 'Unknown',
      agency: provider.name ?? 'Unknown',
      agencyCountry: provider.country_code ?? '',
      rocket: r.rocket?.configuration?.name ?? 'Unknown',
      orbit: orbit.name ?? '',
      description: mission.description ?? '',
      imageUrl: r.image ?? '',
      launchSite: {
        name: pad.name ?? 'Unknown',
        latitude: parseFloat(pad.latitude ?? '0') || 0,
        longitude: parseFloat(pad.longitude ?? '0') || 0,
      },
    };
  });
}

/* ── Derive launch sites from missions ──────────────────────── */

function deriveLaunchSites(missions: Mission[]): LaunchSite[] {
  const siteMap = new Map<string, LaunchSite>();
  for (const m of missions) {
    const key = `${m.launchSite.latitude.toFixed(1)},${m.launchSite.longitude.toFixed(1)}`;
    if (!siteMap.has(key)) {
      siteMap.set(key, {
        id: key,
        name: m.launchSite.name,
        country: m.agencyCountry ?? '',
        latitude: m.launchSite.latitude,
        longitude: m.launchSite.longitude,
        launchCount: 1,
      });
    } else {
      siteMap.get(key)!.launchCount = (siteMap.get(key)!.launchCount ?? 0) + 1;
    }
  }
  return Array.from(siteMap.values());
}

/* ── Try loading pre-fetched data from public/data/missions.json ── */

async function loadLocalData(): Promise<Mission[] | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'missions.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      // Data from the Python script is already in our format
      return data as Mission[];
    }
    return null;
  } catch {
    return null;
  }
}

/* ── Try fetching live from Launch Library 2 ────────────────── */

async function fetchLL2(): Promise<Mission[] | null> {
  try {
    // Fetch past launches (these have real status data like Success/Failed)
    const previousUrl = 'https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=80&offset=0&ordering=-net';
    const upcomingUrl = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20&offset=0&ordering=net';

    const [previousRes, upcomingRes] = await Promise.all([
      fetch(previousUrl, {
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(10000),
      }),
      fetch(upcomingUrl, {
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(10000),
      }).catch(() => null),
    ]);

    if (!previousRes.ok) return null;
    const previousData = await previousRes.json();
    const previousResults: LL2Result[] = previousData.results ?? [];

    let upcomingResults: LL2Result[] = [];
    if (upcomingRes && upcomingRes.ok) {
      const upcomingData = await upcomingRes.json();
      upcomingResults = upcomingData.results ?? [];
    }

    const allResults = [...previousResults, ...upcomingResults];
    if (allResults.length === 0) return null;
    return normalizeLL2(allResults);
  } catch {
    return null;
  }
}

/* ── GET handler ────────────────────────────────────────────── */

export async function GET() {
  try {
    const now = Date.now();
    if (cachedData && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
      });
    }

    // Strategy: local file > LL2 API > fallback
    let missions = await loadLocalData();

    if (!missions || missions.length === 0) {
      missions = await fetchLL2();
    }

    if (!missions || missions.length === 0) {
      missions = FALLBACK_MISSIONS;
    }

    // Sort by date descending
    missions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const launchSites = deriveLaunchSites(missions);

    cachedData = { missions, launchSites };
    cacheTime = now;

    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch mission data:', error);

    // Return fallback data even on error
    const missions = [...FALLBACK_MISSIONS].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const launchSites = deriveLaunchSites(missions);
    return NextResponse.json(
      { missions, launchSites },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=60' },
      }
    );
  }
}
