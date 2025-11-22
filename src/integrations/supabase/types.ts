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
      inventory: {
        Row: {
          allergens: Json | null
          auto_order_enabled: boolean
          barcode: string | null
          brand_name: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          created_at: string
          dietary_flags: Json | null
          expiry_date: string | null
          fatsecret_id: string | null
          fill_level: number | null
          id: string
          last_activity_at: string | null
          last_enriched_at: string | null
          name: string
          nutrition_data: Json | null
          product_image_url: string | null
          quantity: number | null
          reorder_threshold: number | null
          status: Database["public"]["Enums"]["inventory_status"] | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergens?: Json | null
          auto_order_enabled?: boolean
          barcode?: string | null
          brand_name?: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          created_at?: string
          dietary_flags?: Json | null
          expiry_date?: string | null
          fatsecret_id?: string | null
          fill_level?: number | null
          id?: string
          last_activity_at?: string | null
          last_enriched_at?: string | null
          name: string
          nutrition_data?: Json | null
          product_image_url?: string | null
          quantity?: number | null
          reorder_threshold?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergens?: Json | null
          auto_order_enabled?: boolean
          barcode?: string | null
          brand_name?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          created_at?: string
          dietary_flags?: Json | null
          expiry_date?: string | null
          fatsecret_id?: string | null
          fill_level?: number | null
          id?: string
          last_activity_at?: string | null
          last_enriched_at?: string | null
          name?: string
          nutrition_data?: Json | null
          product_image_url?: string | null
          quantity?: number | null
          reorder_threshold?: number | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          allergies: Json | null
          beauty_profile: Json | null
          created_at: string
          dietary_preferences: Json | null
          health_goals: Json | null
          household_adults: number | null
          household_kids: number | null
          id: string
          language: string | null
          last_retailer_refresh: string | null
          lifestyle_goals: Json | null
          onboarding_completed: boolean
          permissions_granted: boolean | null
          preferred_retailer_id: string | null
          preferred_retailer_name: string | null
          updated_at: string
          user_name: string | null
          user_zip_code: string | null
        }
        Insert: {
          agent_configured?: boolean | null
          agent_configured_at?: string | null
          allergies?: Json | null
          beauty_profile?: Json | null
          created_at?: string
          dietary_preferences?: Json | null
          health_goals?: Json | null
          household_adults?: number | null
          household_kids?: number | null
          id: string
          language?: string | null
          last_retailer_refresh?: string | null
          lifestyle_goals?: Json | null
          onboarding_completed?: boolean
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          updated_at?: string
          user_name?: string | null
          user_zip_code?: string | null
        }
        Update: {
          agent_configured?: boolean | null
          agent_configured_at?: string | null
          allergies?: Json | null
          beauty_profile?: Json | null
          created_at?: string
          dietary_preferences?: Json | null
          health_goals?: Json | null
          household_adults?: number | null
          household_kids?: number | null
          id?: string
          language?: string | null
          last_retailer_refresh?: string | null
          lifestyle_goals?: Json | null
          onboarding_completed?: boolean
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          updated_at?: string
          user_name?: string | null
          user_zip_code?: string | null
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          created_at: string
          id: string
          inventory_id: string | null
          item_name: string
          priority: string | null
          quantity: number | null
          source: string
          status: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          item_name: string
          priority?: string | null
          quantity?: number | null
          source: string
          status?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          item_name?: string
          priority?: string | null
          quantity?: number | null
          source?: string
          status?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
