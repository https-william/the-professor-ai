
import React, { createContext, useContext, useEffect, useState } from 'react';

// Simplified Theme - Dark mode only for The Professor
// The app is designed exclusively for dark mode with glass effects
type Theme = 'Dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'Dark',
  setTheme: () => { },
  isDark: true, // Always true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Force dark mode - no light theme option
  const [theme] = useState<Theme>('Dark');
  const isDark = true; // Always dark

  useEffect(() => {
    const root = document.documentElement;

    // Always apply dark mode
    root.classList.add('dark');
    root.classList.remove('light');

    // Update meta theme-color for mobile browsers (dark only)
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#050505");
    }

    // Store preference (always dark)
    localStorage.setItem('app_theme', 'Dark');
  }, []);

  // setTheme is a no-op since we only support dark mode
  const setTheme = () => {
    // Dark mode only - ignore theme changes
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
