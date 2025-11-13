import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GFapi } from '../api/GFapi';
import type { UserSearchResult } from '../types/api';

export const useUserSearch = (searchTerm: string) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: users, isLoading } = useQuery<UserSearchResult[]>({
    queryKey: ['users', debouncedTerm],
    queryFn: async () => {
      const allUsers = await GFapi.get<UserSearchResult[]>('/api/users/');
      
      // Filter users based on search term
      if (!debouncedTerm.trim()) {
        return [];
      }
      
      return allUsers.filter(user => 
        user.username.toLowerCase().includes(debouncedTerm.toLowerCase())
      );
    },
    enabled: debouncedTerm.length > 0,
  });

  return {
    users: users || [],
    isLoading,
  };
};
