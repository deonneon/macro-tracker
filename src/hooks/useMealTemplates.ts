import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealTemplatesTable, MealTemplate } from '../lib/supabase';

// Query key factory for meal templates related queries
export const mealTemplatesKeys = {
  all: ['meal-templates'] as const,
  detail: (id: number) => ['meal-templates', 'detail', id] as const,
};

// Hook to fetch all meal templates
export const useAllMealTemplates = () => {
  return useQuery({
    queryKey: mealTemplatesKeys.all,
    queryFn: async () => {
      const templates = await mealTemplatesTable.getAll();
      return templates;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a specific meal template by ID
export const useMealTemplateById = (id: number) => {
  return useQuery({
    queryKey: mealTemplatesKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const template = await mealTemplatesTable.getById(id);
      return template;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a meal template
export const useCreateMealTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      return await mealTemplatesTable.add(template);
    },
    onSuccess: (newTemplate) => {
      // Invalidate all templates query
      queryClient.invalidateQueries({ queryKey: mealTemplatesKeys.all });
      
      // Set the detail query data for this template
      if (newTemplate.id) {
        queryClient.setQueryData(
          mealTemplatesKeys.detail(newTemplate.id),
          newTemplate
        );
      }
    },
  });
};

// Hook for updating a meal template
export const useUpdateMealTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Partial<Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>> }) => {
      return await mealTemplatesTable.update(id, template);
    },
    onSuccess: (updatedTemplate) => {
      // Invalidate all templates query
      queryClient.invalidateQueries({ queryKey: mealTemplatesKeys.all });
      
      // Update the detail query data for this template
      if (updatedTemplate.id) {
        queryClient.setQueryData(
          mealTemplatesKeys.detail(updatedTemplate.id),
          updatedTemplate
        );
      }
    },
  });
};

// Hook for deleting a meal template
export const useDeleteMealTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await mealTemplatesTable.delete(id);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate all templates query
      queryClient.invalidateQueries({ queryKey: mealTemplatesKeys.all });
      
      // Remove the detail query for this template
      queryClient.removeQueries({ queryKey: mealTemplatesKeys.detail(id) });
    },
  });
}; 