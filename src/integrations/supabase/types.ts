export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_events: {
        Row: {
          agent_type: string
          conversation_id: string
          created_at: string
          event_data: Json
          event_type: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          conversation_id: string
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          conversation_id?: string
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      household_activity: {
        Row: {
          activity_type: string
          actor_id: string
          actor_name: string | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          household_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          actor_id: string
          actor_name?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          household_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          actor_id?: string
          actor_name?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          household_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "household_activity_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string
          household_id: string
          id: string
          invite_code: string
          max_uses: number | null
          times_used: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at: string
          household_id: string
          id?: string
          invite_code: string
          max_uses?: number | null
          times_used?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string
          household_id?: string
          id?: string
          invite_code?: string
          max_uses?: number | null
          times_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          activity_level: string | null
          age: number | null
          age_group: string | null
          allergies: Json | null
          calculated_tdee: number | null
          created_at: string | null
          dietary_restrictions: Json | null
          gender: string | null
          health_conditions: Json | null
          height: number | null
          id: string
          medication_interactions: Json | null
          member_type: string
          name: string | null
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          age_group?: string | null
          allergies?: Json | null
          calculated_tdee?: number | null
          created_at?: string | null
          dietary_restrictions?: Json | null
          gender?: string | null
          health_conditions?: Json | null
          height?: number | null
          id?: string
          medication_interactions?: Json | null
          member_type: string
          name?: string | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          age_group?: string | null
          allergies?: Json | null
          calculated_tdee?: number | null
          created_at?: string | null
          dietary_restrictions?: Json | null
          gender?: string | null
          health_conditions?: Json | null
          height?: number | null
          id?: string
          medication_interactions?: Json | null
          member_type?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      household_memberships: {
        Row: {
          household_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_memberships_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          allergens: Json | null
          auto_order_enabled: boolean
          barcode: string | null
          brand_name: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          consumption_rate: number | null
          created_at: string
          dietary_flags: Json | null
          expiry_date: string | null
          fatsecret_id: string | null
          fill_level: number | null
          household_id: string
          id: string
          last_activity_at: string | null
          last_enriched_at: string | null
          name: string
          nutrition_data: Json | null
          original_quantity: number | null
          product_image_url: string | null
          quantity: number | null
          reorder_threshold: number | null
          status: Database["public"]["Enums"]["inventory_status"] | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          allergens?: Json | null
          auto_order_enabled?: boolean
          barcode?: string | null
          brand_name?: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          consumption_rate?: number | null
          created_at?: string
          dietary_flags?: Json | null
          expiry_date?: string | null
          fatsecret_id?: string | null
          fill_level?: number | null
          household_id: string
          id?: string
          last_activity_at?: string | null
          last_enriched_at?: string | null
          name: string
          nutrition_data?: Json | null
          original_quantity?: number | null
          product_image_url?: string | null
          quantity?: number | null
          reorder_threshold?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: Json | null
          auto_order_enabled?: boolean
          barcode?: string | null
          brand_name?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          consumption_rate?: number | null
          created_at?: string
          dietary_flags?: Json | null
          expiry_date?: string | null
          fatsecret_id?: string | null
          fill_level?: number | null
          household_id?: string
          id?: string
          last_activity_at?: string | null
          last_enriched_at?: string | null
          name?: string
          nutrition_data?: Json | null
          original_quantity?: number | null
          product_image_url?: string | null
          quantity?: number | null
          reorder_threshold?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          fat: number | null
          fiber: number | null
          id: string
          image_url: string | null
          items: Json | null
          logged_at: string
          meal_type: string
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          id?: string
          image_url?: string | null
          items?: Json | null
          logged_at: string
          meal_type: string
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          id?: string
          image_url?: string | null
          items?: Json | null
          logged_at?: string
          meal_type?: string
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          meal_type: string
          notes: string | null
          planned_date: string
          recipe_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          meal_type: string
          notes?: string | null
          planned_date: string
          recipe_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          meal_type?: string
          notes?: string | null
          planned_date?: string
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          created_at: string
          id: string
          items: Json
          template_name: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          template_name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          template_name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string
          daily_serving_size: number | null
          food_brand: string | null
          id: string
          name: string
          notes: string | null
          species: string
          toxic_flags_enabled: boolean
          user_id: string
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string
          daily_serving_size?: number | null
          food_brand?: string | null
          id?: string
          name: string
          notes?: string | null
          species: string
          toxic_flags_enabled?: boolean
          user_id: string
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string
          daily_serving_size?: number | null
          food_brand?: string | null
          id?: string
          name?: string
          notes?: string | null
          species?: string
          toxic_flags_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      product_cache: {
        Row: {
          cached_at: string | null
          created_at: string | null
          expires_at: string | null
          fatsecret_response: Json
          id: string
          image_url: string | null
          nutrition_summary: Json | null
          search_term: string
        }
        Insert: {
          cached_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          fatsecret_response: Json
          id?: string
          image_url?: string | null
          nutrition_summary?: Json | null
          search_term: string
        }
        Update: {
          cached_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          fatsecret_response?: Json
          id?: string
          image_url?: string | null
          nutrition_summary?: Json | null
          search_term?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_configured: boolean | null
          agent_configured_at: string | null
          agent_last_configured_at: string | null
          agent_prompt_version: string | null
          allergies: Json | null
          beauty_profile: Json | null
          calculated_tdee: number | null
          created_at: string
          current_household_id: string | null
          current_streak: number | null
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fat_goal: number | null
          daily_protein_goal: number | null
          dietary_preferences: Json | null
          health_goals: Json | null
          household_adults: number | null
          household_kids: number | null
          id: string
          language: string | null
          last_log_date: string | null
          last_retailer_refresh: string | null
          lifestyle_goals: Json | null
          longest_streak: number | null
          onboarding_completed: boolean
          permissions_granted: boolean | null
          preferred_retailer_id: string | null
          preferred_retailer_name: string | null
          streak_start_date: string | null
          updated_at: string
          user_activity_level: string | null
          user_age: number | null
          user_gender: string | null
          user_height: number | null
          user_name: string | null
          user_weight: number | null
          user_zip_code: string | null
          water_goal_ml: number | null
        }
        Insert: {
          agent_configured?: boolean | null
          agent_configured_at?: string | null
          agent_last_configured_at?: string | null
          agent_prompt_version?: string | null
          allergies?: Json | null
          beauty_profile?: Json | null
          calculated_tdee?: number | null
          created_at?: string
          current_household_id?: string | null
          current_streak?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          dietary_preferences?: Json | null
          health_goals?: Json | null
          household_adults?: number | null
          household_kids?: number | null
          id: string
          language?: string | null
          last_log_date?: string | null
          last_retailer_refresh?: string | null
          lifestyle_goals?: Json | null
          longest_streak?: number | null
          onboarding_completed?: boolean
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          streak_start_date?: string | null
          updated_at?: string
          user_activity_level?: string | null
          user_age?: number | null
          user_gender?: string | null
          user_height?: number | null
          user_name?: string | null
          user_weight?: number | null
          user_zip_code?: string | null
          water_goal_ml?: number | null
        }
        Update: {
          agent_configured?: boolean | null
          agent_configured_at?: string | null
          agent_last_configured_at?: string | null
          agent_prompt_version?: string | null
          allergies?: Json | null
          beauty_profile?: Json | null
          calculated_tdee?: number | null
          created_at?: string
          current_household_id?: string | null
          current_streak?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          dietary_preferences?: Json | null
          health_goals?: Json | null
          household_adults?: number | null
          household_kids?: number | null
          id?: string
          language?: string | null
          last_log_date?: string | null
          last_retailer_refresh?: string | null
          lifestyle_goals?: Json | null
          longest_streak?: number | null
          onboarding_completed?: boolean
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          streak_start_date?: string | null
          updated_at?: string
          user_activity_level?: string | null
          user_age?: number | null
          user_gender?: string | null
          user_height?: number | null
          user_name?: string | null
          user_weight?: number | null
          user_zip_code?: string | null
          water_goal_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_household_id_fkey"
            columns: ["current_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cached_at: string | null
          cooking_time: number | null
          created_at: string | null
          difficulty: string | null
          estimated_calories: number | null
          household_id: string
          id: string
          ingredients: Json
          instructions: Json
          match_score: number | null
          name: string
          required_appliances: string[] | null
          servings: number | null
          user_id: string
        }
        Insert: {
          cached_at?: string | null
          cooking_time?: number | null
          created_at?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          household_id: string
          id?: string
          ingredients: Json
          instructions: Json
          match_score?: number | null
          name: string
          required_appliances?: string[] | null
          servings?: number | null
          user_id: string
        }
        Update: {
          cached_at?: string | null
          cooking_time?: number | null
          created_at?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          household_id?: string
          id?: string
          ingredients?: Json
          instructions?: Json
          match_score?: number | null
          name?: string
          required_appliances?: string[] | null
          servings?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_foods: {
        Row: {
          created_at: string | null
          food_name: string
          id: string
          last_used_at: string | null
          nutrition_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          food_name: string
          id?: string
          last_used_at?: string | null
          nutrition_data: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          food_name?: string
          id?: string
          last_used_at?: string | null
          nutrition_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          created_at: string
          household_id: string
          id: string
          inventory_id: string | null
          item_name: string
          priority: string | null
          quantity: number | null
          source: string
          status: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          inventory_id?: string | null
          item_name: string
          priority?: string | null
          quantity?: number | null
          source: string
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          inventory_id?: string | null
          item_name?: string
          priority?: string | null
          quantity?: number | null
          source?: string
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_spoilage: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["inventory_category"]
          days_old: number
          inventory_id: string
          item_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_household_batch: {
        Args: { p_members: Json; p_pets: Json; p_user_id: string }
        Returns: Json
      }
      log_household_activity: {
        Args: {
          p_activity_type: string
          p_entity_id: string
          p_entity_name: string
          p_entity_type: string
          p_household_id: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      mark_spoilage: { Args: { _inventory_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      inventory_category: "fridge" | "pantry" | "beauty" | "pets"
      inventory_status:
        | "sufficient"
        | "low"
        | "critical"
        | "out"
        | "out_of_stock"
        | "likely_spoiled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      inventory_category: ["fridge", "pantry", "beauty", "pets"],
      inventory_status: [
        "sufficient",
        "low",
        "critical",
        "out",
        "out_of_stock",
        "likely_spoiled",
      ],
    },
  },
} as const
