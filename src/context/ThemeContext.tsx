import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';
export type AccentColor = 'indigo' | 'academic-gold' | 'emerald' | 'crimson' | 'slate';

export interface AccentOption {
  id: AccentColor;
  name: string;
  description: string;
  previewColor: string;
  secondaryColor: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'indigo',
    name: 'Modern Indigo',
    description: 'Electric indigo with vivid cyan/teal accents',
    previewColor: '#4f46e5',
    secondaryColor: '#0d9488'
  },
  {
    id: 'academic-gold',
    name: 'Academic Gold & Navy',
    description: 'Prestigious deep navy with warm amber/gold accents',
    previewColor: '#d97706',
    secondaryColor: '#0284c7'
  },
  {
    id: 'emerald',
    name: 'Emerald Campus',
    description: 'Classic collegiate forest green with fresh sage',
    previewColor: '#059669',
    secondaryColor: '#10b981'
  },
  {
    id: 'crimson',
    name: 'Crimson Scholar',
    description: 'Distinguished academic ruby and rose highlights',
    previewColor: '#e11d48',
    secondaryColor: '#f43f5e'
  },
  {
    id: 'slate',
    name: 'Slate Minimalist',
    description: 'Clean monochrome steel with punchy cobalt highlight',
    previewColor: '#3b82f6',
    secondaryColor: '#64748b'
  }
];

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentColor) => void;
  toggleThemeMode: () => void;
  accentOptions: AccentOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = 'peerlens_theme_mode';
const STORAGE_KEY_ACCENT = 'peerlens_accent_color';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window === 'undefined') return 'indigo';
    const saved = localStorage.getItem(STORAGE_KEY_ACCENT) as AccentColor;
    if (ACCENT_OPTIONS.some(a => a.id === saved)) return saved;
    return 'indigo';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Watch system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    
    // Modern addEventListener with fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // @ts-ignore - legacy support
      mediaQuery.addListener(handler);
      // @ts-ignore
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const effectiveTheme: EffectiveTheme = themeMode === 'system' 
    ? (systemIsDark ? 'dark' : 'light') 
    : themeMode;

  // Apply theme attributes to <html> whenever they change
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', accentColor);
    root.classList.toggle('dark', effectiveTheme === 'dark');
  }, [effectiveTheme, accentColor]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch (e) {
      console.warn('Failed to save theme mode to localStorage', e);
    }
  };

  const setAccentColor = (accent: AccentColor) => {
    setAccentColorState(accent);
    try {
      localStorage.setItem(STORAGE_KEY_ACCENT, accent);
    } catch (e) {
      console.warn('Failed to save accent color to localStorage', e);
    }
  };

  const toggleThemeMode = () => {
    setThemeMode(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        accentColor,
        setThemeMode,
        setAccentColor,
        toggleThemeMode,
        accentOptions: ACCENT_OPTIONS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
