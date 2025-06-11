import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to handle media queries
 * @param query The media query string to match against
 * @param defaultValue Default value to use on first render (server-side)
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  // Initialize with default or calculated value
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return defaultValue;
  });

  // Check if the media query matches, safe for SSR
  const checkQuery = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return defaultValue;
  }, [query, defaultValue]);
  
  // Update matches state when media query changes
  useEffect(() => {
    // Ensure running in browser
    if (typeof window === 'undefined') return;
    
    // Force initial check to ensure state is accurate
    const initialValue = checkQuery();
    if (matches !== initialValue) {
      setMatches(initialValue);
    }
    
    // Set up listener for media query changes
    const mediaQuery = window.matchMedia(query);
    
    // Handler function for media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Modern API (newer browsers)
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query, matches, checkQuery]);
  
  return matches;
}

// Predefined media query breakpoints
export const breakpoints = {
  xs: '(max-width: 475px)',
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
  '2xl': '(max-width: 1536px)',
};