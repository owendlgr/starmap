import { NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const CHUNK_FILES = new Set([
  'stars_bright.json', 'stars_medium.json',
  'stars_faint.json', 'stars_deep.json', 'stars_index.json',
]);

// Detect schema fields from a parsed JSON array
function detectFields(arr: unknown[]): string[] {
  if (!arr.length) return [];
  const obj = arr[0];
  if (typeof obj !== 'object' || obj === null) return [];
  return Object.keys(obj as Record<string, unknown>);
}

// Parse CSV/TSV into array of objects
function parseDsv(text: string, sep: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(sep).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(sep);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
    return obj;
  });
}

export async function GET() {
  const dataDir = join(process.cwd(), 'public', 'data');
  const extra: { file: string; type: string; count: number; fields: string[] }[] = [];

  try {
    const files = readdirSync(dataDir);
    for (const file of files) {
      if (CHUNK_FILES.has(file)) continue;
      const ext = file.split('.').pop()?.toLowerCase() || '';
      const fullPath = join(dataDir, file);
      try {
        if (ext === 'json') {
          const raw = readFileSync(fullPath, 'utf8');
          const parsed = JSON.parse(raw);
          const arr = Array.isArray(parsed) ? parsed : (parsed.stars || parsed.data || parsed.objects || []);
          extra.push({ file, type: 'json', count: arr.length, fields: detectFields(arr) });
        } else if (ext === 'csv') {
          const raw = readFileSync(fullPath, 'utf8');
          const rows = parseDsv(raw, ',');
          extra.push({ file, type: 'csv', count: rows.length, fields: detectFields(rows) });
        } else if (ext === 'tsv' || ext === 'txt') {
          const raw = readFileSync(fullPath, 'utf8');
          const rows = parseDsv(raw, '\t');
          extra.push({ file, type: 'tsv', count: rows.length, fields: detectFields(rows) });
        }
      } catch { /* skip unreadable files */ }
    }
  } catch { /* data dir missing */ }

  return NextResponse.json({ extra: extra.map(e => `${e.file} (${e.type}, ${e.count} records, fields: ${e.fields.slice(0, 6).join(', ')})`) });
}
