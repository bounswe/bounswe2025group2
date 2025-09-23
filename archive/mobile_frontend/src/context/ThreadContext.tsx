import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThreadType = {
  id: number;
  forumName: string;
  content: string;
  imageUrl?: any;
  username: string;
  profilePic: any;
};

type ThreadContextType = {
  threads: ThreadType[];
  addThread: (thread: Omit<ThreadType, 'id'>) => void;
  loadThreads: () => Promise<void>;
};

const ThreadContext = createContext<ThreadContextType>({
  threads: [],
  addThread: () => {},
  loadThreads: async () => {},
});

export const useThreads = () => useContext(ThreadContext);

type ThreadProviderProps = {
  children: ReactNode;
};

// Helper function to serialize and deserialize image URIs
const serializeImageUri = (thread: ThreadType): ThreadType => {
  // If imageUrl has a uri property (selected from device), convert it for storage
  if (thread.imageUrl && typeof thread.imageUrl === 'object' && thread.imageUrl.uri) {
    return {
      ...thread,
      imageUrl: { 
        type: 'uri', 
        value: thread.imageUrl.uri 
      }
    };
  }
  return thread;
};

const deserializeImageUri = (thread: ThreadType): ThreadType => {
  // If imageUrl is stored as a uri, convert it back to the format required by Image component
  if (thread.imageUrl && typeof thread.imageUrl === 'object' && 
      thread.imageUrl.type === 'uri' && thread.imageUrl.value) {
    return {
      ...thread,
      imageUrl: { uri: thread.imageUrl.value }
    };
  }
  return thread;
};

export const ThreadProvider = ({ children }: ThreadProviderProps) => {
  const [threads, setThreads] = useState<ThreadType[]>([]);

  // Load threads from AsyncStorage
  const loadThreads = async () => {
    try {
      const savedThreads = await AsyncStorage.getItem('userThreads');
      if (savedThreads) {
        const parsedThreads = JSON.parse(savedThreads);
        // Deserialize image URIs for display
        const processedThreads = parsedThreads.map(deserializeImageUri);
        setThreads(processedThreads);
      }
    } catch (error: unknown) {
      console.error('Failed to load threads:', error);
    }
  };

  // Add a new thread
  const addThread = (threadData: Omit<ThreadType, 'id'>) => {
    const newThread = {
      ...threadData,
      id: Date.now(), // Using timestamp as a simple unique ID
    };
    
    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    
    // Serialize image URIs for storage
    const serializedThreads = updatedThreads.map(serializeImageUri);
    
    // Save to AsyncStorage
    AsyncStorage.setItem('userThreads', JSON.stringify(serializedThreads))
      .catch((error: unknown) => console.error('Failed to save threads:', error));
  };

  // Load threads on mount
  React.useEffect(() => {
    loadThreads();
  }, []);

  return (
    <ThreadContext.Provider
      value={{
        threads,
        addThread,
        loadThreads,
      }}>
      {children}
    </ThreadContext.Provider>
  );
}; 