export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chauffeur_details: {
        Row: {
          id: string
          vehicle_model: string | null
          vehicle_plate: string | null
          license_number: string | null
          identity_card_url: string | null
          driving_license_url: string | null
          vehicle_insurance_url: string | null
          is_verified: boolean
          verified_by: string | null
          verified_at: string | null
          is_online: boolean
          latitude: number | null
          longitude: number | null
          last_location_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          license_number?: string | null
          identity_card_url?: string | null
          driving_license_url?: string | null
          vehicle_insurance_url?: string | null
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          is_online?: boolean
          latitude?: number | null
          longitude?: number | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          license_number?: string | null
          identity_card_url?: string | null
          driving_license_url?: string | null
          vehicle_insurance_url?: string | null
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          is_online?: boolean
          latitude?: number | null
          longitude?: number | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tarifs: {
        Row: {
          id: string
          vehicle_type: string
          base_fare: number
          price_per_km: number
          price_per_minute: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_type: string
          base_fare?: number
          price_per_km?: number
          price_per_minute?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_type?: string
          base_fare?: number
          price_per_km?: number
          price_per_minute?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          client_id: string
          chauffeur_id: string | null
          status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          distance_km: number | null
          estimated_duration_mins: number | null
          estimated_price: number | null
          final_price: number | null
          commission_rate: number
          commission_amount: number | null
          cancellation_reason: string | null
          created_at: string
          accepted_at: string | null
          started_at: string | null
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          chauffeur_id?: string | null
          status?: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          destination_address: string
          destination_latitude: number
          destination_longitude: number
          distance_km?: number | null
          estimated_duration_mins?: number | null
          estimated_price?: number | null
          final_price?: number | null
          commission_rate?: number
          commission_amount?: number | null
          cancellation_reason?: string | null
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          chauffeur_id?: string | null
          status?: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled'
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          destination_address?: string
          destination_latitude?: number
          destination_longitude?: number
          distance_km?: number | null
          estimated_duration_mins?: number | null
          estimated_price?: number | null
          final_price?: number | null
          commission_rate?: number
          commission_amount?: number | null
          cancellation_reason?: string | null
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
      }
      paiements: {
        Row: {
          id: string
          course_id: string
          amount: number
          payment_method: 'cash' | 'wave' | 'orange_money' | 'free_money' | 'card'
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          amount: number
          payment_method?: 'cash' | 'wave' | 'orange_money' | 'free_money' | 'card'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          amount?: number
          payment_method?: 'cash' | 'wave' | 'orange_money' | 'free_money' | 'card'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trajets: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          id_chauffeur: string
          point_depart: string
          point_destination: string
          heure_depart: string
          heure_arrivee: string
          prix_estime: number
          description: string | null
          statut: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          id_chauffeur: string
          point_depart: string
          point_destination: string
          heure_depart: string
          heure_arrivee: string
          prix_estime?: number
          description?: string | null
          statut?: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          id_chauffeur?: string
          point_depart?: string
          point_destination?: string
          heure_depart?: string
          heure_arrivee?: string
          prix_estime?: number
          description?: string | null
          statut?: string
        }
      }
      colis: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          id_client: string
          point_depart: string
          point_destination: string
          description: string
          poids: number
          prix_offert: number
          statut: string
          id_chauffeur: string | null
          mode_paiement: string | null
          photo_url: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          id_client: string
          point_depart: string
          point_destination: string
          description: string
          poids?: number
          prix_offert?: number
          statut?: string
          id_chauffeur?: string | null
          mode_paiement?: string | null
          photo_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          id_client?: string
          point_depart?: string
          point_destination?: string
          description?: string
          poids?: number
          prix_offert?: number
          statut?: string
          id_chauffeur?: string | null
          mode_paiement?: string | null
          photo_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'client' | 'chauffeur' | 'coacheur' | 'superviseur'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]