import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// Using Radix's "Crimson" color scale to match your app's red theme.
const radixCrimson = {
  crimson1: '#fffcfc', // App background (very light)
  crimson2: '#fff9f9', // UI element background (cards, etc.)
  crimson3: '#fdeff0', // Hover states
  crimson4: '#fce5e6', // Borders
  crimson5: '#f9d8da',
  crimson6: '#f4c8cb', // Subtle borders and separators
  crimson7: '#ecb4b9',
  crimson8: '#e19da3',
  crimson9: '#e54857', // The main interactive red color (primary)
  crimson10: '#de3b4c',
  crimson11: '#d6293e', // A darker red for text and highlights
  crimson12: '#381316', // Dark, rich text color
};

export const appTheme = {
  ...DefaultTheme,
  roundness: 2, // You can adjust the default border radius
  colors: {
    ...DefaultTheme.colors,
    primary: radixCrimson.crimson9,                  // Main interactive color for buttons, icons
    onPrimary: '#ffffff',                          // Text on top of the primary color
    primaryContainer: radixCrimson.crimson3,         // Background for elements needing emphasis
    onPrimaryContainer: radixCrimson.crimson11,      // Text on the primary container
    secondary: radixCrimson.crimson7,                // Secondary actions
    onSecondary: radixCrimson.crimson12,
    secondaryContainer: radixCrimson.crimson2,
    onSecondaryContainer: radixCrimson.crimson11,
    background: radixCrimson.crimson1,               // App background
    surface: radixCrimson.crimson2,                  // Card backgrounds
    onSurface: radixCrimson.crimson12,               // Main body text color
    surfaceVariant: radixCrimson.crimson3,           // Dividers, outlines
    onSurfaceVariant: radixCrimson.crimson11,        // Secondary text color (less important text)
    outline: radixCrimson.crimson6,                  // Borders for text inputs, cards
    elevation: {
      ...DefaultTheme.colors.elevation,
      level2: radixCrimson.crimson2, // Default card elevation color
    },
  },
};