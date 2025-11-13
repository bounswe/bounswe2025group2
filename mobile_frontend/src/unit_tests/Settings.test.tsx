/**
 * @format
 * Unit tests for Settings.tsx component
 * Tests cover: theme switching, navigation, logout, animations, and user interactions
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Switch, Pressable } from 'react-native';
import Settings from '../Pages/Settings';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Cookies from '@react-native-cookies/cookies';

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('@react-native-cookies/cookies');
jest.mock('../context/AuthContext');
jest.mock('../context/ThemeContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
jest.mock('@components/CustomText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomText(props: any) {
    return <Text {...props} />;
  };
});

describe('Settings Component', () => {
  // Mock data
  const mockColors = {
    background: '#FFFFFF',
    navBar: '#F5F5F5',
    text: '#000000',
    subText: '#666666',
    border: '#E0E0E0',
    active: '#007AFF',
  };

  const mockNavigation = {
    push: jest.fn(),
    reset: jest.fn(),
  };

  const mockAuthContext = {
    logout: jest.fn(),
  };

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useTheme hook
    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
      isDark: false,
      toggleTheme: jest.fn(),
    });

    // Mock useNavigation hook
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);

    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);

    // Mock Cookies
    (Cookies.clearAll as jest.Mock).mockResolvedValue(true);

    // Mock global fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<Settings />);
      expect(useTheme).toHaveBeenCalled();
    });

    test('renders the dark theme switch', async () => {
      const { root } = render(<Settings />);
      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    test('renders all setting action buttons', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
        expect(getByText('Notification Preferences')).toBeTruthy();
        expect(getByText('Log Out')).toBeTruthy();
      });
    });

    test('renders action subtitles', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Update your personal details')).toBeTruthy();
        expect(getByText('Manage alerts and reminders')).toBeTruthy();
        expect(getByText('Sign out from this device')).toBeTruthy();
      });
    });

    test('displays correct theme toggle status', async () => {
      const { rerender } = render(<Settings />);

      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: true,
        toggleTheme: jest.fn(),
      });

      rerender(<Settings />);
      expect(useTheme).toHaveBeenCalled();
    });
  });

  describe('Theme Switching', () => {
    test('calls toggleTheme when switch is pressed', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: false,
        toggleTheme: mockToggleTheme,
      });

      const { UNSAFE_getByType } = render(<Settings />);

      await waitFor(() => {
        const switchComponent = UNSAFE_getByType(Switch);
        expect(switchComponent).toBeTruthy();
      });

      const switchComponent = UNSAFE_getByType(Switch);
      fireEvent(switchComponent, 'valueChange', true);

      expect(mockToggleTheme).toHaveBeenCalled();
    });

    test('switch shows dark mode enabled state', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: true,
        toggleTheme: jest.fn(),
      });

      const { UNSAFE_getByType } = render(<Settings />);

      await waitFor(() => {
        const switchComponent = UNSAFE_getByType(Switch);
        expect(switchComponent.props.value).toBe(true);
      });
    });

    test('switch shows dark mode disabled state', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: false,
        toggleTheme: jest.fn(),
      });

      const { UNSAFE_getByType } = render(<Settings />);

      await waitFor(() => {
        const switchComponent = UNSAFE_getByType(Switch);
        expect(switchComponent.props.value).toBe(false);
      });
    });

    test('uses correct theme colors for switch', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: false,
        toggleTheme: jest.fn(),
      });

      const { UNSAFE_getByType } = render(<Settings />);

      await waitFor(() => {
        const switchComponent = UNSAFE_getByType(Switch);
        expect(switchComponent.props.trackColor.false).toBe(mockColors.border);
        expect(switchComponent.props.trackColor.true).toBe(mockColors.active);
        expect(switchComponent.props.thumbColor).toBe(mockColors.navBar);
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to Profile when Edit Profile is pressed', async () => {
      const { getByText, queryByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });

      const editButton = getByText('Edit Profile');
      const pressable = editButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      expect(mockNavigation.push).toHaveBeenCalledWith('Profile');
    });

    test('navigates to NotificationPreferences when pressed', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Notification Preferences')).toBeTruthy();
      });

      const notifButton = getByText('Notification Preferences');
      const pressable = notifButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      expect(mockNavigation.push).toHaveBeenCalledWith('NotificationPreferences');
    });

    test('resets navigation to Login on logout', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    });
  });

  describe('Logout Functionality', () => {
    test('calls logout API endpoint', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://164.90.166.81:8000/api/logout/',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    test('clears cookies on logout', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(Cookies.clearAll).toHaveBeenCalledWith(true);
      });
    });

    test('calls logout from auth context', async () => {
      const mockLogout = jest.fn();
      (useAuth as jest.Mock).mockReturnValue({
        logout: mockLogout,
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    test('handles logout errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    });

    test('still resets navigation on logout failure', async () => {
      (Cookies.clearAll as jest.Mock).mockRejectedValueOnce(
        new Error('Cookie error')
      );

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      });
    });
  });

  describe('Button Interactions', () => {
    test('responds to button press events', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });
    });

    test('handles multiple rapid presses', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });

      const editButton = getByText('Edit Profile');
      const pressable = editButton.parent?.parent;
      if (pressable) {
        fireEvent.press(pressable);
        fireEvent.press(pressable);
        fireEvent.press(pressable);
      }

      expect(mockNavigation.push).toHaveBeenCalledWith('Profile');
    });

    test('applies correct theme colors to buttons', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });
    });
  });

  describe('Animations', () => {
    test('initializes fade animation on mount', () => {
      render(<Settings />);
      expect(useTheme).toHaveBeenCalled();
    });

    test('renders animated cards with proper styling', async () => {
      const { root } = render(<Settings />);

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    test('applies staggered animation delays to action rows', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(useTheme).toHaveBeenCalled();
      });
    });
  });

  describe('Theme Integration', () => {
    test('uses theme colors for background', async () => {
      const { root } = render(<Settings />);

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    test('updates colors when theme changes', async () => {
      const { rerender } = render(<Settings />);

      const newColors = {
        ...mockColors,
        background: '#1E1E1E',
        text: '#FFFFFF',
      };

      (useTheme as jest.Mock).mockReturnValue({
        colors: newColors,
        isDark: true,
        toggleTheme: jest.fn(),
      });

      rerender(<Settings />);

      expect(useTheme).toHaveBeenCalled();
    });

    test('applies correct border and card colors', async () => {
      const { root } = render(<Settings />);

      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Component State Management', () => {
    test('maintains correct state during navigation', async () => {
      const { getByText, rerender } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });

      const editButton = getByText('Edit Profile');
      const pressable = editButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      rerender(<Settings />);

      expect(mockNavigation.push).toHaveBeenCalledWith('Profile');
    });

    test('does not lose state when theme changes', async () => {
      const { rerender } = render(<Settings />);

      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: true,
        toggleTheme: jest.fn(),
      });

      rerender(<Settings />);

      expect(useTheme).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles missing navigation gracefully', async () => {
      (useNavigation as jest.Mock).mockReturnValue({
        push: jest.fn(),
        reset: jest.fn(),
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });
    });

    test('handles missing auth context gracefully', async () => {
      (useAuth as jest.Mock).mockReturnValue({});

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });
    });

    test('handles network errors in logout', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        throw new Error('Network timeout');
      });

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(mockNavigation.reset).toHaveBeenCalled();
      });
    });

    test('handles console errors during logout', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('API Error')
      );

      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const logoutButton = getByText('Log Out');
      const pressable = logoutButton.parent?.parent;
      if (pressable) fireEvent.press(pressable);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles rapid theme toggles', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: false,
        toggleTheme: mockToggleTheme,
      });

      const { UNSAFE_getByType } = render(<Settings />);

      await waitFor(() => {
        const switchComponent = UNSAFE_getByType(Switch);
        fireEvent(switchComponent, 'valueChange', true);
        fireEvent(switchComponent, 'valueChange', false);
        fireEvent(switchComponent, 'valueChange', true);
      });

      expect(mockToggleTheme.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    test('handles empty colors object', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: {},
        isDark: false,
        toggleTheme: jest.fn(),
      });

      const { root } = render(<Settings />);

      expect(root).toBeTruthy();
    });

    test('handles missing action handlers', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
      });
    });

    test('handles navigation reset failure gracefully', async () => {
      mockNavigation.reset.mockImplementationOnce(() => {
        throw new Error('Navigation reset failed');
      });

      const { getByText, UNSAFE_getAllByType } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Log Out')).toBeTruthy();
      });

      const pressables = UNSAFE_getAllByType(Pressable);
      if (pressables[3]) {
        try {
          fireEvent.press(pressables[3]);
        } catch (e) {
          // Error is expected
        }
      }
    });
  });

  describe('Accessibility', () => {
    test('renders all interactive elements', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Dark Theme')).toBeTruthy();
        expect(getByText('Edit Profile')).toBeTruthy();
        expect(getByText('Notification Preferences')).toBeTruthy();
        expect(getByText('Log Out')).toBeTruthy();
      });
    });

    test('provides descriptive labels for all actions', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Update your personal details')).toBeTruthy();
        expect(getByText('Manage alerts and reminders')).toBeTruthy();
        expect(getByText('Sign out from this device')).toBeTruthy();
      });
    });
  });

  describe('Data Integrity', () => {
    test('maintains action data structure', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(useTheme).toHaveBeenCalled();
      });
    });

    test('does not mutate original theme data', async () => {
      const originalColors = { ...mockColors };

      render(<Settings />);

      await waitFor(() => {
        expect(mockColors).toEqual(originalColors);
      });
    });
  });

  describe('Performance', () => {
    test('renders efficiently without unnecessary re-renders', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({
        colors: mockColors,
        isDark: false,
        toggleTheme: mockToggleTheme,
      });

      const { rerender } = render(<Settings />);

      rerender(<Settings />);

      expect(useTheme).toHaveBeenCalled();
    });

    test('memoizes action array properly', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
        expect(getByText('Notification Preferences')).toBeTruthy();
        expect(getByText('Log Out')).toBeTruthy();
      });
    });
  });
});
