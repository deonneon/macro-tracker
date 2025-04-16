import { QueryClient, Query } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create a storage persister that uses localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'MACRO_TRACKER_QUERY_CACHE', // This is the key used in localStorage
  throttleTime: 1000, // How frequently to persist cache (ms)
});

// Create the Query Client
export const createQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Global default settings for all queries
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 60 * 60 * 1000, // 1 hour (renamed from cacheTime)
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });

  // Set up persistence
  persistQueryClient({
    queryClient: client,
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    buster: import.meta.env.VITE_CACHE_BUSTER || 'v1', // Bust cache with env var
    dehydrateOptions: {
      // Options for dehydration
      shouldDehydrateQuery: (query: Query) => {
        // Only persisting certain queries that we expect to be relatively stable
        const queryHash = query.queryHash;
        
        // These are the patterns we'll persist in localStorage
        const shouldPersist = (
          queryHash.includes('food-database') ||
          queryHash.includes('daily-entries') ||
          queryHash.includes('user-goals')
        );
        
        return query.state.status === 'success' && shouldPersist;
      },
    },
  });

  return client;
}; 