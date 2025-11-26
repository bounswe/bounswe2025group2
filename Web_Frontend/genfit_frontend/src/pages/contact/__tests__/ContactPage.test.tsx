import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import ContactPage from '../ContactPage';

// Mock the Layout component since it's a dependency
vi.mock('../../../components', () => ({
  Layout: ({ children, onSearch }: { children: React.ReactNode; onSearch: (term: string) => void }) => (
    <div data-testid="layout">
      <div data-testid="search-handler">Search handler present</div>
      {children}
    </div>
  ),
}));

// Mock the CSS import
vi.mock('../contact_page.css', () => ({}));

// Mock the fetch API
globalThis.fetch = vi.fn();

describe('ContactPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');

    // Mock fetch to return a successful response by default
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ message: 'Thank you for your message!' })),
    } as Response);

    // Mock document.cookie for CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=test-csrf-token',
    });
  });

  it('should render the contact page with main heading', () => {
    renderWithProviders(<ContactPage />);
    
    // Check if the main heading is rendered
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Get in touch with our team')).toBeInTheDocument();
  });

  it('should render the contact form', () => {
    renderWithProviders(<ContactPage />);
    
    // Check if form elements are present
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should render additional contact information', () => {
    renderWithProviders(<ContactPage />);
    
    // Check if contact info section is rendered
    expect(screen.getByText('Other Ways to Reach Us')).toBeInTheDocument();
    expect(screen.getByText('support@genfit.com')).toBeInTheDocument();
    expect(screen.getByText('Community Forum')).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
  });

  it('should update form fields when user types', async () => {
    renderWithProviders(<ContactPage />);

    // Get form inputs
    const nameInput = screen.getByLabelText(/your name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/message/i);

    // Type into each field
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(subjectInput, 'Test Subject');
    await user.type(messageInput, 'This is a test message.');

    // Check if the values are updated
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(subjectInput).toHaveValue('Test Subject');
    expect(messageInput).toHaveValue('This is a test message.');
  });

  it('should disable submit button when form is submitting', async () => {
    // Create a promise that we can resolve manually to control the timing
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(globalThis.fetch).mockImplementation(() => fetchPromise);

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    const submitButton = screen.getByRole('button', { name: /send message/i });

    // Initially button should be enabled
    expect(submitButton).not.toBeDisabled();

    // Click submit - this should start the submission
    await user.click(submitButton);

    // Now the button should be disabled and show "Sending..."
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Sending...');

    // Resolve the fetch promise inside act to prevent warnings
    await act(async () => {
      resolveFetch!({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Thank you for your message!' })),
      } as Response);
    });
  });

  it('should show success message after successful submission', async () => {
    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the success message - use the actual message from the mock response
    await waitFor(() => {
      expect(screen.getByText('Thank you for your message!')).toBeInTheDocument();
    });

    // The success message should have the 'success' class
    const successMessage = screen.getByText('Thank you for your message!');
    expect(successMessage).toHaveClass('success');

    // Check that the form was reset
    expect(screen.getByLabelText(/your name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    expect(screen.getByLabelText(/subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });

  it('should show default success message when no message from API', async () => {
    // Mock fetch to return success but no message
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({})), // No message in response
    } as Response);

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the default success message
    await waitFor(() => {
      expect(screen.getByText('Thank you for your message! We will get back to you soon.')).toBeInTheDocument();
    });
  });

  it('should call fetch with correct parameters', async () => {
    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Check that fetch was called with correct parameters
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/contact/',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': 'test-csrf-token',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message.'
        }),
        credentials: 'include',
      })
    );
  });

  it('should show error message when API request fails', async () => {
    // Mock fetch to return an error response
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve(JSON.stringify({ 
        message: 'Server error', 
        detail: 'Internal server error' 
      })),
    } as Response);

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    // The error message should have the 'error' class
    const errorMessage = screen.getByText('Server error');
    expect(errorMessage).toHaveClass('error');

    // Button should be re-enabled after error
    expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
  });

  it('should show error message when API returns non-JSON response', async () => {
    // Mock fetch to return a non-JSON response
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Internal Server Error'),
    } as Response);

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Server returned an unexpected response. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show specific error message when fetch throws an Error instance', async () => {
    // Mock fetch to throw an Error instance
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the error message - it should show the actual error message from the exception
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // The error message should have the 'error' class
    const errorMessage = screen.getByText('Network error');
    expect(errorMessage).toHaveClass('error');
  });

  it('should show generic error message when non-Error exception is thrown', async () => {
    // Mock fetch to throw a non-Error exception (string)
    vi.mocked(globalThis.fetch).mockRejectedValue('Some string error');

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the generic error message
    await waitFor(() => {
      expect(screen.getByText('There was an error submitting your message. Please try again.')).toBeInTheDocument();
    });
  });

  it('should handle missing CSRF token gracefully', async () => {
    // Mock document.cookie to not have CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    renderWithProviders(<ContactPage />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Check that fetch was called with empty CSRF token
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/contact/',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRFToken': '',
        }),
      })
    );
  });
});