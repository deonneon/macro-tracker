import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { foodsTable, dailyDietTable, FoodItem, mealTemplatesTable, MealTemplate, MealTemplateFood } from './lib/supabase';

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

// Log configured API URL for debugging
const API_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
    : (import.meta.env.VITE_NETLIFY_URL || 'https://main--shimmering-figolla-53e06a.netlify.app/api');

// For debugging
console.log('API_URL:', API_URL);

interface DietProviderProps {
  children: ReactNode;
}

export const DietProvider: React.FC<DietProviderProps> = ({ children }) => {
    const [database, setDatabase] = useState<FoodDatabase>({});
    const [dailyDiet, setDailyDiet] = useState<DailyDietItem[]>([]);
    const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);

    // Fetch initial data from Supabase
    useEffect(() => {
        // Fetch foods from Supabase
        foodsTable.getAll()
            .then(data => {
                const transformedData: FoodDatabase = {};
                data.forEach((item: FoodItem) => {
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
            })
            .catch(err => console.error('Failed to fetch foods:', err));

        // Fetch daily diet from Supabase
        dailyDietTable.getAll()
            .then(data => {
                // Transform the data to match the DailyDietItem interface
                const transformedData = data.map(item => ({
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
            })
            .catch(err => console.error('Failed to fetch daily diet:', err));
            
        // Fetch meal templates from Supabase
        mealTemplatesTable.getAll()
            .then(data => {
                setMealTemplates(data);
            })
            .catch(err => console.error('Failed to fetch meal templates:', err));
    }, []);

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

            // Update local state immediately for better UX
            const newDailyDiet = [...dailyDiet];
            newDailyDiet.splice(index, 1);
            setDailyDiet(newDailyDiet);

            // Delete from Supabase
            await dailyDietTable.delete(entry.id);
        } catch (error) {
            console.error('Error deleting daily diet entry:', error);
            // Revert the local state if the server deletion failed
            setDailyDiet(dailyDiet);
        }
    };

    const removeFoodFromDatabase = async (foodName: string): Promise<void> => {
        try {
            // Update local state immediately for better UX
            const newDatabase = { ...database };
            delete newDatabase[foodName];
            setDatabase(newDatabase);

            // Delete from Supabase
            await foodsTable.delete(foodName);
        } catch (error) {
            console.error('Error deleting food from database:', error);
            // Revert on error
            setDatabase(database);
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
            // Add to Supabase
            const data = await foodsTable.add({
                name: foodData.name,
                protein: foodData.protein,
                carbs: foodData.carbs,
                fat: foodData.fat,
                calories: foodData.calories,
                serving_size: foodData.serving_size,
                unit: foodData.unit
            });

            // Update local state with the response from Supabase
            setDatabase(prev => ({ 
                ...prev, 
                [foodData.name]: {
                    id: data.id || 0,
                    protein: data.protein,
                    carbs: data.carbs || 0,
                    fat: data.fat || 0,
                    calories: data.calories,
                    serving_size: data.serving_size || 1,
                    unit: data.unit
                }
            }));
        } catch (error) {
            console.error('Error adding food to database:', error);
            throw error; // Re-throw the error to handle it in the component
        }
    };

    const addFoodEntryToDailyDiet = async (foodDetails: Food & { name: string }, date: string, mealType: string = 'Breakfast'): Promise<void> => {
        try {
            // Add to Supabase
            const data = await dailyDietTable.add({
                date,
                food_id: foodDetails.id,
                meal_type: mealType
            });

            // Add to local state with the response
            const newEntry = { 
                ...foodDetails, 
                date, 
                id: data.id || 0 
            };
            
            setDailyDiet(prevDailyDiet => [...prevDailyDiet, newEntry]);
        } catch (error) {
            console.error('Error adding food entry to daily diet:', error);
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
            
            // Create the template in Supabase
            const newTemplate = await mealTemplatesTable.add({
                name,
                description,
                foods_json: templateFoods
            });
            
            // Update local state
            setMealTemplates(prev => [...prev, newTemplate]);
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
            // Update in Supabase
            const updatedTemplate = await mealTemplatesTable.update(id, updates);
            
            // Update local state
            setMealTemplates(prev => 
                prev.map(template => 
                    template.id === id ? updatedTemplate : template
                )
            );
        } catch (error) {
            console.error('Error updating meal template:', error);
            throw error;
        }
    };
    
    const deleteMealTemplate = async (id: number): Promise<void> => {
        try {
            // Update local state immediately for better UX
            setMealTemplates(prev => 
                prev.filter(template => template.id !== id)
            );
            
            // Delete from Supabase
            await mealTemplatesTable.delete(id);
        } catch (error) {
            console.error('Error deleting meal template:', error);
            // Revert local state if server operation failed
            mealTemplatesTable.getAll()
                .then(data => setMealTemplates(data))
                .catch(err => console.error('Failed to fetch meal templates after error:', err));
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