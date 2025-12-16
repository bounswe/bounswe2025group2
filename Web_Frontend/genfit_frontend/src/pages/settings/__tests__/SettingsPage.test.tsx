import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../../test/test-utils';
import SettingsPage from '../SettingsPage';
import { 
  useUserSettings, 
  useUpdateUserSettings, 
  useUser, 
  useIsAuthenticated, 
  useLogout, 
  useNotifications 
} from '../../../lib'; 

// 1. MOCK EXTERNAL DEPENDENCIES
vi.mock('../../../lib', () => ({
  useUserSettings: vi.fn(),
  useUpdateUserSettings: vi.fn(),
  useUser: vi.fn(),
  useIsAuthenticated: vi.fn(),
  useLogout: vi.fn(),
  useNotifications: vi.fn(),
}));

// 2. MOCK REACT ROUTER
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: () => ({ pathname: '/settings' }),
  };
});

describe('SettingsPage', () => {
  const mockSettings = {
    daily_advice_enabled: true,
  };

  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // -- Mock Data for the Settings Page --
    
    // Mock fetching settings
    vi.mocked(useUserSettings).mockReturnValue({
      data: mockSettings,
      error: null,
      isLoading: false,
    } as any);

    // Mock updating settings
    vi.mocked(useUpdateUserSettings).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);


    // -- Mock Data for the Layout Component --
    
    vi.mocked(useUser).mockReturnValue({
      data: { id: 1, username: 'testuser' },
      isLoading: false,
    } as any);

    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
      isLoading: false,
    } as any);

    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    } as any);
    
    vi.mocked(useNotifications).mockReturnValue({
        data: [], 
        isLoading: false,
    } as any);
  });

  it('renders settings information correctly', async () => {
    renderWithProviders(<SettingsPage />);

    // Check Header
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText('Manage your preferences and account settings')).toBeInTheDocument();

    // Check Section
    expect(screen.getByText('AI Features')).toBeInTheDocument();
    expect(screen.getByText('Daily Fitness Advice')).toBeInTheDocument();

    // Check Toggle State 
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows action buttons when toggle is changed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    // Verify buttons are initially hidden
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

    // Click the toggle
    const toggle = screen.getByRole('checkbox');
    await user.click(toggle);

    // Verify toggle changed visually
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    // Verify buttons appear
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls update mutation when Save is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    // Change setting
    const toggle = screen.getByRole('checkbox');
    await user.click(toggle); // Turns it off

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    // Expect mutation to be called with new value
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      daily_advice_enabled: false,
    });

    // Expect success message
    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeInTheDocument();
    });
  });

  it('reverts changes when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    // Change setting (Turn off)
    const toggle = screen.getByRole('checkbox');
    await user.click(toggle);
    expect(toggle).not.toBeChecked();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Verify buttons disappear
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();

    // Verify toggle reverts to original mock value 
    expect(toggle).toBeChecked();
  });

  it('renders error state and refresh button when fetching fails', async () => {
    // Override mock to simulate error
    vi.mocked(useUserSettings).mockReturnValue({
      data: null,
      error: new Error('Failed to fetch'),
      isLoading: false,
    } as any);

    renderWithProviders(<SettingsPage />);

    // Check for refresh button
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });
});
