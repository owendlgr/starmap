'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/useStore';
import type { SearchEntry } from '@/lib/types';

export function SearchBar() {
  const { stars, setSelected, showSearch, setShowSearch } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, setShowSearch]);

  useEffect(() => {
    if (showSearch && inputRef.current) inputRef.current.focus();
  }, [showSearch]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lq = q.toLowerCase();
    const hits = stars
      .filter(s => s.name.toLowerCase().includes(lq))
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 8)
      .map(s => ({ id: s.id, name: s.name, type: s.type, mag: s.mag, dist_pc: s.dist_pc }));
    setResults(hits);
  }, [stars]);

  const select = useCallback((id: number) => {
    const star = stars.find(s => s.id === id);
    if (star) {
      setSelected(star);
      setShowSearch(false);
      setQuery('');
      setResults([]);
    }
  }, [stars, setSelected, setShowSearch]);

  if (!showSearch) {
    return (
      <button className="search-trigger" onClick={() => setShowSearch(true)} title="Search (/)">
        <span className="search-icon">⌕</span>
        <span className="search-hint">Search stars  <kbd>/</kbd></span>
      </button>
    );
  }

  return (
    <div className="search-overlay">
      <div className="search-box">
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search stars, galaxies, nebulae…"
          value={query}
          onChange={e => search(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="search-close" onClick={() => { setShowSearch(false); setQuery(''); setResults([]); }}>
          ✕
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
          <div className="search-empty">No matches for "{query}"</div>
        </div>
      )}
    </div>
  );
}
