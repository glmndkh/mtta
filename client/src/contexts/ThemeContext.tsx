import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Util: safely read localStorage (won't crash SSR/iframe)
function safeGet(key: string): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; } catch { return null; }
}
function safeSet(key: string, val: string) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, val); } catch { /* ignore */ }
}

// Apply to <html>: both data-theme and .dark class for broad compatibility
function applyThemeToDocument(t: Theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  
  console.log('Document data-theme before:', el.getAttribute('data-theme'));
  
  // Remove existing theme classes and attributes
  el.classList.remove('light', 'dark');
  
  // Set new theme
  el.setAttribute('data-theme', t);
  el.classList.add(t);
  
  // Also set the class for Tailwind compatibility
  if (t === 'dark') {
    el.classList.add('dark');
  } else {
    el.classList.remove('dark');
  }
  
  console.log('Document data-theme after:', el.getAttribute('data-theme'));
  console.log('Applied theme to document:', t, 'data-theme:', el.getAttribute('data-theme'), 'has dark class:', el.classList.contains('dark'));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 1) Initial theme: try persisted, else system preference, else 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = safeGet('mtta-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // 2) On mount: ensure DOM reflects initial state immediately
  useEffect(() => {
    applyThemeToDocument(theme);
  }, []); // run once so first paint is correct

  // 3) Whenever theme changes: persist + apply
  useEffect(() => {
    console.log('Setting theme to:', theme);
    safeSet('mtta-theme', theme);
    applyThemeToDocument(theme);
    // Nudge CSS var if you rely on it for debugging/forcing recompute
    document?.documentElement.style.setProperty('--theme-debug', theme);
    // Force a reflow to ensure styles are applied
    document?.documentElement.offsetHeight;
  }, [theme]);

  const toggleTheme = () => {
    console.log('Theme toggle clicked, current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}