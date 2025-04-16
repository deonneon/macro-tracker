import React, { useState, useContext, useEffect } from 'react';
import { DietContext } from '../DietContext';

interface ValidationErrors {
  name?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  calories?: string;
  macroBalance?: string;
}

const isValidNumberOrBlank = (value: string): boolean => {
  return /^(\d+(\.\d+)?)?$/.test(value);
};

const FoodEntryForm: React.FC = () => {
  const dietContext = useContext(DietContext);
  
  if (!dietContext) {
    throw new Error('FoodEntryForm must be used within a DietProvider');
  }
  
  const { database, addFoodToDatabase } = dietContext;
  
  // Form state
  const [foodName, setFoodName] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [unit, setUnit] = useState<string>('serving');
  const [servingSize, setServingSize] = useState<string>('1');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [matchingFoods, setMatchingFoods] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle form input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFoodName(value);
    
    // Check for matching foods in database for auto-complete
    if (value) {
      const matches = Object.keys(database).filter(food => 
        food.toLowerCase().includes(value.toLowerCase())
      );
      setMatchingFoods(matches);
    } else {
      setMatchingFoods([]);
    }
  };

  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ): void => {
    if (isValidNumberOrBlank(e.target.value)) {
      setter(e.target.value);
    }
  };

  const selectExistingFood = (name: string): void => {
    setFoodName(name);
    setMatchingFoods([]);
    
    // Auto-fill form with existing food data
    if (database[name]) {
      const food = database[name];
      setProtein(food.protein.toString());
      setCarbs(food.carbs.toString());
      setFat(food.fat.toString());
      setCalories(food.calories.toString());
      setUnit(food.unit);
      setServingSize(food.serving_size.toString());
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Required fields
    if (!foodName.trim()) {
      errors.name = 'Food name is required';
    }
    
    // Parse numeric values
    const proteinVal = parseFloat(protein) || 0;
    const carbsVal = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;
    const caloriesVal = parseFloat(calories) || 0;
    
    // Validate macronutrient balance
    if (proteinVal > 0 && carbsVal > 0 && fatVal > 0 && caloriesVal > 0) {
      const calculatedCalories = (proteinVal * 4) + (carbsVal * 4) + (fatVal * 9);
      const tolerance = 10; // Allow small difference to account for rounding
      
      if (Math.abs(calculatedCalories - caloriesVal) > tolerance) {
        errors.macroBalance = `Calculated calories (${calculatedCalories.toFixed(0)}) don't match input calories (${caloriesVal})`;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Prepare food data
      const foodData = {
        name: foodName.trim(),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        calories: parseFloat(calories) || 0,
        serving_size: parseFloat(servingSize) || 1,
        unit: unit || 'serving'
      };
      
      // Add to database
      await addFoodToDatabase(foodData);
      
      // Show success message
      setSuccessMessage(`${foodName} added successfully!`);
      
      // Reset form after successful submission
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding food:', error);
      setValidationErrors({ 
        ...validationErrors, 
        name: 'Failed to add food. Please try again.' 
      });
    }
  };

  // Reset form fields
  const resetForm = (): void => {
    setFoodName('');
    setProtein('');
    setCarbs('');
    setFat('');
    setCalories('');
    setUnit('serving');
    setServingSize('1');
    setValidationErrors({});
    setMatchingFoods([]);
  };

  // Calculate calories based on macros
  useEffect(() => {
    const proteinVal = parseFloat(protein) || 0;
    const carbsVal = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;
    
    if (proteinVal > 0 || carbsVal > 0 || fatVal > 0) {
      const calculatedCalories = (proteinVal * 4) + (carbsVal * 4) + (fatVal * 9);
      setCalories(calculatedCalories.toFixed(0));
    }
  }, [protein, carbs, fat]);

  // Unit options
  const unitOptions = ['serving', 'g', 'oz', 'cup', 'tbsp', 'tsp', 'slice', 'piece', 'ml'];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Food Entry Form</h1>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Food Name with Autocomplete */}
        <div className="relative">
          <label htmlFor="foodName" className="block text-sm font-medium text-gray-700 mb-1">
            Food Name
          </label>
          <input
            id="foodName"
            type="text"
            value={foodName}
            onChange={handleNameChange}
            placeholder="Enter food name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            aria-label="Food name"
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
          
          {/* Autocomplete dropdown */}
          {matchingFoods.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {matchingFoods.map((food) => (
                <div
                  key={food}
                  onClick={() => selectExistingFood(food)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  tabIndex={0}
                  role="option"
                  aria-selected="false"
                >
                  {food}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Macronutrients - 2 column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
              Protein (g)
            </label>
            <input
              id="protein"
              type="text"
              value={protein}
              onChange={(e) => handleNumericInputChange(e, setProtein)}
              placeholder="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Protein in grams"
            />
          </div>
          
          <div>
            <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-1">
              Carbs (g)
            </label>
            <input
              id="carbs"
              type="text"
              value={carbs}
              onChange={(e) => handleNumericInputChange(e, setCarbs)}
              placeholder="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Carbohydrates in grams"
            />
          </div>
          
          <div>
            <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
              Fat (g)
            </label>
            <input
              id="fat"
              type="text"
              value={fat}
              onChange={(e) => handleNumericInputChange(e, setFat)}
              placeholder="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Fat in grams"
            />
          </div>
          
          <div>
            <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
              Calories
            </label>
            <input
              id="calories"
              type="text"
              value={calories}
              onChange={(e) => handleNumericInputChange(e, setCalories)}
              placeholder="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Calories"
            />
            {validationErrors.macroBalance && (
              <p className="mt-1 text-sm text-amber-600">{validationErrors.macroBalance}</p>
            )}
          </div>
        </div>
        
        {/* Serving details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1">
              Serving Size
            </label>
            <input
              id="servingSize"
              type="text"
              value={servingSize}
              onChange={(e) => handleNumericInputChange(e, setServingSize)}
              placeholder="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Serving size"
            />
          </div>
          
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Measurement unit"
            >
              {unitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={resetForm}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear Form
          </button>
          
          <button
            type="submit"
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Food
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodEntryForm; 