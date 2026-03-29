import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let index: { id: number; name: string; type: string; mag: number }[] | null = null;

function loadIndex() {
  if (index) return index;
  try {
    const raw = readFileSync(join(process.cwd(), 'public/data/stars_index.json'), 'utf8');
    index = JSON.parse(raw).stars;
    return index!;
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const all = loadIndex();
  const results = all
    .filter(s => s.name.toLowerCase().includes(q))
    .sort((a, b) => a.mag - b.mag)
    .slice(0, 10);

  return NextResponse.json({ results });
}
