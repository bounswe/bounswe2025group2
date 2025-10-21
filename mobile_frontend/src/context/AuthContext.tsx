import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrentUser = {
  id?: number | null;
  username?: string;
  email?: string;
  user_type?: 'Coach' | 'User' | string;
  is_verified_coach?: boolean;
};

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  isAuthenticated: boolean;

  // your API
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => Promise<void>;

  // main branch API (aliases for compatibility)
  currentUser: CurrentUser | null;
  setCurrentUser: (u: CurrentUser | null) => Promise<void>;

  logout: () => Promise<void>;
  getAuthHeader: () => { Authorization: string } | {};
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: async () => {},
  isAuthenticated: false,
  user: null,
  setUser: async () => {},
  currentUser: null,
  setCurrentUser: async () => {},
  logout: async () => {},
  getAuthHeader: () => ({}),
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = { children: ReactNode };

const USER_TOKEN_KEY = 'userToken';
const USER_INFO_KEY = 'userInfo';
const API_BASE = 'http://164.90.166.81:8000';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<CurrentUser | null>(null);

  const setToken = async (newToken: string | null) => {
    if (newToken) {
      const formatted = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
      await AsyncStorage.setItem(USER_TOKEN_KEY, formatted);
      setTokenState(formatted);
    } else {
      await AsyncStorage.removeItem(USER_TOKEN_KEY);
      setTokenState(null);
    }
  };

  const setUser = async (u: CurrentUser | null) => {
    if (u) {
      await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(u));
      setUserState(u);
    } else {
      await AsyncStorage.removeItem(USER_INFO_KEY);
      setUserState(null);
    }
  };

  // main branch compatibility aliases
  const setCurrentUser = setUser;
  const currentUser = user;

  const getAuthHeader = () => {
    // IMPORTANT: return NOTHING if there is no token.
    // Sending "Authorization: ''" breaks cookie sessions on the server.
    return token ? { Authorization: token } : {};
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/logout/`, {
          method: 'POST',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await setToken(null);
      await setUser(null);
    }
  };

  // Hydrate from storage
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(USER_TOKEN_KEY),
          AsyncStorage.getItem(USER_INFO_KEY),
        ]);

        if (storedToken) {
          const formatted = storedToken.startsWith('Bearer ') ? storedToken : `Bearer ${storedToken}`;
          setTokenState(formatted);
        } else {
          setTokenState(null);
        }

        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        } else {
          setUserState(null);
        }
      } catch (err) {
        console.error('Failed to load auth from storage:', err);
        await AsyncStorage.removeItem(USER_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_INFO_KEY);
        setTokenState(null);
        setUserState(null);
      }
    })();
  }, []);

  // Consider the user authenticated if we have either a token OR a user object (for cookie sessions)
  const isAuthenticated = !!token || !!(user && user.id != null);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated,
        user,
        setUser,
        currentUser,
        setCurrentUser,
        logout,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
