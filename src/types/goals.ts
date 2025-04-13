export interface MacroGoal {
  id?: string;
  user_id?: string;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  calories_goal: number;
  target_date?: string;
  created_at?: string;
  description?: string;
}

export type GoalPeriod = 'daily' | 'weekly' | 'monthly';

export interface MacroTrackingStats {
  date: string;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  goalCalories: number;
  percentageProtein: number;
  percentageCarbs: number;
  percentageFat: number;
  percentageCalories: number;
} 