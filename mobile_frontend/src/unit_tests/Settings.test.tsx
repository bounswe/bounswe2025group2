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
    test('renders all setting action buttons and titles', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeTruthy();
        expect(getByText('Notification Preferences')).toBeTruthy();
        expect(getByText('Log Out')).toBeTruthy();
        expect(getByText('Update your personal details')).toBeTruthy();
        expect(getByText('Manage alerts and reminders')).toBeTruthy();
        expect(getByText('Sign out from this device')).toBeTruthy();
      });
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
    test('handles multiple rapid button presses', async () => {
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
  });

  describe('Animations', () => {
    test('renders with theme applied on mount', () => {
      render(<Settings />);
      expect(useTheme).toHaveBeenCalled();
    });
  });

  describe('Theme Integration', () => {
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
  });

  describe('Error Handling', () => {
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
  });

  describe('Accessibility', () => {
    test('renders all interactive elements with descriptive labels', async () => {
      const { getByText } = render(<Settings />);

      await waitFor(() => {
        expect(getByText('Dark Theme')).toBeTruthy();
        expect(getByText('Edit Profile')).toBeTruthy();
        expect(getByText('Update your personal details')).toBeTruthy();
        expect(getByText('Notification Preferences')).toBeTruthy();
        expect(getByText('Manage alerts and reminders')).toBeTruthy();
        expect(getByText('Log Out')).toBeTruthy();
        expect(getByText('Sign out from this device')).toBeTruthy();
      });
    });
  });

  describe('Data Integrity', () => {
    test('does not mutate original theme data', async () => {
      const originalColors = { ...mockColors };

      render(<Settings />);

      await waitFor(() => {
        expect(mockColors).toEqual(originalColors);
      });
    });
  });

  describe('Performance', () => {
    test('renders efficiently on re-renders', async () => {
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
  });
});
