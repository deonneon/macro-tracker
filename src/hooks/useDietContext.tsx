import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { format } from 'date-fns';
import { FoodItem, MealTemplate, MealTemplateFood } from '../lib/supabase';
import { useAllFoods, useAddFood, useDeleteFood } from './useFoodDatabase';
import { useDailyEntriesByDate, useAddDailyEntry, useDeleteDailyEntry, usePrefetchAdjacentDays } from './useDailyEntries';
import { useAllMealTemplates, useMealTemplateById, useCreateMealTemplate, useUpdateMealTemplate, useDeleteMealTemplate } from './useMealTemplates';

interface Food {
  id: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  serving_size: number;
  unit: string;
}

interface FoodDatabase {
  [key: string]: Food;
}

interface DailyDietItem extends Food {
  name: string;
  date: string;
  id: number;
}

interface DietContextType {
  database: FoodDatabase;
  isLoadingDatabase: boolean;
  dailyDiet: DailyDietItem[];
  isLoadingDailyDiet: boolean;
  mealTemplates: MealTemplate[];
  isLoadingMealTemplates: boolean;
  removeFoodEntry: (index: number) => Promise<void>;
  removeFoodFromDatabase: (foodName: string) => Promise<void>;
  addFoodToDatabase: (foodData: { 
    name: string; 
    protein: number; 
    carbs: number;
    fat: number;
    calories: number; 
    serving_size: number;
    unit: string 
  }) => Promise<void>;
  addFoodEntryToDailyDiet: (foodDetails: Food & { name: string }, date: string, mealType?: string) => Promise<void>;
  prefetchAdjacentDays: (date: string) => void;
  createMealTemplate: (name: string, description: string, selectedFoods: Array<Food & { name: string }>) => Promise<void>;
  getMealTemplate: (id: number) => Promise<MealTemplate | null>;
  updateMealTemplate: (id: number, updates: Partial<MealTemplate>) => Promise<void>;
  deleteMealTemplate: (id: number) => Promise<void>;
  applyMealTemplate: (templateId: number, date: string, mealType?: string) => Promise<void>;
  currentDate: string; // Today's date
}

// Create the context
const CachingDietContext = createContext<DietContextType | undefined>(undefined);

interface CachingDietProviderProps {
  children: ReactNode;
}

// Create the provider
export const CachingDietProvider: React.FC<CachingDietProviderProps> = ({ children }) => {
  // Today's date in YYYY-MM-DD format
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  
  // Use React Query hooks for data fetching
  const { data: foods, isLoading: isLoadingFoods } = useAllFoods();
  const { data: dailyEntries, isLoading: isLoadingDailyDiet } = useDailyEntriesByDate(currentDate);
  const { data: templates, isLoading: isLoadingMealTemplates } = useAllMealTemplates();
  
  // Mutation hooks
  const { mutateAsync: addFood } = useAddFood();
  const { mutateAsync: deleteFood } = useDeleteFood();
  const { mutateAsync: addDailyEntry } = useAddDailyEntry();
  const { mutateAsync: deleteDailyEntry } = useDeleteDailyEntry();
  const { mutateAsync: createTemplate } = useCreateMealTemplate();
  const { mutateAsync: updateTemplate } = useUpdateMealTemplate();
  const { mutateAsync: deleteTemplate } = useDeleteMealTemplate();
  
  // Convert foods array to database object format
  const database: FoodDatabase = {};
  if (foods) {
    foods.forEach((item: FoodItem) => {
      database[item.name] = {
        id: item.id || 0,
        protein: item.protein,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        calories: item.calories,
        serving_size: item.serving_size || 1,
        unit: item.unit
      };
    });
  }
  
  // Convert daily entries to the expected format
  const dailyDiet: DailyDietItem[] = dailyEntries ? dailyEntries.map(item => ({
    id: item.id,
    date: item.date,
    name: item.name,
    protein: item.protein,
    carbs: item.carbs || 0,
    fat: item.fat || 0,
    calories: item.calories,
    serving_size: 1,
    unit: item.unit,
  })) : [];
  
  // Get meal templates
  const mealTemplates: MealTemplate[] = templates || [];
  
  // Function to add a food to the database
  const addFoodToDatabase = useCallback(async (foodData: { 
    name: string; 
    protein: number; 
    carbs: number;
    fat: number;
    calories: number; 
    serving_size: number;
    unit: string 
  }) => {
    try {
      await addFood({
        name: foodData.name,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fat,
        calories: foodData.calories,
        serving_size: foodData.serving_size,
        unit: foodData.unit
      });
    } catch (error) {
      console.error('Error adding food to database:', error);
      throw error;
    }
  }, [addFood]);

  // Function to remove a food from the database
  const removeFoodFromDatabase = useCallback(async (foodName: string) => {
    try {
      await deleteFood(foodName);
    } catch (error) {
      console.error('Error deleting food from database:', error);
      throw error;
    }
  }, [deleteFood]);
  
  // Function to add a food entry to daily diet
  const addFoodEntryToDailyDiet = useCallback(async (
    foodDetails: Food & { name: string }, 
    date: string, 
    mealType: string = 'Breakfast'
  ) => {
    try {
      await addDailyEntry({
        date,
        food_id: foodDetails.id,
        meal_type: mealType
      });
    } catch (error) {
      console.error('Error adding food entry to daily diet:', error);
      throw error;
    }
  }, [addDailyEntry]);
  
  // Function to remove a food entry
  const removeFoodEntry = useCallback(async (index: number) => {
    try {
      if (index < 0 || index >= dailyDiet.length) {
        console.error('Invalid index for food entry removal');
        return;
      }

      const entry = dailyDiet[index];
      if (!entry || !entry.id) {
        console.error('Invalid food entry or missing ID');
        return;
      }

      await deleteDailyEntry({ id: entry.id, date: entry.date });
    } catch (error) {
      console.error('Error deleting daily diet entry:', error);
      throw error;
    }
  }, [dailyDiet, deleteDailyEntry]);

  const prefetchDays = useCallback((date: string) => {
    const prefetchAdjacentDaysFn = usePrefetchAdjacentDays();
    prefetchAdjacentDaysFn(date);
  }, []);
  
  // Meal template functions
  const createMealTemplate = useCallback(async (
    name: string, 
    description: string, 
    selectedFoods: Array<Food & { name: string }>
  ) => {
    try {
      // Transform the selected foods into the appropriate format for storage
      const templateFoods: MealTemplateFood[] = selectedFoods.map(food => ({
        food_id: food.id,
        name: food.name,
        serving_size: food.serving_size,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        calories: food.calories,
        unit: food.unit
      }));
      
      await createTemplate({
        name,
        description,
        foods_json: templateFoods
      });
    } catch (error) {
      console.error('Error creating meal template:', error);
      throw error;
    }
  }, [createTemplate]);
  
  const getMealTemplate = useCallback(async (id: number): Promise<MealTemplate | null> => {
    try {
      const { data } = await useMealTemplateById(id);
      return data || null;
    } catch (error) {
      console.error('Error getting meal template:', error);
      throw error;
    }
  }, []);
  
  const updateMealTemplate = useCallback(async (id: number, updates: Partial<MealTemplate>) => {
    try {
      await updateTemplate({ id, template: updates });
    } catch (error) {
      console.error('Error updating meal template:', error);
      throw error;
    }
  }, [updateTemplate]);
  
  const deleteMealTemplate = useCallback(async (id: number) => {
    try {
      await deleteTemplate(id);
    } catch (error) {
      console.error('Error deleting meal template:', error);
      throw error;
    }
  }, [deleteTemplate]);
  
  const applyMealTemplate = useCallback(async (
    templateId: number, 
    date: string, 
    mealType: string = 'Breakfast'
  ) => {
    try {
      // Find the template in the cached data
      const template = mealTemplates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Process each food in the template
      for (const food of template.foods_json) {
        // Add each food to the daily diet with the same date and meal type
        await addFoodEntryToDailyDiet(
          {
            id: food.food_id,
            name: food.name,
            protein: food.protein,
            carbs: food.carbs || 0,
            fat: food.fat || 0,
            calories: food.calories,
            serving_size: food.serving_size,
            unit: food.unit
          },
          date,
          mealType
        );
      }
    } catch (error) {
      console.error('Error applying meal template:', error);
      throw error;
    }
  }, [mealTemplates, addFoodEntryToDailyDiet]);

  return (
    <CachingDietContext.Provider value={{
      database,
      isLoadingDatabase: isLoadingFoods,
      dailyDiet,
      isLoadingDailyDiet,
      mealTemplates,
      isLoadingMealTemplates,
      removeFoodEntry,
      removeFoodFromDatabase,
      addFoodToDatabase,
      addFoodEntryToDailyDiet,
      prefetchAdjacentDays: prefetchDays,
      createMealTemplate,
      getMealTemplate,
      updateMealTemplate,
      deleteMealTemplate,
      applyMealTemplate,
      currentDate
    }}>
      {children}
    </CachingDietContext.Provider>
  );
};

// Custom hook to use the diet context
export const useCachingDietContext = () => {
  const context = useContext(CachingDietContext);
  
  if (context === undefined) {
    throw new Error('useCachingDietContext must be used within a CachingDietProvider');
  }
  
  return context;
}; 