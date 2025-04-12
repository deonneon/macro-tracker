import React, { useState, useContext, useEffect } from 'react';
import { DietContext } from '../DietContext';
import { format } from 'date-fns';

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
  
  // Handle food selection input change
  const handleFoodSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSelectedFood(value);
    
    if (value) {
      const matches = Object.keys(database).filter(food => 
        food.toLowerCase().includes(value.toLowerCase())
      );
      setMatchingFoods(matches);
    } else {
      setMatchingFoods([]);
      setSelectedFoodData(null);
    }
  };
  
  // Handle selection of food from dropdown
  const selectFood = (name: string): void => {
    setSelectedFood(name);
    setMatchingFoods([]);
    
    if (database[name]) {
      const food = database[name];
      setSelectedFoodData({
        foodName: name,
        servingSize: '1',
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        calories: food.calories
      });
    }
  };
  
  // Handle serving size change
  const handleServingSizeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (/^(\d*\.?\d*)$/.test(value)) {
      setServingSize(value);
    }
  };
  
  // Calculate macros based on serving size
  useEffect(() => {
    if (selectedFoodData && servingSize) {
      const servingSizeValue = parseFloat(servingSize) || 0;
      const food = database[selectedFoodData.foodName];
      
      if (food) {
        const multiplier = servingSizeValue / food.serving_size;
        
        setSelectedFoodData({
          ...selectedFoodData,
          servingSize: servingSize,
          protein: parseFloat((food.protein * multiplier).toFixed(1)),
          carbs: parseFloat((food.carbs * multiplier).toFixed(1)),
          fat: parseFloat((food.fat * multiplier).toFixed(1)),
          calories: Math.round(food.calories * multiplier)
        });
      }
    }
  }, [servingSize, database]);
  
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
    
    if (!selectedFoodData) {
      setErrorMessage('Food data not available');
      return;
    }
    
    try {
      const food = database[selectedFood];
      await addFoodEntryToDailyDiet({
        ...food,
        name: selectedFood,
      }, selectedDate);
      
      // Show success message
      setSuccessMessage(`${selectedFood} added to your ${mealType} for ${selectedDate}!`);
      
      // Reset form
      setSelectedFood('');
      setServingSize('1');
      setSelectedFoodData(null);
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
          <input
            id="foodSelection"
            type="text"
            value={selectedFood}
            onChange={handleFoodSearchChange}
            placeholder="Search foods..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            aria-label="Food selection"
          />
          
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
        </div>
        
        {/* Serving Size */}
        <div>
          <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1">
            Servings
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                const currentValue = parseFloat(servingSize) || 0;
                if (currentValue > 0.1) {
                  setServingSize((currentValue - 0.1).toFixed(1));
                }
              }}
              className="p-2 bg-gray-200 rounded-l-md"
              aria-label="Decrease serving"
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
            />
            <button
              type="button"
              onClick={() => {
                const currentValue = parseFloat(servingSize) || 0;
                setServingSize((currentValue + 0.1).toFixed(1));
              }}
              className="p-2 bg-gray-200 rounded-r-md"
              aria-label="Increase serving"
            >
              +
            </button>
          </div>
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
        >
          Add to Daily Log
        </button>
      </form>
    </div>
  );
};

export default DailyFoodEntryForm; 