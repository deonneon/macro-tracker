import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsTable } from '../lib/supabase';
import { MacroGoal } from '../types/goals';

// Query key factory for goals related queries
export const goalsKeys = {
  all: ['user-goals'] as const,
  latest: ['user-goals', 'latest'] as const,
  byDate: (date: string) => ['user-goals', 'by-date', date] as const,
  detail: (id: string) => ['user-goals', 'detail', id] as const,
};

// Hook to fetch the latest goal
export const useLatestGoal = () => {
  return useQuery({
    queryKey: goalsKeys.latest,
    queryFn: async () => {
      const goal = await goalsTable.getLatest();
      return goal;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook to fetch a goal by date
export const useGoalByDate = (date: string, userId: string) => {
  return useQuery({
    queryKey: goalsKeys.byDate(date),
    queryFn: async () => {
      const goals = await goalsTable.getByDate(date, userId);
      return goals.length > 0 ? goals[0] : null;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook to fetch all goals
export const useAllGoals = () => {
  return useQuery({
    queryKey: goalsKeys.all,
    queryFn: async () => {
      const response = await goalsTable.getAll();
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook for creating a new goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goal: Omit<MacroGoal, 'id' | 'created_at'>) => {
      return await goalsTable.create(goal);
    },
    onSuccess: (newGoal) => {
      // Invalidate all goals queries
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
      
      // Invalidate latest goal query
      queryClient.invalidateQueries({ queryKey: goalsKeys.latest });
      
      // Invalidate the byDate query for this specific date
      if (newGoal.target_date) {
        queryClient.invalidateQueries({ 
          queryKey: goalsKeys.byDate(newGoal.target_date) 
        });
      }
      
      // Set the detail query data for this goal
      queryClient.setQueryData(
        goalsKeys.detail(newGoal.id as string),
        newGoal
      );
    },
  });
};

// Hook for updating a goal
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, goal }: { id: string; goal: Partial<MacroGoal> }) => {
      return await goalsTable.update(id, goal);
    },
    onSuccess: (updatedGoal) => {
      // Invalidate all goals queries
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
      
      // Invalidate latest goal query
      queryClient.invalidateQueries({ queryKey: goalsKeys.latest });
      
      // Invalidate the byDate query for this specific date
      if (updatedGoal.target_date) {
        queryClient.invalidateQueries({ 
          queryKey: goalsKeys.byDate(updatedGoal.target_date) 
        });
      }
      
      // Update the detail query data for this goal
      queryClient.setQueryData(
        goalsKeys.detail(updatedGoal.id as string),
        updatedGoal
      );
    },
  });
};

// Hook for deleting a goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, targetDate }: { id: string; targetDate?: string }) => {
      await goalsTable.delete(id);
      return { id, targetDate };
    },
    onSuccess: ({ id, targetDate }) => {
      // Invalidate all goals queries
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
      
      // Invalidate latest goal query
      queryClient.invalidateQueries({ queryKey: goalsKeys.latest });
      
      // Invalidate the byDate query for this specific date if provided
      if (targetDate) {
        queryClient.invalidateQueries({ queryKey: goalsKeys.byDate(targetDate) });
      }
      
      // Remove the detail query for this goal
      queryClient.removeQueries({ queryKey: goalsKeys.detail(id) });
    },
  });
}; 