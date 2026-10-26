// Generated from the Supabase schema (supabase gen types). Regenerate after schema changes.
export type Gender = "female" | "male" | "nonbinary" | "prefer_not_to_say";

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
      brands: {
        Row: {
          color: string; cover_url: string; created_at: string; description: string; featured: boolean; id: string; logo_url: string; name: string;
          published: boolean; retailer_id: string | null; sort: number; store_url: string | null; tagline: string; updated_at: string;
        };
        Insert: {
          color?: string; cover_url?: string; created_at?: string; description?: string; featured?: boolean; id: string; logo_url?: string; name: string;
          published?: boolean; retailer_id?: string | null; sort?: number; store_url?: string | null; tagline?: string; updated_at?: string;
        };
        Update: {
          color?: string; cover_url?: string; created_at?: string; description?: string; featured?: boolean; id?: string; logo_url?: string; name?: string;
          published?: boolean; retailer_id?: string | null; sort?: number; store_url?: string | null; tagline?: string; updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: { emoji: string; id: string; name: string; sort: number; tint: string };
        Insert: { emoji?: string; id: string; name: string; sort?: number; tint?: string };
        Update: { emoji?: string; id?: string; name?: string; sort?: number; tint?: string };
        Relationships: [];
      };
      feedback: {
        Row: { created_at: string; email: string | null; id: number; message: string; page: string | null; rating: number | null; status: string; user_id: string | null };
        Insert: { created_at?: string; email?: string | null; id?: never; message: string; page?: string | null; rating?: number | null; status?: string; user_id?: string | null };
        Update: { created_at?: string; email?: string | null; id?: never; message?: string; page?: string | null; rating?: number | null; status?: string; user_id?: string | null };
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
          brand: string; brand_id: string | null; category_id: string; created_at: string; description: string; emoji: string; highlights: string[]; id: string; image: string;
          is_new: boolean; name: string; price_tracked: boolean; published: boolean; rating: number; review_requested_at: string | null; review_requested_by: string | null; review_count: number; slug: string; sort: number; subcategory: string;
          tags: string[]; trending: boolean; updated_at: string; vibes: string[];
        };
        Insert: {
          brand: string; brand_id?: string | null; category_id: string; created_at?: string; description?: string; emoji?: string; highlights?: string[]; id?: string; image?: string;
          is_new?: boolean; name: string; price_tracked?: boolean; published?: boolean; review_requested_at?: string | null; review_requested_by?: string | null; rating?: number; review_count?: number; slug: string; sort?: number; subcategory?: string;
          tags?: string[]; trending?: boolean; updated_at?: string; vibes?: string[];
        };
        Update: {
          brand?: string; brand_id?: string | null; category_id?: string; created_at?: string; description?: string; emoji?: string; highlights?: string[]; id?: string; image?: string;
          is_new?: boolean; name?: string; price_tracked?: boolean; published?: boolean; review_requested_at?: string | null; review_requested_by?: string | null; rating?: number; review_count?: number; slug?: string; sort?: number; subcategory?: string;
          tags?: string[]; trending?: boolean; updated_at?: string; vibes?: string[];
        };
        Relationships: [{ foreignKeyName: "products_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: {
          budget: string | null; created_at: string; email: string | null; full_name: string; id: string; interests: string[]; onboarded: boolean;
          platforms: string[]; role: Database["public"]["Enums"]["app_role"]; streak: number; streak_day: string | null; updated_at: string;
          terms_accepted_at: string | null; terms_version: string | null; privacy_ack_at: string | null; marketing_opt_in: boolean; analytics_opt_in: boolean;
          birthdate: string | null; gender: Gender | null; city: string | null; province: string | null; avatar_url: string | null; profile_completed_at: string | null;
          name_approved_at: string | null; name_approved_by: string | null;
        };
        Insert: {
          budget?: string | null; created_at?: string; email?: string | null; full_name?: string; id: string; interests?: string[]; onboarded?: boolean;
          platforms?: string[]; streak?: number; streak_day?: string | null; updated_at?: string;
        };
        Update: {
          budget?: string | null; created_at?: string; email?: string | null; full_name?: string; id?: string; interests?: string[]; onboarded?: boolean;
          platforms?: string[]; streak?: number; streak_day?: string | null; updated_at?: string;
          birthdate?: string | null; gender?: Gender | null; city?: string | null; province?: string | null;
        };
        Relationships: [];
      };
      product_change_requests: {
        Row: {
          changes: Json; created_at: string; id: number; note: string; product_id: string; requested_by: string | null; requested_by_email: string | null;
          review_note: string; reviewed_at: string | null; reviewed_by: string | null; reviewed_by_email: string | null; status: "pending" | "approved" | "rejected";
        };
        Insert: { changes: Json; note?: string; product_id: string; requested_by: string; status?: "pending" };
        Update: never;
        Relationships: [{ foreignKeyName: "product_change_requests_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }];
      };
      consent_events: {
        Row: {
          created_at: string; granted: boolean; id: number; kind: "terms" | "privacy" | "marketing" | "analytics"; source: "signup" | "consent_sheet" | "settings";
          user_id: string; version: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      account_actions: {
        Row: {
          action: "approve_name" | "unapprove_name" | "rename" | "delete"; actor: string | null; actor_email: string; created_at: string; detail: string;
          id: number; target_email: string; target_user: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      role_changes: {
        Row: {
          changed_by: string | null; changed_by_email: string | null; created_at: string; id: number; new_role: Database["public"]["Enums"]["app_role"];
          old_role: Database["public"]["Enums"]["app_role"] | null; user_email: string; user_id: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      retailers: {
        Row: { active: boolean; affiliate_url: string | null; color: string; homepage: string | null; id: string; name: string; short: string; sort: number; text_color: string };
        Insert: { active?: boolean; affiliate_url?: string | null; color: string; homepage?: string | null; id: string; name: string; short: string; sort?: number; text_color?: string };
        Update: { active?: boolean; affiliate_url?: string | null; color?: string; homepage?: string | null; id?: string; name?: string; short?: string; sort?: number; text_color?: string };
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
      approve_product_change: { Args: { request_id: number }; Returns: undefined };
      reject_product_change: { Args: { request_id: number; note?: string }; Returns: undefined };
      current_app_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] | null };
      is_admin: { Args: never; Returns: boolean };
      is_editor: { Args: never; Returns: boolean };
      approve_shopper_name: { Args: { target: string; approved?: boolean }; Returns: undefined };
      admin_set_shopper_name: { Args: { target: string; new_name: string }; Returns: undefined };
      delete_shopper: { Args: { target: string; confirm_email: string }; Returns: undefined };
      product_teaser: { Args: never; Returns: { name: string; brand: string; image: string; emoji: string; category_id: string }[] };
      public_deals: {
        Args: { want?: number };
        Returns: {
          slug: string; name: string; brand: string; brand_id: string | null; category_id: string; subcategory: string; emoji: string; image: string;
          tags: string[]; vibes: string[]; rating: number; review_count: number;
          price: number; original_price: number; retailer_id: string; discount_pct: number;
        }[];
      };
      is_super_admin: { Args: never; Returns: boolean };
      list_team: {
        Args: never;
        Returns: { created_at: string; email: string; email_confirmed: boolean; full_name: string; id: string; role: Database["public"]["Enums"]["app_role"] }[];
      };
      set_my_consents: {
        Args: { terms?: boolean; privacy?: boolean; marketing?: boolean; analytics?: boolean; version?: string; source?: "consent_sheet" | "settings" };
        Returns: undefined;
      };
      set_user_role: { Args: { target: string; new_role: Database["public"]["Enums"]["app_role"] }; Returns: undefined };
    };
    Enums: { app_role: "customer" | "editor" | "admin" | "super_admin" };
    CompositeTypes: { [_ in never]: never };
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
