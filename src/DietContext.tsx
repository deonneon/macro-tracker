import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Food {
  id: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  servingSize: number;
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
    servingSize: number;
    unit: string 
  }) => Promise<void>;
  addFoodEntryToDailyDiet: (foodDetails: Food & { name: string }, date: string) => Promise<void>;
}

export const DietContext = createContext<DietContextType | undefined>(undefined);

// Get the appropriate API URL based on environment
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

    // Fetch initial data from server
    useEffect(() => {
        fetch(`${API_URL}/foods`)
            .then(res => res.json())
            .then(data => {
                const transformedData: FoodDatabase = {};
                data.forEach((item: any) => {
                    transformedData[item.name] = {
                        id: item.id,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                        calories: item.calories,
                        servingSize: item.servingSize,
                        unit: item.unit
                    };
                });
                setDatabase(transformedData);
            })
            .catch(err => console.error('Failed to fetch foods:', err));

        fetch(`${API_URL}/dailydiet`)
            .then(res => res.json())
            .then(data => setDailyDiet(data))
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

            const newDailyDiet = [...dailyDiet];
            newDailyDiet.splice(index, 1);
            setDailyDiet(newDailyDiet);

            // Delete from server
            const response = await fetch(`${API_URL}/dailydiet/${entry.id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error(`Failed to delete entry: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting daily diet entry:', error);
            // Revert the local state if the server deletion failed
            setDailyDiet(dailyDiet);
        }
    };

    const removeFoodFromDatabase = async (foodName: string): Promise<void> => {
        const newDatabase = { ...database };
        delete newDatabase[foodName];
        setDatabase(newDatabase);

        // Delete from server
        await fetch(`${API_URL}/foods/${foodName}`, { method: 'DELETE' });
    };

    const addFoodToDatabase = async (foodData: { 
      name: string; 
      protein: number; 
      carbs: number;
      fat: number;
      calories: number; 
      servingSize: number;
      unit: string 
    }): Promise<void> => {
        const response = await fetch(`${API_URL}/foods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(foodData),
        });
        const data = await response.json();
        setDatabase({ ...database, [foodData.name]: data });
    };

    const addFoodEntryToDailyDiet = async (foodDetails: Food & { name: string }, date: string): Promise<void> => {
        console.log({ date, food_id: foodDetails.id });
        const response = await fetch(`${API_URL}/dailydiet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date,
                food_id: foodDetails.id
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const newEntry = { ...foodDetails, date, id: data.id };
            setDailyDiet(prevDailyDiet => [...prevDailyDiet, newEntry]);
        }
    };

    return (
        <DietContext.Provider value={{ database, setDatabase, dailyDiet, setDailyDiet, removeFoodEntry, removeFoodFromDatabase, addFoodToDatabase, addFoodEntryToDailyDiet }}>
            {children}
        </DietContext.Provider>
    );
};

export default DietContext; 