import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CurrentUser = {
  id: number | null;                 // may be null if we can't infer yet
  user_type?: 'Coach' | 'User';
  is_verified_coach?: boolean;
  username?: string;
};

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  getAuthHeader: () => { Authorization: string } | {};
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: async () => {},
  isAuthenticated: false,
  logout: async () => {},
  getAuthHeader: () => ({}),
  user: null,
  setUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<CurrentUser | null>(null);


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

  const setUser = async (u: CurrentUser | null) => {
    if (u) {
      await AsyncStorage.setItem('userInfo', JSON.stringify(u));
      setUserState(u);
    } else {
      await AsyncStorage.removeItem('userInfo');
      setUserState(null);
    }
  };

  const getAuthHeader = () => {
    if (!token) return {};
    return { Authorization: token };
  };

  const logout = async () => {
    try {
      if (token) {
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
      await setUser(null);
    }
  };

  // Load token from storage on mount
  React.useEffect(() => {
    const loadToken = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('userInfo'),
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
      } catch (error) {
        console.error('Failed to load token:', error);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setTokenState(null);
        setUserState(null);
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
        user,
        setUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}; 