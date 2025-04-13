import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyDietTable, DailyDietEntry, DailyDietWithFood } from '../lib/supabase';
import { format, addDays, subDays } from 'date-fns';

// Query key factory for daily entries related queries
export const dailyEntriesKeys = {
  all: ['daily-entries'] as const,
  byDate: (date: string) => ['daily-entries', 'by-date', date] as const,
  detail: (id: number) => ['daily-entries', 'detail', id] as const,
};

// Hook to fetch daily entries for a specific date
export const useDailyEntriesByDate = (date: string | Date) => {
  const formattedDate = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: dailyEntriesKeys.byDate(formattedDate),
    queryFn: async () => {
      const entries = await dailyDietTable.getByDate(formattedDate);
      return entries;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Convert to a hook that returns a function
export const usePrefetchAdjacentDays = () => {
  const queryClient = useQueryClient();
  
  return (currentDate: string) => {
    const yesterday = format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd');
    
    // Prefetch yesterday's data (low priority)
    queryClient.prefetchQuery({
      queryKey: dailyEntriesKeys.byDate(yesterday),
      queryFn: () => dailyDietTable.getByDate(yesterday),
      staleTime: 60 * 60 * 1000, // 1 hour
    });
    
    // Prefetch tomorrow's data (low priority)
    queryClient.prefetchQuery({
      queryKey: dailyEntriesKeys.byDate(tomorrow),
      queryFn: () => dailyDietTable.getByDate(tomorrow),
      staleTime: 60 * 60 * 1000, // 1 hour
    });
  };
};

// Hook for adding a new daily diet entry
export const useAddDailyEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: Omit<DailyDietEntry, 'id' | 'created_at'>) => {
      return await dailyDietTable.add(entry);
    },
    onSuccess: (newEntry) => {
      // Get the date from the new entry
      const date = newEntry.date;
      
      // Invalidate the specific date query to refetch entries for that date
      queryClient.invalidateQueries({ queryKey: dailyEntriesKeys.byDate(date) });
    },
  });
};

// Hook for deleting a daily diet entry
export const useDeleteDailyEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, date }: { id: number, date: string }) => {
      await dailyDietTable.delete(id);
      return { id, date };
    },
    // Optimistic update - remove from cache immediately before server response
    onMutate: async ({ id, date }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dailyEntriesKeys.byDate(date) });
      
      // Snapshot the previous value
      const previousEntries = queryClient.getQueryData<DailyDietWithFood[]>(
        dailyEntriesKeys.byDate(date)
      );
      
      // Optimistically update to the new value
      if (previousEntries) {
        queryClient.setQueryData(
          dailyEntriesKeys.byDate(date), 
          previousEntries.filter(entry => entry.id !== id)
        );
      }
      
      // Return a context object with the snapshot
      return { previousEntries, date };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { date }, context: any) => {
      console.error('Error deleting daily entry:', err);
      if (context?.previousEntries) {
        queryClient.setQueryData(
          dailyEntriesKeys.byDate(date),
          context.previousEntries
        );
      }
    },
    // Always refetch after success or error to ensure cache is accurate
    onSettled: (data) => {
      if (data && data.date) {
        queryClient.invalidateQueries({ queryKey: dailyEntriesKeys.byDate(data.date) });
      }
    },
  });
};

// Hook for updating a daily diet entry
export const useUpdateDailyEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates,
      originalDate
    }: { 
      id: number; 
      updates: Parameters<typeof dailyDietTable.update>[1]; 
      originalDate: string;
    }) => {
      const result = await dailyDietTable.update(id, updates);
      return { result, originalDate, newDate: updates.date };
    },
    onSuccess: ({ originalDate, newDate }) => {
      // Invalidate the original date query
      queryClient.invalidateQueries({ queryKey: dailyEntriesKeys.byDate(originalDate) });
      
      // If the date was changed, also invalidate the new date query
      if (newDate && newDate !== originalDate) {
        queryClient.invalidateQueries({ queryKey: dailyEntriesKeys.byDate(newDate) });
      }
    },
  });
}; 