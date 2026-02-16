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
      achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      beauty_profiles: {
        Row: {
          created_at: string
          goals: Json
          hair_concerns: Json
          hair_type: string | null
          id: string
          preferred_brands: Json
          routine_style: string | null
          sensitivities: Json
          skin_concerns: Json
          skin_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goals?: Json
          hair_concerns?: Json
          hair_type?: string | null
          id?: string
          preferred_brands?: Json
          routine_style?: string | null
          sensitivities?: Json
          skin_concerns?: Json
          skin_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goals?: Json
          hair_concerns?: Json
          hair_type?: string | null
          id?: string
          preferred_brands?: Json
          routine_style?: string | null
          sensitivities?: Json
          skin_concerns?: Json
          skin_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beauty_routines: {
        Row: {
          category: string | null
          created_at: string
          duration_minutes: number | null
          frequency: string | null
          household_id: string
          id: string
          image_url: string | null
          name: string
          products: Json
          source: string
          source_url: string | null
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_minutes?: number | null
          frequency?: string | null
          household_id: string
          id?: string
          image_url?: string | null
          name: string
          products?: Json
          source?: string
          source_url?: string | null
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_minutes?: number | null
          frequency?: string | null
          household_id?: string
          id?: string
          image_url?: string | null
          name?: string
          products?: Json
          source?: string
          source_url?: string | null
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_routines_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      category_onboarding_progress: {
        Row: {
          category: Database["public"]["Enums"]["category_type"]
          completed_at: string | null
          created_at: string
          id: string
          last_step_key: string | null
          level: number
          schema_version: string
          status: Database["public"]["Enums"]["onboarding_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["category_type"]
          completed_at?: string | null
          created_at?: string
          id?: string
          last_step_key?: string | null
          level?: number
          schema_version?: string
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["category_type"]
          completed_at?: string | null
          created_at?: string
          id?: string
          last_step_key?: string | null
          level?: number
          schema_version?: string
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
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
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          energy_level: number
          id: string
          mood: string
          notes: string | null
          sleep_quality: number | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string
          energy_level: number
          id?: string
          mood: string
          notes?: string | null
          sleep_quality?: number | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          energy_level?: number
          id?: string
          mood?: string
          notes?: string | null
          sleep_quality?: number | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      daily_digests: {
        Row: {
          digest_date: string
          generated_at: string | null
          household_id: string | null
          id: string
          insights: Json
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          digest_date?: string
          generated_at?: string | null
          household_id?: string | null
          id?: string
          insights?: Json
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          digest_date?: string
          generated_at?: string | null
          household_id?: string | null
          id?: string
          insights?: Json
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_digests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      food_profiles: {
        Row: {
          allergies: Json
          created_at: string
          diet_rules: Json
          dislikes: Json
          goals: string | null
          health_conditions: Json
          id: string
          macro_preferences: Json | null
          preferred_cuisines: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: Json
          created_at?: string
          diet_rules?: Json
          dislikes?: Json
          goals?: string | null
          health_conditions?: Json
          id?: string
          macro_preferences?: Json | null
          preferred_cuisines?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: Json
          created_at?: string
          diet_rules?: Json
          dislikes?: Json
          goals?: string | null
          health_conditions?: Json
          id?: string
          macro_preferences?: Json | null
          preferred_cuisines?: Json
          updated_at?: string
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
      instagram_conversations: {
        Row: {
          context: Json | null
          conversation_state: Json | null
          created_at: string | null
          id: string
          ig_user_id: string
          last_message_at: string | null
          message_history: Json | null
          pending_action: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          conversation_state?: Json | null
          created_at?: string | null
          id?: string
          ig_user_id: string
          last_message_at?: string | null
          message_history?: Json | null
          pending_action?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          conversation_state?: Json | null
          created_at?: string | null
          id?: string
          ig_user_id?: string
          last_message_at?: string | null
          message_history?: Json | null
          pending_action?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_links: {
        Row: {
          created_at: string
          id: string
          ig_access_token: string | null
          ig_user_id: string | null
          ig_username: string
          status: string
          token_expires_at: string | null
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ig_access_token?: string | null
          ig_user_id?: string | null
          ig_username: string
          status?: string
          token_expires_at?: string | null
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ig_access_token?: string | null
          ig_user_id?: string | null
          ig_username?: string
          status?: string
          token_expires_at?: string | null
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_verification_challenges: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          ig_username: string
          max_attempts: number
          otp_code_hash: string
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          ig_username: string
          max_attempts?: number
          otp_code_hash: string
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          ig_username?: string
          max_attempts?: number
          otp_code_hash?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_verification_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      learned_preferences: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          last_updated: string | null
          learned_from: string | null
          occurrences: number | null
          preference_type: string
          preference_value: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          learned_from?: string | null
          occurrences?: number | null
          preference_type: string
          preference_value: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          learned_from?: string | null
          occurrences?: number | null
          preference_type?: string
          preference_value?: string
          user_id?: string
        }
        Relationships: []
      }
      logs_profiles: {
        Row: {
          activity_goal_minutes: number | null
          created_at: string
          id: string
          protein_goal_g: number | null
          schedule_preferences: Json
          sleep_goal_hours: number | null
          updated_at: string
          user_id: string
          water_goal_ml: number | null
        }
        Insert: {
          activity_goal_minutes?: number | null
          created_at?: string
          id?: string
          protein_goal_g?: number | null
          schedule_preferences?: Json
          sleep_goal_hours?: number | null
          updated_at?: string
          user_id: string
          water_goal_ml?: number | null
        }
        Update: {
          activity_goal_minutes?: number | null
          created_at?: string
          id?: string
          protein_goal_g?: number | null
          schedule_preferences?: Json
          sleep_goal_hours?: number | null
          updated_at?: string
          user_id?: string
          water_goal_ml?: number | null
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
      pet_schedules: {
        Row: {
          amount: string | null
          created_at: string
          days_of_week: number[]
          id: string
          notes: string | null
          pet_id: string
          reminder_enabled: boolean
          schedule_type: string
          time_of_day: string
          updated_at: string
        }
        Insert: {
          amount?: string | null
          created_at?: string
          days_of_week?: number[]
          id?: string
          notes?: string | null
          pet_id: string
          reminder_enabled?: boolean
          schedule_type: string
          time_of_day: string
          updated_at?: string
        }
        Update: {
          amount?: string | null
          created_at?: string
          days_of_week?: number[]
          id?: string
          notes?: string | null
          pet_id?: string
          reminder_enabled?: boolean
          schedule_type?: string
          time_of_day?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_schedules_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_vet_records: {
        Row: {
          clinic_name: string | null
          cost: number | null
          created_at: string
          diagnosis: string | null
          id: string
          medication_prescribed: string | null
          next_visit_date: string | null
          notes: string | null
          pet_id: string
          record_type: string
          treatment: string | null
          updated_at: string
          vaccination_due_date: string | null
          vaccination_type: string | null
          veterinarian_name: string | null
          visit_date: string
        }
        Insert: {
          clinic_name?: string | null
          cost?: number | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          medication_prescribed?: string | null
          next_visit_date?: string | null
          notes?: string | null
          pet_id: string
          record_type: string
          treatment?: string | null
          updated_at?: string
          vaccination_due_date?: string | null
          vaccination_type?: string | null
          veterinarian_name?: string | null
          visit_date: string
        }
        Update: {
          clinic_name?: string | null
          cost?: number | null
          created_at?: string
          diagnosis?: string | null
          id?: string
          medication_prescribed?: string | null
          next_visit_date?: string | null
          notes?: string | null
          pet_id?: string
          record_type?: string
          treatment?: string | null
          updated_at?: string
          vaccination_due_date?: string | null
          vaccination_type?: string | null
          veterinarian_name?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_vet_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
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
      product_pairings: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          pairing_type: string
          primary_product: string
          reason: string | null
          suggested_product: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          pairing_type: string
          primary_product: string
          reason?: string | null
          suggested_product: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          pairing_type?: string
          primary_product?: string
          reason?: string | null
          suggested_product?: string
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
          notification_preferences: Json | null
          onboarding_completed: boolean
          onboarding_modules: Json | null
          permissions_granted: boolean | null
          preferred_retailer_id: string | null
          preferred_retailer_name: string | null
          seed_completed: boolean | null
          seed_version: string | null
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
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_modules?: Json | null
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          seed_completed?: boolean | null
          seed_version?: string | null
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
          notification_preferences?: Json | null
          onboarding_completed?: boolean
          onboarding_modules?: Json | null
          permissions_granted?: boolean | null
          preferred_retailer_id?: string | null
          preferred_retailer_name?: string | null
          seed_completed?: boolean | null
          seed_version?: string | null
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
      purchase_patterns: {
        Row: {
          co_purchase_count: number
          confidence_score: number | null
          created_at: string
          household_id: string
          id: string
          item_a: string
          item_b: string
          last_purchased_together: string
        }
        Insert: {
          co_purchase_count?: number
          confidence_score?: number | null
          created_at?: string
          household_id: string
          id?: string
          item_a: string
          item_b: string
          last_purchased_together?: string
        }
        Update: {
          co_purchase_count?: number
          confidence_score?: number | null
          created_at?: string
          household_id?: string
          id?: string
          item_a?: string
          item_b?: string
          last_purchased_together?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_patterns_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      recipe_drafts: {
        Row: {
          confidence: number | null
          created_at: string | null
          expires_at: string | null
          household_id: string
          id: string
          parsed_cooking_time: number | null
          parsed_cuisine: string | null
          parsed_image_url: string | null
          parsed_ingredients: Json | null
          parsed_steps: Json | null
          parsed_title: string | null
          raw_input: string | null
          raw_input_type: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          household_id: string
          id?: string
          parsed_cooking_time?: number | null
          parsed_cuisine?: string | null
          parsed_image_url?: string | null
          parsed_ingredients?: Json | null
          parsed_steps?: Json | null
          parsed_title?: string | null
          raw_input?: string | null
          raw_input_type: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          expires_at?: string | null
          household_id?: string
          id?: string
          parsed_cooking_time?: number | null
          parsed_cuisine?: string | null
          parsed_image_url?: string | null
          parsed_ingredients?: Json | null
          parsed_steps?: Json | null
          parsed_title?: string | null
          raw_input?: string | null
          raw_input_type?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cached_at: string | null
          cooking_time: number | null
          created_at: string | null
          cuisine: string | null
          difficulty: string | null
          estimated_calories: number | null
          household_id: string
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_public: boolean | null
          macro_focus: string | null
          match_score: number | null
          name: string
          required_appliances: string[] | null
          servings: number | null
          share_token: string | null
          shared_at: string | null
          source_type: string | null
          source_url: string | null
          tags: Json | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          cached_at?: string | null
          cooking_time?: number | null
          created_at?: string | null
          cuisine?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          household_id: string
          id?: string
          image_url?: string | null
          ingredients: Json
          instructions: Json
          is_public?: boolean | null
          macro_focus?: string | null
          match_score?: number | null
          name: string
          required_appliances?: string[] | null
          servings?: number | null
          share_token?: string | null
          shared_at?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: Json | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          cached_at?: string | null
          cooking_time?: number | null
          created_at?: string | null
          cuisine?: string | null
          difficulty?: string | null
          estimated_calories?: number | null
          household_id?: string
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_public?: boolean | null
          macro_focus?: string | null
          match_score?: number | null
          name?: string
          required_appliances?: string[] | null
          servings?: number | null
          share_token?: string | null
          shared_at?: string | null
          source_type?: string | null
          source_url?: string | null
          tags?: Json | null
          user_id?: string
          view_count?: number | null
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
      shopping_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          household_id: string
          id: string
          instacart_link: string | null
          items: Json
          retailer_name: string | null
          status: string | null
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          household_id: string
          id?: string
          instacart_link?: string | null
          items?: Json
          retailer_name?: string | null
          status?: string | null
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          household_id?: string
          id?: string
          instacart_link?: string | null
          items?: Json
          retailer_name?: string | null
          status?: string | null
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
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
      social_import_drafts: {
        Row: {
          confidence: number | null
          created_at: string
          domain_hint: string | null
          expires_at: string
          id: string
          ig_conversation_id: string | null
          parsed_ingredients_json: Json | null
          parsed_products_json: Json | null
          parsed_steps_json: Json | null
          parsed_title: string | null
          platform: string
          raw_input_payload: Json | null
          raw_input_type: string | null
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          domain_hint?: string | null
          expires_at?: string
          id?: string
          ig_conversation_id?: string | null
          parsed_ingredients_json?: Json | null
          parsed_products_json?: Json | null
          parsed_steps_json?: Json | null
          parsed_title?: string | null
          platform?: string
          raw_input_payload?: Json | null
          raw_input_type?: string | null
          source_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          domain_hint?: string | null
          expires_at?: string
          id?: string
          ig_conversation_id?: string | null
          parsed_ingredients_json?: Json | null
          parsed_products_json?: Json | null
          parsed_steps_json?: Json | null
          parsed_title?: string | null
          platform?: string
          raw_input_payload?: Json | null
          raw_input_type?: string | null
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_import_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      voice_notes: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          extracted_items: Json | null
          household_id: string | null
          id: string
          transcription: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          extracted_items?: Json | null
          household_id?: string | null
          id?: string
          transcription: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          extracted_items?: Json | null
          household_id?: string | null
          id?: string
          transcription?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
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
      clean_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_category_onboarding: {
        Args: { p_user_id: string }
        Returns: undefined
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
      category_type: "food" | "beauty" | "pets" | "household" | "logs" | "body"
      inventory_category: "fridge" | "pantry" | "beauty" | "pets"
      inventory_status:
        | "sufficient"
        | "low"
        | "critical"
        | "out"
        | "out_of_stock"
        | "likely_spoiled"
      onboarding_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "skipped_optional"
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
      category_type: ["food", "beauty", "pets", "household", "logs", "body"],
      inventory_category: ["fridge", "pantry", "beauty", "pets"],
      inventory_status: [
        "sufficient",
        "low",
        "critical",
        "out",
        "out_of_stock",
        "likely_spoiled",
      ],
      onboarding_status: [
        "not_started",
        "in_progress",
        "completed",
        "skipped_optional",
      ],
    },
  },
} as const
