import { createClient } from '@supabase/supabase-js';
import { MacroGoal } from '../types/goals';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error };
  },

  async getByDate(date: string, userId: string) {
    // Find goals created on the given date
    // This is approximate since we don't store the form date directly
    // We're searching by the created_at date component
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('macro_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
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
      // ... existing code ...
    };
  };
} 