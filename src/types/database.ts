/**
 * Supabase Database types (generated via MCP Supabase plugin – run generate_typescript_types to refresh).
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.1' };
  public: {
    Tables: {
      favorites: {
        Row: { clerk_id: string; created_at: string | null; id: string; mls_listing_id: string };
        Insert: { clerk_id: string; created_at?: string | null; id?: string; mls_listing_id: string };
        Update: { clerk_id?: string; created_at?: string | null; id?: string; mls_listing_id?: string };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email_address: string | null;
          cinc_score: number | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          assigned_broker_id: string | null;
          assigned_lender_id: string | null;
          marketing_opted_out_at: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          last_login: string | null;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'marketing_opted_out_at'> & { id?: string; marketing_opted_out_at?: string | null };
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
        Relationships: [];
      };
      listings: {
        Row: {
          address: string | null;
          baths: number | null;
          beds: number | null;
          city: string | null;
          created_at: string | null;
          description: string | null;
          expiration_date: string | null;
          id: string;
          image_url: string | null;
          images: Json | null;
          latitude: number | null;
          listing_agent_name: string | null;
          listing_firm_name: string;
          longitude: number | null;
          lot_size_sqft: number | null;
          mls_listing_id: string;
          parking_spaces: number | null;
          price: number | null;
          property_type: string | null;
          seller_contact: string | null;
          showing_instructions: string | null;
          sqft: number | null;
          state: string | null;
          status: string;
          updated_at: string | null;
          year_built: number | null;
          zip: string | null;
        };
        Insert: Partial<Database['public']['Tables']['listings']['Row']> & { listing_firm_name: string; mls_listing_id: string; status: string };
        Update: Partial<Database['public']['Tables']['listings']['Row']>;
        Relationships: [];
      };
      saved_properties: {
        Row: { clerk_user_id: string; created_at: string; id: string; mls_number: string; property_data: Json | null };
        Insert: { clerk_user_id: string; created_at?: string; id?: string; mls_number: string; property_data?: Json | null };
        Update: { clerk_user_id?: string; created_at?: string; id?: string; mls_number?: string; property_data?: Json | null };
        Relationships: [{ foreignKeyName: 'saved_properties_clerk_user_id_fkey'; columns: ['clerk_user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['clerk_id'] }];
      };
      saved_searches: {
        Row: { clerk_id: string; created_at: string | null; criteria: Json; id: string; name: string | null; repliers_saved_search_id: string | null; updated_at: string | null };
        Insert: { clerk_id: string; created_at?: string | null; criteria?: Json; id?: string; name?: string | null; repliers_saved_search_id?: string | null; updated_at?: string | null };
        Update: { clerk_id?: string; created_at?: string | null; criteria?: Json; id?: string; name?: string | null; repliers_saved_search_id?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      users: {
        Row: {
          assigned_broker_id: string | null;
          assigned_lender_id: string | null;
          clerk_id: string;
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          marketing_opt_in: boolean | null;
          repliers_client_id: number | null;
          role: string | null;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
        Relationships: [];
      };
      webhook_events: {
        Row: { created_at: string | null; event_id: string; id: string; source: string };
        Insert: { created_at?: string | null; event_id: string; id?: string; source: string };
        Update: { created_at?: string | null; event_id?: string; id?: string; source?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database['public'];
export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Update'];
