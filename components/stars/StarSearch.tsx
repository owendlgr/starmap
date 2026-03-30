'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/useStore';
import { useAppStore } from '@/lib/stores/appStore';

export function StarSearch() {
  const { stars, setSelected } = useStore();
  const showSearch = useAppStore((s) => s.showSearch);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: number; name: string; type: string; mag: number; dist_pc: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSearch && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') { setShowSearch(false); setQuery(''); setResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, setShowSearch]);

  useEffect(() => {
    if (showSearch) inputRef.current?.focus();
  }, [showSearch]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    setResults(
      stars
        .filter(s => s.name.toLowerCase().includes(lq))
        .sort((a, b) => a.mag - b.mag)
        .slice(0, 8)
        .map(s => ({ id: s.id, name: s.name, type: s.type, mag: s.mag, dist_pc: s.dist_pc }))
    );
  }, [stars]);

  const select = useCallback((id: number) => {
    const star = stars.find(s => s.id === id);
    if (star) { setSelected(star); setShowSearch(false); setQuery(''); setResults([]); }
  }, [stars, setSelected, setShowSearch]);

  if (!showSearch) return null;

  return (
    <div className="search-overlay">
      <div className="search-box">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search stars by name or HIP number..."
          value={query}
          onChange={e => search(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="search-close" onClick={() => { setShowSearch(false); setQuery(''); setResults([]); }}>
          {'\u2715'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="search-results">
          {results.map(r => (
            <button key={r.id} className="search-result" onClick={() => select(r.id)}>
              <span className="result-name">{r.name}</span>
              <span className="result-meta">{r.type} · {r.dist_pc === 0 ? 'here' : `${r.dist_pc.toFixed(0)} pc`} · mag {r.mag.toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="search-results">
          <div className="search-empty">No matches for &ldquo;{query}&rdquo;</div>
        </div>
      )}
    </div>
  );
}
