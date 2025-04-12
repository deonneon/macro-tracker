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
  servingSize?: number;
  unit: string;
  created_at?: string;
}

// Interface for daily diet entries
export interface DailyDietEntry {
  id?: number;
  date: string;
  food_id: number;
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
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    };
  };
} 