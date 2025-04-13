import { createClient } from '@supabase/supabase-js';
import { MacroGoal } from '../types/goals';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface for food items
export interface FoodItem {
  id?: number;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  serving_size?: number;
  unit: string;
  created_at?: string;
}

// Interface for meal template foods
export interface MealTemplateFood {
  food_id: number;
  name: string;
  serving_size: number;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  unit: string;
}

// Interface for meal templates
export interface MealTemplate {
  id?: number;
  user_id?: string;
  name: string;
  description?: string;
  foods_json: MealTemplateFood[];
  created_at?: string;
  updated_at?: string;
}

// Interface for frequently used foods
export interface FrequentlyUsedFood {
  id?: number;
  food_id: number;
  food_name: string;
  default_serving_size: number;
  usage_count: number;
  last_used_date: string;
  user_id?: string;
}

// Interface for daily diet entries
export interface DailyDietEntry {
  id?: number;
  date: string;
  food_id: number;
  meal_type?: string;
  created_at?: string;
}

// Interface for joined daily diet entries with food details
export interface DailyDietWithFood {
  id: number;
  date: string;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  unit: string;
  food_id: number;
  meal_type?: string;
}

// Database response types
interface FoodResponse {
  id: number;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  unit: string;
}

// Foods table operations
export const foodsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('foods')
      .select('*');
    
    if (error) throw error;
    
    return data;
  },

  async getByName(name: string) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) throw error;
    return data;
  },

  async add(food: Omit<FoodItem, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('foods')
      .insert([food])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, food: Partial<FoodItem>) {
    const { data, error } = await supabase
      .from('foods')
      .update(food)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(name: string) {
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('name', name);
    
    if (error) throw error;
    return true;
  },
  
  async search(query: string) {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${query}%`);
    
    if (error) throw error;
    return data;
  }
};

// Frequently used foods table operations
export const frequentlyUsedFoodsTable = {
  // Initialize the table if needed
  async initialize() {
    try {
      // Check if the table exists
      const { data, error } = await supabase
        .from('frequently_used_foods')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // If the table doesn't exist, create it
        // This requires admin privileges
        console.log('Attempting to create frequently_used_foods table...');
        
        await supabase.rpc('create_frequently_used_foods_table');
        return true;
      }
      
      // Table exists
      return true;
    } catch (error) {
      console.error('Error initializing frequently_used_foods table:', error);
      return false;
    }
  },

  async getAll() {
    try {
      // Use the correct foreign key relationship name (fk_food)
      const { data, error } = await supabase
        .from('frequently_used_foods')
        .select(`
          *,
          foods!fk_food (*)
        `)
        .order('usage_count', { ascending: false })
        .limit(15);
      
      if (!error) {
        return data;
      }
      
      // If that fails, try a manual join
      console.warn('Falling back to manual join due to error:', error);
      
      const { data: frequentFoods, error: frequentFoodsError } = await supabase
        .from('frequently_used_foods')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(15);
        
      if (frequentFoodsError) throw frequentFoodsError;
      
      // Manually fetch each food by ID
      const result = [];
      for (const freqFood of frequentFoods) {
        try {
          const { data: foodData, error: foodError } = await supabase
            .from('foods')
            .select('*')
            .eq('id', freqFood.food_id)
            .single();
            
          if (!foodError) {
            result.push({
              ...freqFood,
              foods: foodData
            });
          }
        } catch (err) {
          console.error('Error fetching individual food:', err);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in getAll method:', error);
      throw error;
    }
  },

  async add(foodId: number, foodName: string, defaultServingSize: number = 1) {
    const now = new Date().toISOString();
    
    // Check if the food already exists in the frequently used foods
    const { data: existingEntry, error: checkError } = await supabase
      .from('frequently_used_foods')
      .select('*')
      .eq('food_id', foodId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    if (existingEntry) {
      // Update the existing entry
      const { data, error } = await supabase
        .from('frequently_used_foods')
        .update({
          usage_count: existingEntry.usage_count + 1,
          last_used_date: now
        })
        .eq('id', existingEntry.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      // Create a new entry
      const { data, error } = await supabase
        .from('frequently_used_foods')
        .insert([{
          food_id: foodId,
          food_name: foodName,
          default_serving_size: defaultServingSize,
          usage_count: 1,
          last_used_date: now
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },
  
  async incrementUsage(foodId: number) {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('frequently_used_foods')
      .update({
        usage_count: supabase.rpc('increment_usage_count', { row_id: foodId }),
        last_used_date: now
      })
      .eq('food_id', foodId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateServingSize(foodId: number, servingSize: number) {
    const { data, error } = await supabase
      .from('frequently_used_foods')
      .update({ default_serving_size: servingSize })
      .eq('food_id', foodId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Helper to ensure the table exists before using it
export const ensureFrequentlyUsedFoodsTable = async () => {
  try {
    await frequentlyUsedFoodsTable.initialize();
  } catch (error) {
    console.error('Failed to initialize frequently_used_foods table:', error);
  }
};

// Goals table operations
export const goalsTable = {
  async create(goal: Omit<MacroGoal, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('macro_goals')
      .insert([goal])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLatest() {
    const { data, error } = await supabase
      .from('macro_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('macro_goals')
      .select('*')
      .order('target_date', { ascending: false });
    
    if (error) throw error;
    return { data, error };
  },

  async getByDate(date: string, userId: string) {
    // Find goals with the matching target_date
    const { data, error } = await supabase
      .from('macro_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', date)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async update(id: string, goal: Partial<MacroGoal>) {
    const { data, error } = await supabase
      .from('macro_goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string) {
    const { error } = await supabase
      .from('macro_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Daily Diet table operations
export const dailyDietTable = {
  async getAll(): Promise<DailyDietWithFood[]> {
    const { data, error } = await supabase
      .from('dailydiet')
      .select(`
        id,
        date,
        foods!dailydiet_food_id_fkey (
          id,
          name,
          protein,
          carbs,
          fat,
          calories,
          unit
        )
      `);
    
    if (error) throw error;
    
    // Transform the data to a more usable format
    return (data as unknown as any[]).map(item => ({
      id: item.id,
      date: item.date,
      name: item.foods.name,
      protein: item.foods.protein,
      carbs: item.foods.carbs,
      fat: item.foods.fat,
      calories: item.foods.calories,
      unit: item.foods.unit,
      food_id: item.foods.id
    }));
  },

  async getByDate(date: string): Promise<DailyDietWithFood[]> {
    const { data, error } = await supabase
      .from('dailydiet')
      .select(`
        id,
        date,
        foods!dailydiet_food_id_fkey (
          id,
          name,
          protein,
          carbs,
          fat,
          calories,
          unit
        )
      `)
      .eq('date', date);
    
    if (error) throw error;
    
    // Transform the data to a more usable format
    return (data as unknown as any[]).map(item => ({
      id: item.id,
      date: item.date,
      name: item.foods.name,
      protein: item.foods.protein,
      carbs: item.foods.carbs,
      fat: item.foods.fat,
      calories: item.foods.calories,
      unit: item.foods.unit,
      food_id: item.foods.id
    }));
  },

  async add(entry: Omit<DailyDietEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('dailydiet')
      .insert([entry])
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async update(id: number, updates: Partial<Omit<DailyDietEntry, 'id' | 'created_at'> & { 
    name?: string;
    protein?: number;
    carbs?: number;
    fat?: number;
    calories?: number;
    meal_type?: string;
    serving_size?: number;
    unit?: string;
  }>) {
    // First, get the current entry to ensure it exists
    const { data: entry, error: fetchError } = await supabase
      .from('dailydiet')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Extract fields that belong to the dailydiet table
    const dailyDietUpdates: Partial<DailyDietEntry> = {
      date: updates.date,
      food_id: updates.food_id
    };
    
    // Apply updates to the dailydiet table
    const { data: updatedEntry, error: updateError } = await supabase
      .from('dailydiet')
      .update(dailyDietUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // If we're also updating food-related fields that need to be saved in the foods table
    if (updates.name || 
        updates.protein !== undefined || 
        updates.carbs !== undefined || 
        updates.fat !== undefined || 
        updates.calories !== undefined || 
        updates.unit) {
      
      // For now, just return the updated data
      return {
        ...updatedEntry,
        name: updates.name || '',
        protein: updates.protein || 0,
        carbs: updates.carbs,
        fat: updates.fat,
        calories: updates.calories || 0,
        meal_type: updates.meal_type,
        unit: updates.unit || '',
      };
    }
    
    // If we're just updating the dailydiet entry, fetch the complete entry with food details
    const result = await this.getByDate(updatedEntry.date);
    return result.find(item => item.id === id);
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('dailydiet')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Meal templates table operations
export const mealTemplatesTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async add(template: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('meal_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, template: Partial<Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('meal_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('meal_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

export interface Database {
  public: {
    Tables: {
      macro_goals: {
        Row: MacroGoal;
        Insert: Omit<MacroGoal, 'id' | 'created_at'>;
        Update: Partial<Omit<MacroGoal, 'id' | 'created_at'>>;
      };
      foods: {
        Row: FoodItem;
        Insert: Omit<FoodItem, 'id' | 'created_at'>;
        Update: Partial<Omit<FoodItem, 'id' | 'created_at'>>;
      };
      dailydiet: {
        Row: DailyDietEntry;
        Insert: Omit<DailyDietEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyDietEntry, 'id' | 'created_at'>>;
      };
      frequently_used_foods: {
        Row: FrequentlyUsedFood;
        Insert: Omit<FrequentlyUsedFood, 'id'>;
        Update: Partial<Omit<FrequentlyUsedFood, 'id'>>;
      };
      meal_templates: {
        Row: MealTemplate;
        Insert: Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MealTemplate, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
} 