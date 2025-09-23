import React, { createContext, useContext, useState, useEffect } from 'react';
import colors, { ColorTheme, ThemeColors } from './colors';

interface ThemeContextType {
  theme: ColorTheme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ColorTheme>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ColorTheme | null;
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      // Ensure light theme is applied
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const value = {
    theme,
    colors: colors[theme],
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 