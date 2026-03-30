'use client';
// Backward compatibility — re-export from new store location
// Components that import from '@/lib/useStore' will continue to work
export { useStarStore as useStore } from './stores/starStore';
