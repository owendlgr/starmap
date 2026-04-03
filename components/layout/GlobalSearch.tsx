'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/stores/appStore';

/**
 * GlobalSearch — full-screen overlay search (Cmd+K).
 * Searches across all sections: stars, planets, missions, galaxies.
 */
export function GlobalSearch() {
  const showSearch = useAppStore((s) => s.showSearch);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  if (!showSearch) return null;

  return (
    <div className="search-overlay-backdrop" onClick={() => setShowSearch(false)}>
      <div className="search-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search stars, planets, missions, galaxies…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSearch(false);
            }}
          />
          <button className="search-close" onClick={() => setShowSearch(false)}>ESC</button>
        </div>
        {searchQuery.length > 0 && (
          <div className="search-results">
            <div className="search-empty">
              Search across all space data — coming soon
            </div>
          </div>
        )}
        {searchQuery.length === 0 && (
          <div className="search-results">
            <div className="search-hints">
              <span className="search-hint-item">
                <kbd>1</kbd>–<kbd>5</kbd> Switch sections
              </span>
              <span className="search-hint-item">
                <kbd>Esc</kbd> Close
              </span>
              <span className="search-hint-item">
                Try: <em>Alpha Centauri</em>, <em>Jupiter</em>, <em>Voyager 1</em>, <em>Andromeda</em>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
