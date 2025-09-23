const lightColors = {
  background: '#f0f0f0',
  text: '#000000',
  subText: '#800000',
  subText2: '#8d0000',
  image: '#800000',
  mentionText: '#740000',
  navBar: '#f0f0f0',
  border: '#800000',
  active: '#740000',
  passive: '#9a0000'
};

const darkColors = {
  background: '#111111',
  text: '#ffffff',
  subText: '#777777',
  subText2: '#999999',
  image: '#777777',
  mentionText: '#e18d58',
  navBar: '#333333',
  border: '#f0f0f0',
  active: '#777777',
  passive: '#555555'
};

export default {
  light: lightColors,
  dark: darkColors,
} as const;

export type ThemeColors = typeof lightColors;
export type ColorTheme = 'light' | 'dark'; 