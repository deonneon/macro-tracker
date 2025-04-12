import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { foodsTable, dailyDietTable, FoodItem, DailyDietWithFood } from './lib/supabase';

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
  addFoodEntryToDailyDiet: (foodDetails: Food & { name: string }, date: string) => Promise<void>;
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

    const addFoodEntryToDailyDiet = async (foodDetails: Food & { name: string }, date: string): Promise<void> => {
        try {
            // Add to Supabase
            const data = await dailyDietTable.add({
                date,
                food_id: foodDetails.id
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

    return (
        <DietContext.Provider value={{ database, setDatabase, dailyDiet, setDailyDiet, removeFoodEntry, removeFoodFromDatabase, addFoodToDatabase, addFoodEntryToDailyDiet }}>
            {children}
        </DietContext.Provider>
    );
};

export default DietContext; 