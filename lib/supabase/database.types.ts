// Generated from the Supabase schema (supabase gen types). Regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      admins: {
        Row: { added_at: string; email: string };
        Insert: { added_at?: string; email: string };
        Update: { added_at?: string; email?: string };
        Relationships: [];
      };
      categories: {
        Row: { emoji: string; id: string; name: string; sort: number; tint: string };
        Insert: { emoji?: string; id: string; name: string; sort?: number; tint?: string };
        Update: { emoji?: string; id?: string; name?: string; sort?: number; tint?: string };
        Relationships: [];
      };
      offers: {
        Row: { in_stock: boolean; original_price: number; price: number; product_id: string; retailer_id: string; shipping: number; updated_at: string; url: string };
        Insert: { in_stock?: boolean; original_price: number; price: number; product_id: string; retailer_id: string; shipping?: number; updated_at?: string; url?: string };
        Update: { in_stock?: boolean; original_price?: number; price?: number; product_id?: string; retailer_id?: string; shipping?: number; updated_at?: string; url?: string };
        Relationships: [
          { foreignKeyName: "offers_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "offers_retailer_id_fkey"; columns: ["retailer_id"]; isOneToOne: false; referencedRelation: "retailers"; referencedColumns: ["id"] },
        ];
      };
      price_alerts: {
        Row: { created_at: string; enabled: boolean; product_id: string; target_price: number; user_id: string };
        Insert: { created_at?: string; enabled?: boolean; product_id: string; target_price: number; user_id: string };
        Update: { created_at?: string; enabled?: boolean; product_id?: string; target_price?: number; user_id?: string };
        Relationships: [{ foreignKeyName: "price_alerts_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }];
      };
      price_history: {
        Row: { day: string; price: number; product_id: string; retailer_id: string };
        Insert: { day: string; price: number; product_id: string; retailer_id: string };
        Update: { day?: string; price?: number; product_id?: string; retailer_id?: string };
        Relationships: [
          { foreignKeyName: "price_history_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "price_history_retailer_id_fkey"; columns: ["retailer_id"]; isOneToOne: false; referencedRelation: "retailers"; referencedColumns: ["id"] },
        ];
      };
      product_events: {
        Row: { created_at: string; id: number; kind: string; product_id: string; retailer_id: string | null; user_id: string | null };
        Insert: { created_at?: string; id?: never; kind: string; product_id: string; retailer_id?: string | null; user_id?: string | null };
        Update: { created_at?: string; id?: never; kind?: string; product_id?: string; retailer_id?: string | null; user_id?: string | null };
        Relationships: [
          { foreignKeyName: "product_events_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "product_events_retailer_id_fkey"; columns: ["retailer_id"]; isOneToOne: false; referencedRelation: "retailers"; referencedColumns: ["id"] },
        ];
      };
      products: {
        Row: {
          brand: string; category_id: string; created_at: string; description: string; emoji: string; highlights: string[]; id: string; image: string;
          is_new: boolean; name: string; published: boolean; rating: number; review_count: number; slug: string; sort: number; subcategory: string;
          tags: string[]; trending: boolean; updated_at: string; vibes: string[];
        };
        Insert: {
          brand: string; category_id: string; created_at?: string; description?: string; emoji?: string; highlights?: string[]; id?: string; image?: string;
          is_new?: boolean; name: string; published?: boolean; rating?: number; review_count?: number; slug: string; sort?: number; subcategory?: string;
          tags?: string[]; trending?: boolean; updated_at?: string; vibes?: string[];
        };
        Update: {
          brand?: string; category_id?: string; created_at?: string; description?: string; emoji?: string; highlights?: string[]; id?: string; image?: string;
          is_new?: boolean; name?: string; published?: boolean; rating?: number; review_count?: number; slug?: string; sort?: number; subcategory?: string;
          tags?: string[]; trending?: boolean; updated_at?: string; vibes?: string[];
        };
        Relationships: [{ foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: {
          budget: string | null; created_at: string; email: string | null; full_name: string; id: string; interests: string[]; onboarded: boolean;
          platforms: string[]; streak: number; streak_day: string | null; updated_at: string;
        };
        Insert: {
          budget?: string | null; created_at?: string; email?: string | null; full_name?: string; id: string; interests?: string[]; onboarded?: boolean;
          platforms?: string[]; streak?: number; streak_day?: string | null; updated_at?: string;
        };
        Update: {
          budget?: string | null; created_at?: string; email?: string | null; full_name?: string; id?: string; interests?: string[]; onboarded?: boolean;
          platforms?: string[]; streak?: number; streak_day?: string | null; updated_at?: string;
        };
        Relationships: [];
      };
      retailers: {
        Row: { active: boolean; color: string; homepage: string | null; id: string; name: string; short: string; sort: number; text_color: string };
        Insert: { active?: boolean; color: string; homepage?: string | null; id: string; name: string; short: string; sort?: number; text_color?: string };
        Update: { active?: boolean; color?: string; homepage?: string | null; id?: string; name?: string; short?: string; sort?: number; text_color?: string };
        Relationships: [];
      };
      saved_items: {
        Row: { created_at: string; product_id: string; user_id: string };
        Insert: { created_at?: string; product_id: string; user_id: string };
        Update: { created_at?: string; product_id?: string; user_id?: string };
        Relationships: [{ foreignKeyName: "saved_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }];
      };
      swipes: {
        Row: { action: string; created_at: string; id: number; product_id: string; user_id: string };
        Insert: { action: string; created_at?: string; id?: never; product_id: string; user_id: string };
        Update: { action?: string; created_at?: string; id?: never; product_id?: string; user_id?: string };
        Relationships: [{ foreignKeyName: "swipes_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }];
      };
    };
    Views: {
      product_price_stats: {
        Row: { avg_90: number | null; days: number | null; high_90: number | null; low_90: number | null; product_id: string | null };
        Relationships: [{ foreignKeyName: "price_history_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }];
      };
    };
    Functions: {
      admin_overview: { Args: { days?: number }; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
