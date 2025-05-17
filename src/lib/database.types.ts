export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dailydiet: {
        Row: {
          created_at: string
          date: string
          food_id: number | null
          id: number
          meal_type: string | null
          quantity: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          food_id?: number | null
          id?: number
          meal_type?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          food_id?: number | null
          id?: number
          meal_type?: string | null
          quantity?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dailydiet_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string
          fat: number | null
          id: number
          name: string
          protein: number
          serving_size: number | null
          unit: string
          user_id: string | null
        }
        Insert: {
          calories: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: number
          name: string
          protein: number
          serving_size?: number | null
          unit: string
          user_id?: string | null
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: number
          name?: string
          protein?: number
          serving_size?: number | null
          unit?: string
          user_id?: string | null
        }
        Relationships: []
      }
      frequently_used_foods: {
        Row: {
          created_at: string
          default_serving_size: number
          food_id: number
          food_name: string
          id: number
          last_used_date: string
          usage_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          default_serving_size?: number
          food_id: number
          food_name: string
          id?: number
          last_used_date?: string
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          default_serving_size?: number
          food_id?: number
          food_name?: string
          id?: number
          last_used_date?: string
          usage_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_food"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_goals: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          protein: number
          target_date: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          fat: number
          id?: string
          protein: number
          target_date?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          protein?: number
          target_date?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_templates: {
        Row: {
          created_at: string
          description: string | null
          foods_json: Json
          id: number
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          foods_json: Json
          id?: number
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          foods_json?: Json
          id?: number
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage_count: {
        Args: { row_id: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 