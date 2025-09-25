/**
 * Example component demonstrating the use of GenFit authentication utilities
 * This file shows how to use the GFapi client and authentication hooks
 */

import React, { useState } from 'react';
import { useLogin, useUser, useLogout, formatApiError } from '../lib';

export function AuthExample() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string>('');

  // Use authentication hooks
  const { data: user, isLoading: userLoading } = useUser();
  const { mutate: login, isPending: loginPending } = useLogin();
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    login(credentials, {
      onSuccess: () => {
        console.log('Login successful!');
        setCredentials({ username: '', password: '' });
      },
      onError: (error) => {
        const errorMessage = formatApiError(error);
        setError(errorMessage);
        console.error('Login failed:', errorMessage);
      },
    });
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        console.log('Logout successful!');
      },
      onError: (error) => {
        console.error('Logout failed:', formatApiError(error));
      },
    });
  };

  if (userLoading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>GenFit Authentication Example</h2>
      
      {user ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <p>Email: {user.email}</p>
          <button 
            onClick={handleLogout}
            disabled={logoutPending}
            style={{ padding: '8px 16px', marginTop: '10px' }}
          >
            {logoutPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loginPending}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            {loginPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
    </div>
  );
}

export default AuthExample;
