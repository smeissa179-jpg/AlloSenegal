import { Database } from '../types/database';
import { supabase } from './supabase';

export type TrajetInsert = Database['public']['Tables']['trajets']['Insert'];
export type TrajetUpdate = Database['public']['Tables']['trajets']['Update'];
export type Trajet = Database['public']['Tables']['trajets']['Row'];

export const trajetService = {
  // Create a new trajet
  createTrajet: async (trajet: TrajetInsert): Promise<Trajet> => {
    try {
      console.log('[trajetService] Creating trajet:', trajet);
      const { data, error } = await (supabase.from('trajets') as any)
        .insert(trajet)
        .select()
        .single();
      if (error) {
        console.error('[trajetService] Create error:', error);
        throw error;
      }
      console.log('[trajetService] Trajet created:', data);
      return data;
    } catch (error) {
      console.error('[trajetService] createTrajet failed:', error);
      throw error;
    }
  },

  // Fetch all trajets for a driver
  fetchTrajetsForDriver: async (driverId: string): Promise<Trajet[]> => {
    try {
      console.log('[trajetService] Fetching trajets for driver:', driverId);
      const { data, error } = await (supabase.from('trajets') as any)
        .select('*')
        .eq('id_chauffeur', driverId);
      if (error) {
        console.error('[trajetService] Fetch error:', error);
        throw error;
      }
      console.log('[trajetService] Trajets fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('[trajetService] fetchTrajetsForDriver failed:', error);
      throw error;
    }
  },

  // Fetch all trajets (for clients to see available routes)
  fetchAllTrajets: async (): Promise<Trajet[]> => {
    try {
      console.log('[trajetService] Fetching all trajets...');
      const { data, error } = await (supabase.from('trajets') as any).select('*');
      if (error) {
        console.error('[trajetService] Fetch error:', error);
        throw error;
      }
      console.log('[trajetService] All trajets fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('[trajetService] fetchAllTrajets failed:', error);
      throw error;
    }
  },

  // NOUNOUVELLE FONCTION : Rechercher des trajets par départ et destination
  searchTrajets: async (pickup: string, destination: string): Promise<Trajet[]> => {
    try {
      console.log('[trajetService] Searching trajets from', pickup, 'to', destination);
      const { data, error } = await (supabase.from('trajets') as any)
        .select('*')
        .ilike('point_depart', `%${pickup}%`)
        .ilike('point_destination', `%${destination}%`);

      if (error) {
        console.error('[trajetService] Search error:', error);
        throw error;
      }
      console.log('[trajetService] Search result:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('[trajetService] searchTrajets failed:', error);
      throw error;
    }
  },

  // Update a trajet
  updateTrajet: async (trajetId: number, updates: TrajetUpdate): Promise<Trajet> => {
    try {
      console.log('[trajetService] Updating trajet:', trajetId, updates);
      const { data, error } = await (supabase.from('trajets') as any)
        .update(updates)
        .eq('id', trajetId)
        .select()
        .single();
      if (error) {
        console.error('[trajetService] Update error:', error);
        throw error;
      }
      console.log('[trajetService] Trajet updated:', data);
      return data;
    } catch (error) {
      console.error('[trajetService] updateTrajet failed:', error);
      throw error;
    }
  },

  // Delete a trajet
  deleteTrajet: async (trajetId: number): Promise<void> => {
    try {
      console.log('[trajetService] Deleting trajet:', trajetId);
      const { error } = await (supabase.from('trajets') as any).delete().eq('id', trajetId);
      if (error) {
        console.error('[trajetService] Delete error:', error);
        throw error;
      }
      console.log('[trajetService] Trajet deleted successfully');
    } catch (error) {
      console.error('[trajetService] deleteTrajet failed:', error);
      throw error;
    }
  },
};

export default trajetService;