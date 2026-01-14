
import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

type Theme = 'Light' | 'Dark' | 'System';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'System',
  setTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Attempt to load from storage or default to System
    const saved = localStorage.getItem('app_theme') as Theme;
    return saved === 'Light' || saved === 'Dark' ? saved : 'System';
  });

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let activeDark = false;
      if (theme === 'System') {
        activeDark = mediaQuery.matches;
      } else {
        activeDark = theme === 'Dark';
      }

      if (activeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
          metaThemeColor.setAttribute("content", activeDark ? "#050505" : "#F9F7F2");
      }

      setIsDark(activeDark);
    };

    applyTheme();
    localStorage.setItem('app_theme', theme);

    // Listen for system changes if in system mode
    const listener = () => {
      if (theme === 'System') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
