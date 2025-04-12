import React, { useState, useEffect, useContext } from 'react';
import { DietContext } from '../DietContext';
import FoodService from '../services/FoodService';
import { FoodItem, FrequentlyUsedFood, ensureFrequentlyUsedFoodsTable } from '../lib/supabase';

interface QuickAddPopoverProps {
  food: FoodItem;
  defaultServingSize: number;
  onAdd: (foodId: number, servingSize: number, mealType: string) => void;
  onClose: () => void;
}

const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({ 
  food, 
  defaultServingSize, 
  onAdd, 
  onClose 
}) => {
  const [servingSize, setServingSize] = useState<string>(defaultServingSize.toString());
  const [mealType, setMealType] = useState<string>('Breakfast');
  const [nutritionInfo, setNutritionInfo] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0
  });

  // Update calculated nutrition values when serving size changes
  useEffect(() => {
    const newServingSize = parseFloat(servingSize) || 0;
    const nutrition = FoodService.calculateNutrition(food, newServingSize);
    
    setNutritionInfo({
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      calories: nutrition.calories
    });
  }, [servingSize, food]);

  const handleServingSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^(\d*\.?\d*)$/.test(e.target.value)) {
      setServingSize(e.target.value);
    }
  };

  const handleQuickAdd = () => {
    const servingSizeNum = parseFloat(servingSize) || defaultServingSize;
    onAdd(food.id || 0, servingSizeNum, mealType);
    onClose();
  };

  return (
    <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-72">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{food.name}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="serving-size" className="block text-sm font-medium text-gray-700 mb-1">
            Serving Size
          </label>
          <div className="flex items-center">
            <input
              id="serving-size"
              type="text"
              value={servingSize}
              onChange={handleServingSizeChange}
              className="w-20 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Serving size"
            />
            <span className="ml-2 text-gray-600">{food.unit || 'serving'}</span>
            <div className="flex ml-2">
              <button 
                onClick={() => setServingSize(prev => {
                  const val = Math.max(0.25, (parseFloat(prev) || 0) - 0.25);
                  return val.toString();
                })}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-l-md border border-gray-300"
                aria-label="Decrease serving size"
              >
                -
              </button>
              <button 
                onClick={() => setServingSize(prev => {
                  const val = (parseFloat(prev) || 0) + 0.25;
                  return val.toString();
                })}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-r-md border border-t border-r border-b border-gray-300"
                aria-label="Increase serving size"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="meal-type" className="block text-sm font-medium text-gray-700 mb-1">
            Meal Type
          </label>
          <select
            id="meal-type"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            aria-label="Meal type"
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>

        <div className="bg-gray-50 p-2 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Nutrition Info</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Protein: {nutritionInfo.protein}g</div>
            <div>Carbs: {nutritionInfo.carbs}g</div>
            <div>Fat: {nutritionInfo.fat}g</div>
            <div>Calories: {nutritionInfo.calories}</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleQuickAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add food to meal"
          >
            Add to {mealType}
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuickAddFoodProps {
  className?: string;
}

const QuickAddFood: React.FC<QuickAddFoodProps> = ({ className = '' }) => {
  const [frequentFoods, setFrequentFoods] = useState<{ food: FoodItem, frequentData: FrequentlyUsedFood }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [popoverFood, setPopoverFood] = useState<FoodItem | null>(null);
  const [defaultServingSize, setDefaultServingSize] = useState<number>(1);
  const dietContext = useContext(DietContext);

  if (!dietContext) {
    throw new Error('QuickAddFood must be used within a DietProvider');
  }

  const { addFoodEntryToDailyDiet } = dietContext;

  // Fetch frequently used foods
  useEffect(() => {
    const fetchFrequentFoods = async () => {
      try {
        setLoading(true);
        // Ensure the table exists before trying to use it
        await ensureFrequentlyUsedFoodsTable();
        const foods = await FoodService.getFrequentlyUsedFoods();
        setFrequentFoods(foods);
        setError(null);
      } catch (err) {
        console.error('Error fetching frequently used foods:', err);
        setError('Failed to load frequently used foods. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFrequentFoods();
    
    // Set up a refresh interval every 5 minutes
    const intervalId = setInterval(fetchFrequentFoods, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleFoodClick = (food: FoodItem, defaultServing: number) => {
    setPopoverFood(food);
    setDefaultServingSize(defaultServing);
  };

  const handleClosePopover = () => {
    setPopoverFood(null);
  };

  const handleQuickAddFood = async (foodId: number, servingSize: number, mealType: string) => {
    if (!popoverFood) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate nutrition based on serving size
      const nutrition = FoodService.calculateNutrition(popoverFood, servingSize);
      
      // Prepare food entry
      const foodEntry = {
        id: foodId,
        name: popoverFood.name,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        calories: nutrition.calories,
        serving_size: servingSize,
        unit: popoverFood.unit || 'serving'
      };
      
      // Add to daily diet
      await addFoodEntryToDailyDiet(foodEntry, today, mealType);
      
      // Track usage for frequent foods
      await FoodService.trackFoodUsage(foodId, popoverFood.name, servingSize);
      
      // Update the default serving size if it changed
      const frequentFood = frequentFoods.find(f => f.food.id === foodId);
      if (frequentFood && frequentFood.frequentData.default_serving_size !== servingSize) {
        await FoodService.updateDefaultServingSize(foodId, servingSize);
      }
      
    } catch (err) {
      console.error('Error adding food to diet:', err);
      setError('Failed to add food. Please try again.');
    }
  };

  if (loading && frequentFoods.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Quick Add</h2>
        <div className="flex justify-center items-center h-20">
          <div className="animate-pulse text-gray-500">Loading frequently used foods...</div>
        </div>
      </div>
    );
  }

  if (error && frequentFoods.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Quick Add</h2>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (frequentFoods.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Quick Add</h2>
        <div className="bg-gray-50 p-4 rounded-md text-gray-600 text-center">
          No frequently used foods yet. As you add foods to your daily log, they'll appear here for quick access.
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Quick Add</h2>
      
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-4">
          {frequentFoods.map(({ food, frequentData }) => (
            <div 
              key={food.id || frequentData.food_id} 
              className="relative min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => handleFoodClick(food, frequentData.default_serving_size)}
                tabIndex={0}
                role="button"
                aria-label={`Quick add ${food.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleFoodClick(food, frequentData.default_serving_size);
                  }
                }}
              >
                <h3 className="font-medium mb-1 text-gray-800">{food.name}</h3>
                <div className="text-sm text-gray-600 mb-2">
                  {frequentData.default_serving_size} {food.unit || 'serving'}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{food.calories * (frequentData.default_serving_size / (food.serving_size || 1))} cal</span>
                </div>
                <button 
                  className="mt-3 w-full py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFoodClick(food, frequentData.default_serving_size);
                  }}
                  aria-label={`Quick add ${food.name}`}
                >
                  Quick Add
                </button>
              </div>
              
              {popoverFood && popoverFood.id === food.id && (
                <QuickAddPopover 
                  food={popoverFood}
                  defaultServingSize={defaultServingSize}
                  onAdd={handleQuickAddFood}
                  onClose={handleClosePopover}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickAddFood; 