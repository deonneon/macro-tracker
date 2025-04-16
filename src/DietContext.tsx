import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { FoodItem, mealTemplatesTable, MealTemplate, MealTemplateFood } from './lib/supabase';

// Import React Query hooks
import { useAllFoods, useAddFood, useDeleteFood } from './hooks/useFoodDatabase';
import { useDailyEntriesByDate, useAddDailyEntry, useDeleteDailyEntry, usePrefetchAdjacentDays } from './hooks/useDailyEntries'; 
import { useAllMealTemplates, useCreateMealTemplate, useUpdateMealTemplate, useDeleteMealTemplate } from './hooks/useMealTemplates';
import { format } from 'date-fns';

export interface Food {
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
  setDatabase: React.Dispatch<React.SetStateAction<FoodDatabase>>;
  dailyDiet: DailyDietItem[];
  setDailyDiet: React.Dispatch<React.SetStateAction<DailyDietItem[]>>;
  mealTemplates: MealTemplate[];
  setMealTemplates: React.Dispatch<React.SetStateAction<MealTemplate[]>>;
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
  createMealTemplate: (name: string, description: string, selectedFoods: Array<Food & { name: string }>) => Promise<void>;
  getMealTemplate: (id: number) => Promise<MealTemplate>;
  updateMealTemplate: (id: number, updates: Partial<MealTemplate>) => Promise<void>;
  deleteMealTemplate: (id: number) => Promise<void>;
  applyMealTemplate: (templateId: number, date: string, mealType?: string) => Promise<void>;
}

export const DietContext = createContext<DietContextType | undefined>(undefined);


interface DietProviderProps {
  children: ReactNode;
}

export const DietProvider: React.FC<DietProviderProps> = ({ children }) => {
    // For storing state in a way compatible with existing code
    const [database, setDatabase] = useState<FoodDatabase>({});
    const [dailyDiet, setDailyDiet] = useState<DailyDietItem[]>([]);
    const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
    
    // Today's date in YYYY-MM-DD format
    const currentDate = format(new Date(), 'yyyy-MM-dd');

    // Use React Query hooks for data fetching
    const { data: foods  } = useAllFoods();
    const { data: dailyEntries } = useDailyEntriesByDate(currentDate);
    const { data: templates } = useAllMealTemplates();
    
    // Get prefetch function from hook
    const prefetchDays = usePrefetchAdjacentDays();
    
    // Mutation hooks
    const { mutateAsync: addFood } = useAddFood();
    const { mutateAsync: deleteFood } = useDeleteFood();
    const { mutateAsync: addDailyEntry } = useAddDailyEntry();
    const { mutateAsync: deleteDailyEntry } = useDeleteDailyEntry();
    const { mutateAsync: createTemplate } = useCreateMealTemplate();
    const { mutateAsync: updateTemplate } = useUpdateMealTemplate();
    const { mutateAsync: deleteTemplate } = useDeleteMealTemplate();

    // Update state when React Query data changes
    useEffect(() => {
        if (foods) {
            const transformedData: FoodDatabase = {};
            foods.forEach((item: FoodItem) => {
                transformedData[item.name] = {
                    id: item.id || 0,
                    protein: item.protein,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0,
                    calories: item.calories,
                    serving_size: item.serving_size || 1,
                    unit: item.unit
                };
            });
            setDatabase(transformedData);
        }
    }, [foods]);

    // Update daily diet when React Query data changes
    useEffect(() => {
        if (dailyEntries) {
            // Transform the data to match the DailyDietItem interface
            const transformedData = dailyEntries.map(item => ({
                id: item.id,
                date: item.date,
                name: item.name,
                protein: item.protein,
                carbs: item.carbs || 0,
                fat: item.fat || 0,
                calories: item.calories,
                serving_size: 1,
                unit: item.unit,
                food_id: item.food_id
            }));
            setDailyDiet(transformedData);
        }
    }, [dailyEntries]);

    // Update meal templates when React Query data changes
    useEffect(() => {
        if (templates) {
            setMealTemplates(templates);
        }
    }, [templates]);

    // Prefetch adjacent days data
    useEffect(() => {
        prefetchDays(currentDate);
    }, [currentDate, prefetchDays]);

    const removeFoodEntry = async (index: number): Promise<void> => {
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

            // Let react-query handle the state update
            await deleteDailyEntry({ id: entry.id, date: entry.date });
        } catch (error) {
            console.error('Error deleting daily diet entry:', error);
            throw error;
        }
    };

    const removeFoodFromDatabase = async (foodName: string): Promise<void> => {
        try {
            await deleteFood(foodName);
        } catch (error) {
            console.error('Error deleting food from database:', error);
            throw error;
        }
    };

    const addFoodToDatabase = async (foodData: { 
      name: string; 
      protein: number; 
      carbs: number;
      fat: number;
      calories: number; 
      serving_size: number;
      unit: string 
    }): Promise<void> => {
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
    };

    const addFoodEntryToDailyDiet = async (foodDetails: Food & { name: string }, date: string, mealType: string = 'Breakfast'): Promise<void> => {
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
    };
    
    const createMealTemplate = async (name: string, description: string, selectedFoods: Array<Food & { name: string }>): Promise<void> => {
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
    };
    
    const getMealTemplate = async (id: number): Promise<MealTemplate> => {
        try {
            const template = await mealTemplatesTable.getById(id);
            return template;
        } catch (error) {
            console.error('Error getting meal template:', error);
            throw error;
        }
    };
    
    const updateMealTemplate = async (id: number, updates: Partial<MealTemplate>): Promise<void> => {
        try {
            await updateTemplate({ id, template: updates });
        } catch (error) {
            console.error('Error updating meal template:', error);
            throw error;
        }
    };
    
    const deleteMealTemplate = async (id: number): Promise<void> => {
        try {
            await deleteTemplate(id);
        } catch (error) {
            console.error('Error deleting meal template:', error);
            throw error;
        }
    };
    
    const applyMealTemplate = async (templateId: number, date: string, mealType: string = 'Breakfast'): Promise<void> => {
        try {
            // Fetch the template
            const template = await mealTemplatesTable.getById(templateId);
            
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
    };

    return (
        <DietContext.Provider value={{ 
            database, 
            setDatabase, 
            dailyDiet, 
            setDailyDiet, 
            mealTemplates,
            setMealTemplates,
            removeFoodEntry, 
            removeFoodFromDatabase, 
            addFoodToDatabase, 
            addFoodEntryToDailyDiet,
            createMealTemplate,
            getMealTemplate,
            updateMealTemplate,
            deleteMealTemplate,
            applyMealTemplate
        }}>
            {children}
        </DietContext.Provider>
    );
};

export default DietContext; 