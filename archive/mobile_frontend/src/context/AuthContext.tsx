import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  getAuthHeader: () => { Authorization: string } | {};
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: async () => {},
  isAuthenticated: false,
  logout: async () => {},
  getAuthHeader: () => ({}),
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = async (newToken: string | null) => {
    if (newToken) {
      // Ensure token is properly formatted
      const formattedToken = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
      await AsyncStorage.setItem('userToken', formattedToken);
      setTokenState(formattedToken);
    } else {
      await AsyncStorage.removeItem('userToken');
      setTokenState(null);
    }
  };

  const getAuthHeader = () => {
    if (!token) return {};
    return { Authorization: token };
  };

  const logout = async () => {
    try {
      if (token) {
        // Call logout endpoint if it exists
        await fetch('http://10.0.2.2:8000/api/logout/', {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await setToken(null);
    }
  };

  // Load token from storage on mount
  React.useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          // Validate token format
          const formattedToken = storedToken.startsWith('Bearer ') ? storedToken : `Bearer ${storedToken}`;
          setTokenState(formattedToken);
        }
      } catch (error) {
        console.error('Failed to load token:', error);
        // If there's an error loading the token, clear it
        await AsyncStorage.removeItem('userToken');
        setTokenState(null);
      }
    };
    loadToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated: !!token,
        logout,
        getAuthHeader,
      }}>
      {children}
    </AuthContext.Provider>
  );
}; 