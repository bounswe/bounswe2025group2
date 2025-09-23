import React, { createContext, useContext, useState, ReactNode } from 'react';
import colors from '../constants/colors';

const ThemeContext = createContext({
  isDark: false,
  colors: colors.light,
  toggleTheme: () => {},
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? colors.dark : colors.light,
        toggleTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
