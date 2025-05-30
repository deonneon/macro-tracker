import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodsTable, FoodItem } from "../lib/supabase";

// Query key factory for food database related queries
export const foodDatabaseKeys = {
  all: ["food-database"] as const,
  search: (query: string) => ["food-database", "search", query] as const,
  detail: (name: string) => ["food-database", "detail", name] as const,
};

// Hook to fetch all foods (all foods are publicly accessible)
export const useAllFoods = () => {
  return useQuery({
    queryKey: foodDatabaseKeys.all,
    queryFn: async () => {
      try {
        const foods = await foodsTable.getAll();
        return foods;
      } catch (error) {
        console.error("Error fetching all foods:", error);
        throw error;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Hook to search for foods with a query
export const useSearchFoods = (query: string) => {
  return useQuery({
    queryKey: foodDatabaseKeys.search(query),
    queryFn: async () => {
      if (!query.trim()) return [];
      try {
        const foods = await foodsTable.search(query);
        console.log("Search results for", query, ":", foods?.length || 0);
        return foods;
      } catch (error) {
        console.error("Error searching foods:", error);
        throw error;
      }
    },
    enabled: !!query.trim(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Hook to get a food by name
export const useFoodByName = (name: string) => {
  return useQuery({
    queryKey: foodDatabaseKeys.detail(name),
    queryFn: async () => {
      if (!name.trim()) return null;
      const food = await foodsTable.getByName(name);
      return food;
    },
    enabled: !!name.trim(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// Hook for adding a new food
export const useAddFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (food: Omit<FoodItem, "id" | "created_at">) => {
      return await foodsTable.add(food);
    },
    onSuccess: (newFood) => {
      // Invalidate all food database queries
      queryClient.invalidateQueries({ queryKey: foodDatabaseKeys.all });

      // Also update detail query for this specific food
      queryClient.setQueryData(foodDatabaseKeys.detail(newFood.name), newFood);
    },
  });
};

// Hook for updating a food
export const useUpdateFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      food,
    }: {
      id: number;
      food: Partial<FoodItem>;
    }) => {
      return await foodsTable.update(id, food);
    },
    onSuccess: (updatedFood) => {
      // Invalidate all food database queries
      queryClient.invalidateQueries({ queryKey: foodDatabaseKeys.all });

      // Also update detail query for this specific food
      queryClient.setQueryData(
        foodDatabaseKeys.detail(updatedFood.name),
        updatedFood
      );
    },
  });
};

// Hook for deleting a food
export const useDeleteFood = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return await foodsTable.delete(name);
    },
    onSuccess: (_, deletedName) => {
      // Invalidate all food database queries
      queryClient.invalidateQueries({ queryKey: foodDatabaseKeys.all });

      // Remove this specific food's detail query
      queryClient.removeQueries({
        queryKey: foodDatabaseKeys.detail(deletedName),
      });
    },
  });
};
