import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * Completely flushes all in-memory query caches across the application.
 * Guaranteed to be called on logout or account switching to prevent cross-account data leakage.
 */
export const flushAllQueryCaches = () => {
  queryClient.cancelQueries();
  queryClient.clear();
};
