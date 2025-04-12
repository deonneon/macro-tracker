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