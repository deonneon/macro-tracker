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
  } {
    const defaultServingSize = food.serving_size || 1;
    const multiplier = servingSize / defaultServingSize;
    
    return {
      protein: parseFloat((food.protein * multiplier).toFixed(1)),
      carbs: parseFloat(((food.carbs || 0) * multiplier).toFixed(1)),
      fat: parseFloat(((food.fat || 0) * multiplier).toFixed(1)),
      calories: Math.round(food.calories * multiplier)
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