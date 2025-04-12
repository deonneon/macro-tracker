import React, { useState, useContext, useEffect } from 'react';
import { DietContext } from '../DietContext';
import { format } from 'date-fns';
import FoodService from '../services/FoodService';
import { FoodItem } from '../lib/supabase';

interface FoodSelectionProps {
  foodName: string;
  servingSize: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

const DailyFoodEntryForm: React.FC = () => {
  const dietContext = useContext(DietContext);
  
  if (!dietContext) {
    throw new Error('DailyFoodEntryForm must be used within a DietProvider');
  }
  
  const { database, addFoodEntryToDailyDiet } = dietContext;
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<string>('Breakfast');
  const [selectedFood, setSelectedFood] = useState<string>('');
  const [servingSize, setServingSize] = useState<string>('1');
  const [matchingFoods, setMatchingFoods] = useState<string[]>([]);
  const [selectedFoodData, setSelectedFoodData] = useState<FoodSelectionProps | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [databaseError, setDatabaseError] = useState<string>('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  
  // Search foods using the new service
  const searchFoods = async (query: string): Promise<void> => {
    if (!query) {
      setMatchingFoods([]);
      return;
    }
    
    setIsSearching(true);
    setDatabaseError('');
    
    try {
      // First try local database (faster)
      const localMatches = Object.keys(database).filter(food => 
        food.toLowerCase().includes(query.toLowerCase())
      );
      
      if (localMatches.length > 0) {
        setMatchingFoods(localMatches);
        setIsSearching(false);
        return;
      }
      
      // If no local matches, try the service
      const apiResults = await FoodService.searchFoods(query);
      const foodNames = apiResults.map(food => food.name);
      setMatchingFoods(foodNames);
    } catch (error) {
      console.error('Error searching foods:', error);
      setDatabaseError('Unable to search foods. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (selectedFood) {
        searchFoods(selectedFood);
      } else {
        setMatchingFoods([]);
      }
    }, 300); // 300ms delay
    
    return () => clearTimeout(delayDebounce);
  }, [selectedFood]);
  
  // Handle food selection input change
  const handleFoodSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSelectedFood(value);
    
    if (!value) {
      setSelectedFoodData(null);
      setSelectedFoodItem(null);
    }
  };
  
  // Handle selection of food from dropdown
  const selectFood = async (name: string): Promise<void> => {
    setSelectedFood(name);
    setMatchingFoods([]);
    setDatabaseError('');
    
    try {
      let foodItem: FoodItem;
      
      // Check if the food is in local database first
      if (database[name]) {
        foodItem = {
          ...database[name],
          name: name,
        };
      } else {
        // If not in local database, fetch from API
        setIsSearching(true);
        foodItem = await FoodService.getFoodByName(name);
      }
      
      // Store the selected food item for later use
      setSelectedFoodItem(foodItem);
      
      // Update the food data with default serving
      updateFoodData(foodItem, parseFloat(servingSize) || 1);
      
    } catch (error) {
      console.error('Error fetching food details:', error);
      setDatabaseError('Unable to fetch food details. Please try again.');
      setSelectedFoodData(null);
      setSelectedFoodItem(null);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Update food data with new serving size
  const updateFoodData = (foodItem: FoodItem, newServingSize: number): void => {
    const nutrition = FoodService.calculateNutrition(foodItem, newServingSize);
    
    setSelectedFoodData({
      foodName: foodItem.name,
      servingSize: newServingSize.toString(),
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      calories: nutrition.calories
    });
  };
  
  // Handle serving size change
  const handleServingSizeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (/^(\d*\.?\d*)$/.test(value)) {
      setServingSize(value);
      
      // Update nutritional information if a food is selected
      if (selectedFoodItem) {
        const newServingSize = parseFloat(value) || 0;
        updateFoodData(selectedFoodItem, newServingSize);
      }
    }
  };
  
  // Update calculated values when serving size changes
  useEffect(() => {
    if (selectedFoodItem && servingSize) {
      const newServingSize = parseFloat(servingSize) || 0;
      updateFoodData(selectedFoodItem, newServingSize);
    }
  }, [servingSize, selectedFoodItem]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validation
    if (!selectedFood) {
      setErrorMessage('Please select a food');
      return;
    }
    
    if (!servingSize || parseFloat(servingSize) <= 0) {
      setErrorMessage('Please enter a valid serving size');
      return;
    }
    
    if (!selectedFoodData || !selectedFoodItem) {
      setErrorMessage('Food data not available');
      return;
    }
    
    try {
      // Add food entry to diet with the selected date and meal type
      const foodForDatabase = {
        id: selectedFoodItem.id || 0, // Ensure id is a number, not undefined
        name: selectedFood,
        protein: selectedFoodItem.protein,
        carbs: selectedFoodItem.carbs || 0,
        fat: selectedFoodItem.fat || 0,
        calories: selectedFoodItem.calories,
        serving_size: selectedFoodItem.serving_size || 1,
        unit: selectedFoodItem.unit
      };
      
      await addFoodEntryToDailyDiet(foodForDatabase, selectedDate);
      
      // Show success message with meal type
      setSuccessMessage(`${selectedFood} added to your ${mealType} for ${selectedDate}!`);
      
      // Reset form
      setSelectedFood('');
      setServingSize('1');
      setSelectedFoodData(null);
      setSelectedFoodItem(null);
      setErrorMessage('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding food entry:', error);
      setErrorMessage('Failed to add food entry. Please try again.');
    }
  };
  
  // Meal type options
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  
  // Helper function to adjust serving size
  const adjustServingSize = (amount: number): void => {
    const currentValue = parseFloat(servingSize) || 0;
    const newValue = Math.max(0.1, currentValue + amount);
    setServingSize(newValue.toFixed(1));
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Log Food Entry</h1>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
      
      {databaseError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {databaseError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Meal Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="entryDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Entry date"
            />
          </div>
          
          <div>
            <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Type
            </label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Meal type"
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Food Selection with Autocomplete */}
        <div className="relative">
          <label htmlFor="foodSelection" className="block text-sm font-medium text-gray-700 mb-1">
            Select Food
          </label>
          <div className="relative">
            <input
              id="foodSelection"
              type="text"
              value={selectedFood}
              onChange={handleFoodSearchChange}
              placeholder="Search foods..."
              className={`w-full p-2 pl-4 border ${
                selectedFoodData 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300'
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              aria-label="Food selection"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            {selectedFoodData && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Autocomplete dropdown */}
          {matchingFoods.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {matchingFoods.map((food) => (
                <div
                  key={food}
                  onClick={() => selectFood(food)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  tabIndex={0}
                  role="option"
                  aria-selected="false"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      selectFood(food);
                    }
                  }}
                >
                  {food}
                </div>
              ))}
            </div>
          )}
          
          {selectedFood && matchingFoods.length === 0 && !isSearching && !selectedFoodData && !databaseError && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 text-center text-gray-600">
              No matching foods found. <br />
              <span className="text-sm">Try adding this food to your database first.</span>
            </div>
          )}
        </div>
        
        {/* Serving Size */}
        <div>
          <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1">
            Servings
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => adjustServingSize(-0.1)}
              className="p-2 bg-gray-200 rounded-l-md"
              aria-label="Decrease serving"
              disabled={!selectedFoodData}
            >
              -
            </button>
            <input
              id="servingSize"
              type="text"
              value={servingSize}
              onChange={handleServingSizeChange}
              className="flex-1 p-2 text-center border-t border-b border-gray-300"
              aria-label="Serving size"
              disabled={!selectedFoodData}
            />
            <button
              type="button"
              onClick={() => adjustServingSize(0.1)}
              className="p-2 bg-gray-200 rounded-r-md"
              aria-label="Increase serving"
              disabled={!selectedFoodData}
            >
              +
            </button>
          </div>
          {selectedFoodItem && (
            <p className="mt-1 text-xs text-gray-500">
              Default serving: {selectedFoodItem.serving_size} {selectedFoodItem.unit}
            </p>
          )}
        </div>
        
        {/* Nutritional Information Display */}
        {selectedFoodData && (
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium text-gray-800 mb-2">Nutritional Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-blue-50 rounded text-center">
                <div className="text-sm text-gray-600">Calories</div>
                <div className="font-bold">{selectedFoodData.calories}</div>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <div className="text-sm text-gray-600">Protein</div>
                <div className="font-bold">{selectedFoodData.protein}g</div>
              </div>
              <div className="p-2 bg-green-50 rounded text-center">
                <div className="text-sm text-gray-600">Carbs</div>
                <div className="font-bold">{selectedFoodData.carbs}g</div>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-center">
                <div className="text-sm text-gray-600">Fat</div>
                <div className="font-bold">{selectedFoodData.fat}g</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={!selectedFoodData || isSearching}
        >
          Add to Daily Log
        </button>
      </form>
    </div>
  );
};

export default DailyFoodEntryForm; 