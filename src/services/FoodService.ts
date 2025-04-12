import { foodsTable, FoodItem } from '../lib/supabase';

// Cache for storing recently accessed foods to improve performance
const foodCache: { [key: string]: FoodItem } = {};

export const FoodService = {
  /**
   * Search for foods by name in the database
   * @param query The search query
   * @returns A promise that resolves to an array of matching food items
   */
  async searchFoods(query: string): Promise<FoodItem[]> {
    try {
      const results = await foodsTable.search(query);
      
      // Update cache with search results
      results.forEach(food => {
        foodCache[food.name] = food;
      });
      
      return results;
    } catch (error) {
      console.error('Error searching for foods:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific food by name
   * @param name The exact name of the food
   * @returns A promise that resolves to the food item
   */
  async getFoodByName(name: string): Promise<FoodItem> {
    // Check cache first
    if (foodCache[name]) {
      return foodCache[name];
    }
    
    try {
      const food = await foodsTable.getByName(name);
      
      // Update cache
      foodCache[name] = food;
      
      return food;
    } catch (error) {
      console.error(`Error fetching food "${name}":`, error);
      throw error;
    }
  },
  
  /**
   * Calculate nutritional information based on a food and serving size
   * @param food The food item
   * @param servingSize The serving size
   * @returns The calculated nutritional information
   */
  calculateNutrition(food: FoodItem, servingSize: number): {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    isExtremeValue: boolean;
  } {
    // Handle edge cases
    const validServingSize = Math.max(0, servingSize || 0);
    const defaultServingSize = Math.max(0.1, food.serving_size || 1);
    
    // Check if this is an extreme serving size (more than 10x the default)
    const isExtremeValue = validServingSize > defaultServingSize * 10;
    
    // Calculate multiplier for scaling nutrition values
    const multiplier = validServingSize / defaultServingSize;
    
    // Ensure values are always valid numbers and properly rounded
    return {
      protein: parseFloat((Math.max(0, food.protein || 0) * multiplier).toFixed(1)),
      carbs: parseFloat((Math.max(0, food.carbs || 0) * multiplier).toFixed(1)),
      fat: parseFloat((Math.max(0, food.fat || 0) * multiplier).toFixed(1)),
      calories: Math.max(0, Math.round((food.calories || 0) * multiplier)),
      isExtremeValue
    };
  },
  
  /**
   * Validate macro ratios to ensure they match calories
   * @param protein Protein in grams
   * @param carbs Carbs in grams
   * @param fat Fat in grams
   * @param calories Total calories
   * @returns Whether the macros roughly match the calories
   */
  validateMacroRatio(protein: number, carbs: number, fat: number, calories: number): boolean {
    const calculatedCalories = (protein * 4) + (carbs * 4) + (fat * 9);
    const tolerance = 10; // Allow small difference to account for rounding
    
    return Math.abs(calculatedCalories - calories) <= tolerance;
  },
  
  /**
   * Get macro percentages for a given set of macronutrients
   * @param protein Protein in grams
   * @param carbs Carbs in grams
   * @param fat Fat in grams
   * @returns Object with percentage values for each macro
   */
  getMacroPercentages(protein: number, carbs: number, fat: number): {
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
  } {
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatCalories = fat * 9;
    const totalCalories = proteinCalories + carbsCalories + fatCalories;
    
    if (totalCalories === 0) {
      return {
        proteinPercentage: 0,
        carbsPercentage: 0,
        fatPercentage: 0
      };
    }
    
    return {
      proteinPercentage: Math.round((proteinCalories / totalCalories) * 100),
      carbsPercentage: Math.round((carbsCalories / totalCalories) * 100),
      fatPercentage: Math.round((fatCalories / totalCalories) * 100)
    };
  },
  
  /**
   * Clear the food cache
   */
  clearCache(): void {
    Object.keys(foodCache).forEach(key => {
      delete foodCache[key];
    });
  }
};

export default FoodService; 