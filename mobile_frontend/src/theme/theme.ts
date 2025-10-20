import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// Original Radix Crimson color scale (backup theme)
const radixCrimson = {
  crimson1: '#fffcfc',
  crimson2: '#fff9f9',
  crimson3: '#fdeff0',
  crimson4: '#fce5e6',
  crimson5: '#f9d8da',
  crimson6: '#f4c8cb',
  crimson7: '#ecb4b9',
  crimson8: '#e19da3',
  crimson9: '#e54857',
  crimson10: '#de3b4c',
  crimson11: '#d6293e',
  crimson12: '#381316',
};

// Custom Red theme based on #800000 (maroon) - Your Generated Theme
const customRed = {
  red1: '#fffcfb',
  red2: '#fff7f5',
  red3: '#ffeae5',
  red4: '#ffd9d1',
  red5: '#ffcabf',
  red6: '#ffb7aa',
  red7: '#ffa090',
  red8: '#ff806f',
  red9: '#800000',  // Main maroon color matching old theme
  red10: '#952017',
  red11: '#c04537',
  red12: '#730000',
};

// Gray scale for neutral elements
const grayScale = {
  gray1: '#fcfcfd',
  gray2: '#f9f9fb',
  gray3: '#eff0f3',
  gray4: '#e7e8ec',
  gray5: '#e0e1e6',
  gray6: '#d8d9e0',
  gray7: '#cdced7',
  gray8: '#b9bbc6',
  gray9: '#8b8d98',
  gray10: '#80828d',
  gray11: '#62636c',
  gray12: '#1e1f24',
};

// Active theme - Switch between 'custom' and 'crimson'
const ACTIVE_THEME: 'custom' | 'crimson' = 'custom';

// Select color palette based on active theme
const colors = ACTIVE_THEME === 'custom' ? customRed : radixCrimson;
const mainColor = ACTIVE_THEME === 'custom' ? customRed.red9 : radixCrimson.crimson9;
const lightBg = ACTIVE_THEME === 'custom' ? customRed.red1 : radixCrimson.crimson1;
const cardBg = ACTIVE_THEME === 'custom' ? customRed.red2 : radixCrimson.crimson2;
const containerBg = ACTIVE_THEME === 'custom' ? customRed.red3 : radixCrimson.crimson3;
const borderColor = ACTIVE_THEME === 'custom' ? customRed.red6 : radixCrimson.crimson6;
const onContainerColor = ACTIVE_THEME === 'custom' ? customRed.red11 : radixCrimson.crimson11;
const darkTextColor = ACTIVE_THEME === 'custom' ? customRed.red12 : radixCrimson.crimson12;

export const appTheme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: mainColor,                      // Main interactive color (#800000 for custom)
    onPrimary: '#ffffff',                   
    primaryContainer: containerBg,           
    onPrimaryContainer: onContainerColor,    
    secondary: ACTIVE_THEME === 'custom' ? customRed.red7 : radixCrimson.crimson7,
    onSecondary: darkTextColor,
    secondaryContainer: cardBg,
    onSecondaryContainer: onContainerColor,
    background: lightBg,                     
    surface: cardBg,                         
    onSurface: darkTextColor,                
    surfaceVariant: containerBg,             
    onSurfaceVariant: onContainerColor,      
    outline: borderColor,                    
    elevation: {
      ...DefaultTheme.colors.elevation,
      level2: cardBg,
      level3: '#ffffff',
    },
  },
};

// Export themes for easy switching
export const themes = {
  custom: 'custom' as const,
  crimson: 'crimson' as const,
};

// Helper function to create theme with specific palette (for future use)
export const createThemeWithPalette = (palette: 'custom' | 'crimson') => {
  const themeColors = palette === 'custom' ? customRed : radixCrimson;
  const primary = palette === 'custom' ? customRed.red9 : radixCrimson.crimson9;
  
  return {
    ...DefaultTheme,
    roundness: 2,
    colors: {
      ...DefaultTheme.colors,
      primary,
      onPrimary: '#ffffff',
      primaryContainer: palette === 'custom' ? customRed.red3 : radixCrimson.crimson3,
      onPrimaryContainer: palette === 'custom' ? customRed.red11 : radixCrimson.crimson11,
      secondary: palette === 'custom' ? customRed.red7 : radixCrimson.crimson7,
      onSecondary: palette === 'custom' ? customRed.red12 : radixCrimson.crimson12,
      secondaryContainer: palette === 'custom' ? customRed.red2 : radixCrimson.crimson2,
      onSecondaryContainer: palette === 'custom' ? customRed.red11 : radixCrimson.crimson11,
      background: palette === 'custom' ? customRed.red1 : radixCrimson.crimson1,
      surface: palette === 'custom' ? customRed.red2 : radixCrimson.crimson2,
      onSurface: palette === 'custom' ? customRed.red12 : radixCrimson.crimson12,
      surfaceVariant: palette === 'custom' ? customRed.red3 : radixCrimson.crimson3,
      onSurfaceVariant: palette === 'custom' ? customRed.red11 : radixCrimson.crimson11,
      outline: palette === 'custom' ? customRed.red6 : radixCrimson.crimson6,
      elevation: {
        ...DefaultTheme.colors.elevation,
        level2: palette === 'custom' ? customRed.red2 : radixCrimson.crimson2,
        level3: '#ffffff',
      },
    },
  };
};