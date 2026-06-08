import { Database } from '../types/database';
import { supabase } from './supabase';

// Typages stricts extraits de ton schéma de base de données Supabase
export type ColisInsert = Database['public']['Tables']['colis']['Insert'];
export type ColisUpdate = Database['public']['Tables']['colis']['Update'];
export type Colis = Database['public']['Tables']['colis']['Row'];

// Type sécurisé pour les modes de paiement acceptés sur l'application
export type MoyenPaiement = 'especes' | 'wave' | 'orange_money';

export const colisService = {
  
  /**
   * 1. Créer une nouvelle demande de livraison de colis
   * CORRECTION : "as any" sur la table pour débloquer la méthode .insert()
   */
  createColis: async (colis: ColisInsert): Promise<Colis> => {
    try {
      console.log('[colisService] Création du colis en cours...', colis);
      
      const { data, error } = await (supabase.from('colis') as any)
        .insert(colis)
        .select()
        .single();

      if (error) {
        console.error('[colisService] Erreur Supabase lors de la création:', error);
        throw error;
      }

      console.log('[colisService] Colis créé avec succès:', data);
      return data as Colis;
    } catch (error) {
      console.error('[colisService] Échec de la fonction createColis:', error);
      throw error;
    }
  },

  /**
   * 2. Récupérer l'historique des colis d'un client spécifique
   */
  fetchColisForClient: async (clientId: string): Promise<any[]> => {
    try {
      console.log('[colisService] Récupération des colis pour le client:', clientId);
      
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          *,
          chauffeur_profile:profiles!id_chauffeur (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('id_client', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[colisService] Erreur lors de la récupération client:', error);
        throw error;
      }

      return (data as unknown as any[]) || [];
    } catch (error) {
      console.error('[colisService] Échec de la fonction fetchColisForClient:', error);
      throw error;
    }
  },

  /**
   * 3. Récupérer tous les colis disponibles sur le réseau (Vue Chauffeur)
   */
  fetchAllColis: async (): Promise<any[]> => {
    try {
      console.log('[colisService] Récupération globale des colis en attente...');
      
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          *,
          client_profile:profiles!id_client (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('statut', 'en_attente')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[colisService] Erreur lors du fetch global:', error);
        throw error;
      }
      
      return (data as unknown as any[]) || [];
    } catch (error) {
      console.error('[colisService] Échec de la fonction fetchAllColis:', error);
      throw error;
    }
  },

  /**
   * 4. Mettre à jour les informations ou le statut d'un colis
   * CORRECTION : "as any" sur la table pour débloquer la méthode .update()
   */
  updateColis: async (id: string | number, updates: ColisUpdate): Promise<Colis> => {
    try {
      console.log('[colisService] Mise à jour du colis:', id, 'avec:', updates);
      
      const { data, error } = await (supabase.from('colis') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[colisService] Erreur lors de la modification:', error);
        throw error;
      }

      return data as Colis;
    } catch (error) {
      console.error('[colisService] Échec de la fonction updateColis:', error);
      throw error;
    }
  },

  /**
   * 5. Supprimer ou annuler définitivement une livraison
   */
  deleteColis: async (id: string | number): Promise<void> => {
    try {
      console.log('[colisService] Suppression définitive du colis:', id);
      
      const { error } = await (supabase.from('colis') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[colisService] Erreur lors de la suppression:', error);
        throw error;
      }

      console.log('[colisService] Colis supprimé avec succès de Supabase');
    } catch (error) {
      console.error('[colisService] Échec de la fonction deleteColis:', error);
      throw error;
    }
  },

  /**
   * 6. Récupérer la liste des colis pris en charge par un chauffeur
   */
  fetchColisForDriver: async (driverId: string): Promise<any[]> => {
    try {
      console.log('[colisService] Récupération des livraisons affectées au chauffeur:', driverId);
      
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          *,
          client_profile:profiles!id_client (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('id_chauffeur', driverId)
        .eq('statut', 'accepte')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[colisService] Erreur de récupération chauffeur:', error);
        throw error;
      }
      
      return (data as unknown as any[]) || [];
    } catch (error) {
      console.error('[colisService] Échec de la fonction fetchColisForDriver:', error);
      throw error;
    }
  },
};

export default colisService;